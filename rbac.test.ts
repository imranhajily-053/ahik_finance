import { describe, it, expect } from "vitest";
import { can } from "@/lib/rbac";

describe("RBAC permission matrix (bənd 45)", () => {
  it("READER transaction yarada bilməz", () => {
    expect(can("READER", "transaction:create")).toBe(false);
  });
  it("READER transaction yeniləyə bilməz", () => {
    expect(can("READER", "transaction:update")).toBe(false);
  });
  it("READER transaction silə bilməz", () => {
    expect(can("READER", "transaction:delete")).toBe(false);
  });
  it("READER hesabatları oxuya bilər", () => {
    expect(can("READER", "report:read")).toBe(true);
  });
  it("EXECUTIVE bütün icazəli əməliyyatları edə bilər", () => {
    expect(can("EXECUTIVE", "transaction:create")).toBe(true);
    expect(can("EXECUTIVE", "transaction:update")).toBe(true);
    expect(can("EXECUTIVE", "transaction:delete")).toBe(true);
    expect(can("EXECUTIVE", "report:read")).toBe(true);
  });
  it("EXECUTIVE settings idarə edə bilməz (yalnız ADMIN)", () => {
    expect(can("EXECUTIVE", "settings:manage")).toBe(false);
    expect(can("ADMIN", "settings:manage")).toBe(true);
  });
  it("rol olmadıqda heç bir icazə yoxdur", () => {
    expect(can(undefined, "report:read")).toBe(false);
    expect(can(null, "transaction:create")).toBe(false);
  });
});
