import { test, expect } from "@playwright/test";

/**
 * Bu testlər real işlək app + seed edilmiş DB tələb edir:
 *   docker-compose up -d db
 *   npm run prisma:migrate && npm run prisma:seed
 *   npm run test:e2e
 *
 * Login credentials seed.ts-dən gəlir (executive@ahik.az / reader@ahik.az, parol: ChangeMe!2026).
 */

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', "ChangeMe!2026");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test.describe("Authorization boundaries (bənd 45)", () => {
  test("Reader 'Yeni daxilolma' düyməsini görmür", async ({ page }) => {
    await login(page, "reader@ahik.az");
    await page.goto("/ledger");
    await expect(page.getByText("Yeni daxilolma")).not.toBeVisible();
  });

  test("Reader API səviyyəsində transaction yarada bilmir (403)", async ({ page, request }) => {
    await login(page, "reader@ahik.az");
    const cookies = await page.context().cookies();
    const res = await request.post("/api/transactions", {
      headers: { Cookie: cookies.map((c) => `${c.name}=${c.value}`).join("; ") },
      data: { transactionDate: "2026-01-01", sourceOrganizationId: null, purposeId: "x", amount: 100, currency: "AZN" },
    });
    expect(res.status()).toBe(403);
  });

  test("Executive 'Yeni daxilolma' formunu aça bilir", async ({ page }) => {
    await login(page, "executive@ahik.az");
    await page.goto("/ledger");
    await page.getByText("Yeni daxilolma").click();
    await expect(page.getByText("Tarix")).toBeVisible();
  });
});

test.describe("Overnight business rule — UI səviyyəsində (bənd 10, 45)", () => {
  test("Overnight seçildikdə mənbə könüllü olur", async ({ page }) => {
    await login(page, "executive@ahik.az");
    await page.goto("/ledger");
    await page.getByText("Yeni daxilolma").click();
    await page.selectOption("select", { label: "Overnight sazişi" });
    await expect(page.getByText(/könüllüdür/)).toBeVisible();
  });
});

test.describe("Dashboard smoke test", () => {
  test("Dashboard KPI kartları yüklənir", async ({ page }) => {
    await login(page, "reader@ahik.az");
    await page.goto("/dashboard");
    await expect(page.getByText("Ümumi daxilolmalar")).toBeVisible();
  });
});
