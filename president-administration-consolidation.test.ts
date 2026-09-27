import { describe, it, expect, vi, beforeEach } from "vitest";

// Prisma-nı mock edirik ki, real DB-yə bağlanmadan aggregation MƏNTİQİNİ test edək.
vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      purpose: {
        findUnique: vi.fn().mockResolvedValue({ id: "purpose-1", code: "MEMBERSHIP_FEE" }),
      },
      incomeTransaction: {
        findMany: vi.fn().mockResolvedValue([
          {
            amount: { toString: () => "1000" }, // Prisma.Decimal-a bənzər obyekt (Number() işləyir)
            transactionDate: new Date(2026, 0, 15), // Yanvar
            sourceOrganizationId: "child-1",
            sourceOrganization: { id: "child-1", name: "Prezident İşlər İdarəsi", parentId: "president-admin", type: "PRESIDENT_ADMINISTRATION_SUBORDINATE" },
          },
          {
            amount: { toString: () => "500" },
            transactionDate: new Date(2026, 0, 20), // Yanvar
            sourceOrganizationId: "child-2",
            sourceOrganization: { id: "child-2", name: '"Marxal" MİK', parentId: "president-admin", type: "PRESIDENT_ADMINISTRATION_SUBORDINATE" },
          },
          {
            amount: { toString: () => "2000" },
            transactionDate: new Date(2026, 1, 5), // Fevral
            sourceOrganizationId: "union-1",
            sourceOrganization: { id: "union-1", name: "Səhiyyə İşçilərinin Həmkarlar İttifaqı", parentId: null, type: "MEMBER_UNION" },
          },
        ]),
      },
      organization: {
        findMany: vi.fn().mockResolvedValue([
          { id: "president-admin", name: "Prezident Administrasiyası", parentId: null },
          { id: "child-1", name: "Prezident İşlər İdarəsi", parentId: "president-admin" },
          { id: "child-2", name: '"Marxal" MİK', parentId: "president-admin" },
          { id: "union-1", name: "Səhiyyə İşçilərinin Həmkarlar İttifaqı", parentId: null },
        ]),
      },
    },
  };
});

// Number(decimalLike) with a toString() override does not work directly via Number(),
// so the mocked "amount" values above need Number() to parse their toString output.
// Number({ toString: () => "1000" }) === 1000 — this is valid JS coercion behaviour.

import { getMonthlyMatrixByPurposeCode } from "@/lib/services/reports";

describe("Prezident Administrasiyası konsolidasiyası (bənd 12, 55, 45)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("alt təşkilatların (child-1, child-2) cəmi Prezident Administrasiyası sətrinə konsolidə olunur", async () => {
    const result = await getMonthlyMatrixByPurposeCode("MEMBERSHIP_FEE", 2026);

    const presidentRow = result.rows.find((r) => r.organizationId === "president-admin");
    expect(presidentRow).toBeDefined();
    // Yanvar (index 0): child-1 (1000) + child-2 (500) = 1500
    expect(presidentRow!.monthly[0]).toBe(1500);
    expect(presidentRow!.isConsolidatedParent).toBe(true);
  });

  it("Prezident Administrasiyasına aid olmayan təşkilat (union-1) öz sətrində, konsolidə edilmədən qalır", async () => {
    const result = await getMonthlyMatrixByPurposeCode("MEMBERSHIP_FEE", 2026);

    const unionRow = result.rows.find((r) => r.organizationId === "union-1");
    expect(unionRow).toBeDefined();
    expect(unionRow!.monthly[1]).toBe(2000); // Fevral
    expect(unionRow!.isConsolidatedParent).toBe(false);
  });

  it("aylıq cəmlər və ümumi cəm arasında uyğunsuzluq yoxdur (bənd 35)", async () => {
    const result = await getMonthlyMatrixByPurposeCode("MEMBERSHIP_FEE", 2026);
    const sumOfRowTotals = result.rows.reduce((a, r) => a + r.total, 0);
    const sumOfMonthlyTotals = result.monthlyTotals.reduce((a, v) => a + v, 0);
    expect(sumOfRowTotals).toBe(result.grandTotal);
    expect(sumOfMonthlyTotals).toBe(result.grandTotal);
    expect(result.grandTotal).toBe(3500); // 1000 + 500 + 2000
  });
});
