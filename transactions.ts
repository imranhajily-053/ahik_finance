import { prisma } from "@/lib/prisma";
import { validateOvernightRule, type TransactionInput } from "@/lib/validation/transaction";
import { writeAuditLog } from "@/lib/services/audit";
import { AuditAction, TransactionStatus } from "@prisma/client";

export class BusinessRuleError extends Error {}
export class NotFoundError extends Error {}

export interface TransactionFilters {
  dateFrom?: Date;
  dateTo?: Date;
  purposeId?: string;
  sourceOrganizationId?: string;
  /** Prezident Administrasiyası seçiləndə onun BÜTÜN alt təşkilatlarını da daxil et */
  organizationIdsIncludingChildren?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
}

function buildWhere(filters: TransactionFilters) {
  const where: any = { status: TransactionStatus.ACTIVE, deletedAt: null };

  if (filters.dateFrom || filters.dateTo) {
    where.transactionDate = {};
    if (filters.dateFrom) where.transactionDate.gte = filters.dateFrom;
    if (filters.dateTo) where.transactionDate.lte = filters.dateTo;
  }
  if (filters.purposeId) where.purposeId = filters.purposeId;

  if (filters.organizationIdsIncludingChildren?.length) {
    where.sourceOrganizationId = { in: filters.organizationIdsIncludingChildren };
  } else if (filters.sourceOrganizationId) {
    where.sourceOrganizationId = filters.sourceOrganizationId;
  }

  if (filters.search) {
    where.description = { contains: filters.search, mode: "insensitive" };
  }

  return where;
}

export async function listTransactions(filters: TransactionFilters) {
  const page = filters.page ?? 1;
  const pageSize = Math.min(filters.pageSize ?? 25, 200); // server-side pagination (bənd 33)
  const where = buildWhere(filters);

  const [rows, total] = await Promise.all([
    prisma.incomeTransaction.findMany({
      where,
      include: { sourceOrganization: true, purpose: true, createdBy: true },
      orderBy: { transactionDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.incomeTransaction.count({ where }),
  ]);

  return { rows, total, page, pageSize };
}

/** Eyni gün+mənbə+təyinat+məbləğ üzrə mövcud yazı varmı — YALNIZ xəbərdarlıq üçün, BLOK ETMİR (bənd 37). */
async function findPossibleDuplicate(input: TransactionInput) {
  return prisma.incomeTransaction.findFirst({
    where: {
      status: TransactionStatus.ACTIVE,
      transactionDate: new Date(input.transactionDate),
      sourceOrganizationId: input.sourceOrganizationId,
      purposeId: input.purposeId,
      amount: input.amount,
    },
  });
}

export async function createTransaction(input: TransactionInput, userId: string) {
  const purpose = await prisma.purpose.findUnique({ where: { id: input.purposeId } });
  if (!purpose || !purpose.active) throw new BusinessRuleError("Seçilmiş təyinat mövcud deyil.");

  const ruleCheck = validateOvernightRule({
    sourceOrganizationId: input.sourceOrganizationId,
    purposeAllowsEmptySource: purpose.allowsEmptySource,
  });
  if (!ruleCheck.valid) throw new BusinessRuleError(ruleCheck.message);

  if (input.sourceOrganizationId) {
    const org = await prisma.organization.findUnique({ where: { id: input.sourceOrganizationId } });
    if (!org || !org.active) throw new BusinessRuleError("Seçilmiş mənbə təşkilat mövcud deyil.");
  }

  const possibleDuplicate = await findPossibleDuplicate(input);

  const created = await prisma.incomeTransaction.create({
    data: {
      transactionDate: new Date(input.transactionDate),
      sourceOrganizationId: input.sourceOrganizationId,
      purposeId: input.purposeId,
      amount: input.amount,
      currency: input.currency,
      description: input.description ?? null,
      createdById: userId,
      duplicateOfId: possibleDuplicate?.id ?? null,
    },
  });

  await writeAuditLog({
    entity: "IncomeTransaction",
    entityId: created.id,
    action: AuditAction.CREATE,
    userId,
    newValue: created,
  });

  return { transaction: created, possibleDuplicateWarning: Boolean(possibleDuplicate) };
}

export async function updateTransaction(
  id: string,
  input: Partial<TransactionInput>,
  userId: string
) {
  const existing = await prisma.incomeTransaction.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) throw new NotFoundError("Əməliyyat tapılmadı.");

  const nextPurposeId = input.purposeId ?? existing.purposeId;
  const nextSourceId =
    input.sourceOrganizationId !== undefined ? input.sourceOrganizationId : existing.sourceOrganizationId;

  const purpose = await prisma.purpose.findUnique({ where: { id: nextPurposeId } });
  if (!purpose) throw new BusinessRuleError("Seçilmiş təyinat mövcud deyil.");

  const ruleCheck = validateOvernightRule({
    sourceOrganizationId: nextSourceId,
    purposeAllowsEmptySource: purpose.allowsEmptySource,
  });
  if (!ruleCheck.valid) throw new BusinessRuleError(ruleCheck.message);

  const updated = await prisma.incomeTransaction.update({
    where: { id },
    data: {
      ...(input.transactionDate && { transactionDate: new Date(input.transactionDate) }),
      sourceOrganizationId: nextSourceId,
      purposeId: nextPurposeId,
      ...(input.amount !== undefined && { amount: input.amount }),
      ...(input.currency && { currency: input.currency }),
      ...(input.description !== undefined && { description: input.description }),
      updatedById: userId,
    },
  });

  await writeAuditLog({
    entity: "IncomeTransaction",
    entityId: id,
    action: AuditAction.UPDATE,
    userId,
    oldValue: existing,
    newValue: updated,
  });

  return updated;
}

/** Soft delete (bənd 25) — status=VOID + deletedAt, fiziki DELETE heç vaxt icra edilmir. */
export async function deleteTransaction(id: string, userId: string) {
  const existing = await prisma.incomeTransaction.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) throw new NotFoundError("Əməliyyat tapılmadı.");

  const deleted = await prisma.incomeTransaction.update({
    where: { id },
    data: { status: TransactionStatus.VOID, deletedAt: new Date(), updatedById: userId },
  });

  await writeAuditLog({
    entity: "IncomeTransaction",
    entityId: id,
    action: AuditAction.DELETE,
    userId,
    oldValue: existing,
  });

  return deleted;
}
