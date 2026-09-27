import { NextResponse } from "next/server";
import { ForbiddenError } from "@/lib/rbac";
import { BusinessRuleError } from "@/lib/services/transactions";

export function handleApiError(err: unknown) {
  if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 });
  if (err instanceof BusinessRuleError) return NextResponse.json({ error: err.message }, { status: 422 });
  console.error(err);
  return NextResponse.json({ error: "Daxili server xətası baş verdi." }, { status: 500 });
}
