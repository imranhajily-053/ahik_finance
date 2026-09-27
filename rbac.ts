import { RoleName } from "@prisma/client";

/**
 * Bənd 60: "Frontend route protection kifayət deyil." Bu fayl həm middleware/
 * API route-larında (server-side, real qərar), həm də UI-də (yalnız görünüş
 * üçün, DÜYMƏNİ GİZLƏTMƏK MƏQSƏDİLƏ) istifadə olunur. Real təhlükəsizlik
 * sərhədi HƏMİŞƏ backend-dədir — bax hər API route-un daxilində `can()` çağırışı.
 */

export type PermissionKey =
  | "transaction:create"
  | "transaction:update"
  | "transaction:delete"
  | "transaction:read"
  | "report:read"
  | "report:export"
  | "audit:read"
  | "settings:manage";

const ROLE_PERMISSIONS: Record<RoleName, PermissionKey[]> = {
  EXECUTIVE: [
    "transaction:create",
    "transaction:update",
    "transaction:delete",
    "transaction:read",
    "report:read",
    "report:export",
    "audit:read",
  ],
  READER: ["transaction:read", "report:read", "report:export"],
  ADMIN: [
    "transaction:create",
    "transaction:update",
    "transaction:delete",
    "transaction:read",
    "report:read",
    "report:export",
    "audit:read",
    "settings:manage",
  ],
};

export function can(role: RoleName | undefined | null, permission: PermissionKey): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export class ForbiddenError extends Error {
  constructor(message = "Bu əməliyyat üçün icazəniz yoxdur.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** API route-larında istifadə üçün: icazə yoxdursa, 403 ilə throw edir. */
export function assertPermission(role: RoleName | undefined | null, permission: PermissionKey) {
  if (!can(role, permission)) {
    throw new ForbiddenError();
  }
}
