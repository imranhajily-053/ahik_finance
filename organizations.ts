import { prisma } from "@/lib/prisma";

/**
 * Bənd 7 — Ağıllı təşkilat axtarışı.
 * "İstisu" → "İstisu" MİK + "İstisu" mineral sular zavodu tapılmalıdır.
 * Prisma tərəfində case-insensitive `contains` istifadə edirik; production-da
 * bu, Postgres `pg_trgm` GIN indeksi (manual-sql/business_rules_and_search.sql)
 * üzərində işləyəcək ki, böyük data həcmində də sürətli qalsın (bənd 33).
 */
export async function searchOrganizations(query: string, limit = 20) {
  const trimmed = query.trim();
  if (!trimmed) {
    return prisma.organization.findMany({
      where: { active: true },
      take: limit,
      orderBy: { name: "asc" },
      include: { parent: true },
    });
  }

  const results = await prisma.organization.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: trimmed, mode: "insensitive" } },
        { shortName: { contains: trimmed, mode: "insensitive" } },
        { searchableAliases: { has: trimmed } },
        { searchableAliases: { hasSome: trimmed.split(/\s+/) } },
      ],
    },
    take: limit,
    orderBy: { name: "asc" },
    include: { parent: true },
  });

  return results;
}

/**
 * Bənd 12/55 — Prezident Administrasiyası seçildikdə konsolidasiya üçün
 * özünün + BÜTÜN alt təşkilatlarının id-lərini qaytarır.
 */
export async function resolveOrganizationIdsIncludingChildren(organizationId: string): Promise<string[]> {
  const children = await prisma.organization.findMany({
    where: { parentId: organizationId },
    select: { id: true },
  });
  return [organizationId, ...children.map((c) => c.id)];
}

export async function getPresidentAdministrationWithChildren() {
  const parent = await prisma.organization.findFirst({
    where: { type: "PRESIDENT_ADMINISTRATION" },
    include: {
      children: { where: { active: true }, orderBy: { name: "asc" } },
    },
  });
  return parent;
}

export async function listOrganizationsFlat() {
  return prisma.organization.findMany({
    where: { active: true },
    include: { parent: true },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  });
}
