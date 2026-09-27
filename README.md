# AHİK — Maliyyə İnformasiya Sistemi

Azərbaycan Həmkarlar İttifaqları Konfederasiyası üçün maliyyə vəsaitlərinin toplanması, uçotu,
monitorinqi və analitikası sistemi.

> **ƏSAS PRİNSİP — ONE SOURCE OF TRUTH:** Bütün məlumat `income_transactions` cədvəlində bir dəfə
> daxil edilir. Hər hesabat səhifəsi (Üzvlük haqları, Sanatoriya, Borc, Mədəni-kütləvi, Overnight,
> Prezident Administrasiyası, Dashboard) bu cədvəl üzərində aggregation query-dən başqa bir şey
> deyil. Heç bir hesabat özünün ayrıca data table-ına malik deyil.

---

## 1. Layihə haqqında

| | |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts |
| **Backend** | Next.js Route Handlers (eyni monorepo), service-layer arxitektura |
| **Database** | PostgreSQL 16 + Prisma ORM |
| **Auth** | NextAuth (Credentials + bcrypt, JWT session) |
| **Deployment** | Docker / docker-compose |

## 2. Arxitektura

```
UI (React Server/Client Components)
   ↓
API Route Handlers  (src/app/api/**)
   ↓  — burada assertPermission() çağırılır, RBAC HƏR ZAMAN server-side yoxlanılır
Service Layer        (src/lib/services/**)
   ↓  — biznes qaydaları (Overnight, konsolidasiya), audit logging BURADA yaşayır
Prisma ORM  →  PostgreSQL
```

Əsas prinsip: **UI → API → Service → Repository(Prisma) → DB**. Heç bir biznes qaydası
React komponentinin içində "gizli" şəkildə yazılmayıb — hamısı `src/lib/services/` altındadır və
frontend + backend eyni qaydanı paylaşır (`src/lib/validation/transaction.ts`).

### Əsas modullar

- `prisma/schema.prisma` — normalized data model (users/roles/permissions, hierarxik
  organizations, purposes, income_transactions, audit_logs)
- `prisma/manual-sql/business_rules_and_search.sql` — DB-səviyyəli Overnight trigger + trigram
  axtarış indeksləri (Prisma migration-dan SONRA əl ilə tətbiq edilir)
- `src/lib/services/transactions.ts` — vahid yazı yolu (create/update/delete + audit)
- `src/lib/services/reports.ts` — bütün hesabatlar üçün TƏK aggregation mühərriki
- `src/lib/services/kpi.ts` — reusable KPI engine (bənd 58)
- `src/lib/rbac.ts` — icazə matrisi (frontend VƏ backend tərəfindən paylaşılır)
- `src/middleware.ts` — route-səviyyəli qoruma (əlavə müdafiə xətti, əsas yoxlama API route-larında)

## 3. Biznes qaydaları (xülasə)

1. **Overnight qaydası:** `source = NULL` yalnız `purpose = Overnight sazişi` üçün icazəlidir.
   Bu qayda 3 səviyyədə yoxlanılır: Zod schema (frontend) → service layer (backend) →
   Postgres trigger (DB). Heç biri təkbaşına kifayət hesab edilmir.
2. **Prezident Administrasiyası konsolidasiyası:** alt təşkilatların (28 ədəd) məbləğləri əsas
   hesabatlarda parent sətrinə cəmlənir, lakin `Prezident Administrasiyası` səhifəsində hər biri
   ayrıca görünür (drill-down).
3. **Soft delete:** heç bir fiziki `DELETE` icra edilmir; status `VOID` olur, `deletedAt` yazılır.
4. **Duplicate detection:** eyni tarix/mənbə/təyinat/məbləğ aşkarlandıqda YALNIZ xəbərdarlıq
   göstərilir, əməliyyat BLOKLANMIR (iki qanuni fərqli ödəniş eyni görünə bilər).

## 4. Quraşdırma (lokal development)

```bash
# 1. Asılılıqları quraşdır
npm install

# 2. .env yarat
cp .env.example .env
# DATABASE_URL, AUTH_SECRET dəyərlərini doldur (openssl rand -base64 32)

# 3. Postgres-i işə sal (Docker ilə, yalnız DB)
docker compose up -d db

# 4. Miqrasiyaları tətbiq et
npx prisma migrate dev --name init

# 5. Biznes qaydası trigger-lərini və axtarış indekslərini tətbiq et
psql "$DATABASE_URL" -f prisma/manual-sql/business_rules_and_search.sql

# 6. Seed data
npm run prisma:seed

# 7. Development server
npm run dev
```

Demo login: `executive@ahik.az` / `reader@ahik.az`, parol: `ChangeMe!2026`
(**production-a keçməzdən əvvəl bu istifadəçiləri silin və ya parolu dəyişin**).

## 5. Production deployment (Docker)

```bash
export POSTGRES_PASSWORD=$(openssl rand -base64 24)
export AUTH_SECRET=$(openssl rand -base64 32)
export APP_URL=https://sizin-domeniniz.az

docker compose up -d --build
docker compose exec app npx prisma migrate deploy
docker compose exec db psql -U ahik_user -d ahik_finance -f /dev/stdin < prisma/manual-sql/business_rules_and_search.sql
docker compose exec app npm run prisma:seed   # yalnız master data üçün; production-da demo transaction-ları seed etməyin
```

## 6. Test

```bash
npm run test        # Vitest — biznes qaydaları, RBAC, KPI, konsolidasiya
npm run test:e2e     # Playwright — authorization boundaries, UI axını (işlək app + DB tələb edir)
```

Test əhatəsi: Overnight qaydası (valid/invalid halları), Prezident Administrasiyası
konsolidasiyası, RBAC matrisi (Reader/Executive/Admin), maliyyə formatlaşdırması.

## 7. Backup

Production Postgres üçün minimum tövsiyə:
- Gündəlik `pg_dump` + WAL arxivləşdirmə (point-in-time recovery üçün)
- Backup-ları ayrı fiziki/coğrafi məkanda saxlamaq
- Bərpa prosedurunu rüblük test etmək

## 8. Təhlükəsizlik qeydləri

- Bütün mutasiya endpoint-ləri (`POST/PATCH/DELETE`) server-side `assertPermission()` ilə
  qorunur — frontend-də düymənin gizlədilməsi TƏHLÜKƏSİZLİK TƏDBİRİ HESAB OLUNMUR.
  Bax `src/lib/rbac.ts` və hər route handler-in daxilindəki çağırış.
- Parollar `bcrypt` (12 rounds) ilə hash-lənir.
- SQL injection: Prisma parametrized query-lər istifadə edir, heç bir yerdə raw string
  concatenation yoxdur.
- Secrets `.env`-də saxlanılır, repo-ya daxil edilmir (`.gitignore`).

## 9. Qalan işlər / gələcək genişlənmə

- Settings səhifəsində tam CRUD formaları (hazırda oxu-only görünüş; master data seed vasitəsilə
  idarə olunur — bənd 38-in ilkin skeletidir)
- PDF export (Excel/CSV hazırdır, `exceljs` ilə; PDF üçün `pdfkit` asılılığı əlavə olunub, route
  yazılmalıdır)
- i18n: interfeys Azərbaycan dilində sabit mətnlərlə yazılıb; English/Russian üçün açar-dəyər
  strukturuna keçid mümkündür (bənd 67)
- Real-time invalidation hazırda hər sorğuda təzə fetch ilə həll olunur; yüksək yüklənmə üçün
  SWR/React Query və ya WebSocket revalidation əlavə edilə bilər (bənd 62)
