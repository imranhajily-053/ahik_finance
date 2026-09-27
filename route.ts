import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assertPermission, ForbiddenError } from "@/lib/rbac";
import { updateTransaction, deleteTransaction, BusinessRuleError, NotFoundError } from "@/lib/services/transactions";
import { transactionBaseSchema } from "@/lib/validation/transaction";
import { handleApiError } from "@/lib/api-error";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur." }, { status: 401 });

  try {
    assertPermission(session.user.role, "transaction:update");

    const body = await req.json();
    const parsed = transactionBaseSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Doğrulama xətası", details: parsed.error.flatten() }, { status: 422 });
    }

    const updated = await updateTransaction(params.id, parsed.data, session.user.id);
    return NextResponse.json({ transaction: updated });
  } catch (err) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur." }, { status: 401 });

  try {
    assertPermission(session.user.role, "transaction:delete");
    await deleteTransaction(params.id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    return handleApiError(err);
  }
}
