import { describe, it, expect } from "vitest";
import { formatAzn, formatPercent } from "@/lib/format";

describe("Maliyyə formatlaşdırması (bənd 29)", () => {
  it("12500-ü '12 500,00 AZN' kimi formatlaşdırır", () => {
    expect(formatAzn(12500)).toBe("12 500,00 AZN");
  });
  it("onluq dəyərləri düzgün formatlaşdırır", () => {
    expect(formatAzn(1234.5)).toBe("1 234,50 AZN");
  });
  it("faiz dəyişikliyini işarə ilə göstərir", () => {
    expect(formatPercent(12.34)).toBe("+12.3%");
    expect(formatPercent(-5)).toBe("-5.0%");
  });
  it("null faiz dəyəri üçün saxta nəticə göstərmir (bənd 20)", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(undefined)).toBe("—");
  });
});
