import { describe, it, expect } from "vitest";
import { validateOvernightRule } from "@/lib/validation/transaction";

describe("Overnight business rule (bənd 10)", () => {
  it("Overnight sazişi + boş source = VALID", () => {
    const result = validateOvernightRule({ sourceOrganizationId: null, purposeAllowsEmptySource: true });
    expect(result.valid).toBe(true);
  });

  it("Üzvlük haqqı + boş source = INVALID", () => {
    const result = validateOvernightRule({ sourceOrganizationId: null, purposeAllowsEmptySource: false });
    expect(result.valid).toBe(false);
    expect(result.message).toBeDefined();
  });

  it("hər hansı purpose + mövcud source = VALID (source təqdim olunub)", () => {
    const result = validateOvernightRule({ sourceOrganizationId: "org_123", purposeAllowsEmptySource: false });
    expect(result.valid).toBe(true);
  });

  it("Overnight sazişi + mövcud source da VALID-dir (source vermək qadağan deyil, sadəcə könüllüdür)", () => {
    const result = validateOvernightRule({ sourceOrganizationId: "org_123", purposeAllowsEmptySource: true });
    expect(result.valid).toBe(true);
  });
});
