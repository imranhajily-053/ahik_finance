import { z } from "zod";

/**
 * Bənd 10 — OVERNIGHT XÜSUSİ QAYDASI (çox vacib biznes qaydası):
 *   source = NULL  &&  purpose = "Overnight sazişi"   → VALID
 *   source = NULL  &&  hər hansı digər purpose        → INVALID
 *
 * Bu fayl YALNIZ formatı/formanı yoxlayır. Purpose-un HƏQİQƏTƏN "Overnight"
 * olub-olmadığını (allowsEmptySource) DB-dən bilmək lazımdır, ona görə bu
 * schema `purposeAllowsEmptySource` bool-unu parametr kimi qəbul edir və
 * onu service layer (server-side) doldurur — heç vaxt client-dən gələn dəyərə
 * etibar edilmir.
 */

export const transactionBaseSchema = z.object({
  transactionDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Tarix düzgün formatda deyil."),
  sourceOrganizationId: z.string().cuid().nullable(),
  purposeId: z.string().cuid({ message: "Təyinat seçilmədən əməliyyat yadda saxlanıla bilməz." }),
  amount: z
    .number({ invalid_type_error: "Məbləğ rəqəm olmalıdır." })
    .positive("Məbləğ mənfi və ya sıfır ola bilməz."),
  currency: z.enum(["AZN", "USD", "EUR", "RUB"]).default("AZN"),
  description: z.string().max(1000).optional().nullable(),
});

export type TransactionInput = z.infer<typeof transactionBaseSchema>;

/**
 * Server-side yekun doğrulama. `purposeAllowsEmptySource` DB-dən oxunur,
 * heç vaxt client payload-undan götürülmür — beləliklə istifadəçi bu qaydanı
 * hiylə ilə keçə bilməz.
 */
export function validateOvernightRule(input: {
  sourceOrganizationId: string | null;
  purposeAllowsEmptySource: boolean;
}): { valid: boolean; message?: string } {
  const sourceIsEmpty = !input.sourceOrganizationId;

  if (sourceIsEmpty && !input.purposeAllowsEmptySource) {
    return {
      valid: false,
      message:
        "Mənbə yalnız \"Overnight sazişi\" təyinatı üçün boş buraxıla bilər. Digər bütün təyinatlar üçün mənbə mütləqdir.",
    };
  }
  return { valid: true };
}

export const transactionUpdateSchema = transactionBaseSchema.partial().extend({
  id: z.string().cuid(),
});
