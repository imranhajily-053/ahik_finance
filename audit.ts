import { prisma } from "@/lib/prisma";
import { AuditAction, Prisma } from "@prisma/client";

/**
 * Bənd 25/50: Audit log append-only-dur. Bu modulun kənarında heç bir yerdə
 * `prisma.auditLog.update` və ya `.delete` çağırılmamalıdır — bilərəkdən
 * yalnız `create` funksiyası ixrac olunur.
 */
export async function writeAuditLog(params: {
  entity: string;
  entityId: string;
  action: AuditAction;
  userId: string;
  fieldName?: string;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      entity: params.entity,
      entityId: params.entityId,
      action: params.action,
      userId: params.userId,
      fieldName: params.fieldName,
      oldValue: params.oldValue !== undefined ? JSON.stringify(params.oldValue, jsonReplacer) : null,
      newValue: params.newValue !== undefined ? JSON.stringify(params.newValue, jsonReplacer) : null,
    },
  });
}

// Prisma.Decimal və Date obyektlərini JSON-a düzgün seriallaşdırmaq üçün
function jsonReplacer(_key: string, value: unknown) {
  if (value instanceof Prisma.Decimal) return value.toString();
  return value;
}
