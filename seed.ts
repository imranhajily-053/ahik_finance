/**
 * Seed script.
 *   npm run prisma:seed
 *
 * Bənd 46: Demo/nümunə transaction-lar `isDemo: true` ilə açıq şəkildə
 * işarələnir. Master data (təşkilatlar, təyinatlar, rollar) demo DEYİL —
 * bunlar real production data-nın bir hissəsidir və seed yalnız onları
 * bir dəfə yaratmaq üçün istifadə olunur (idempotent upsert).
 */
import { PrismaClient, OrganizationType, RoleName } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const MEMBER_UNIONS: { name: string; shortName?: string; aliases?: string[] }[] = [
  { name: "Naxçıvan Muxtar Respublikası Həmkarlar İttifaqı Şurası" },
  { name: "Aviasiya İşçiləri Həmkarlar İttifaqı Respublika Komitəsi" },
  { name: "Avtomobil Nəqliyyatı və Yol Təsərrüfatı İşçiləri Həmkarlar İttifaqı Respublika Komitəsi" },
  { name: "“Baku Steel Company” MMC İşçilərinin Həmkarlar İttifaqı Birliyi", aliases: ["Baku Steel"] },
  { name: "Azərbaycan Dəmiryolçularının Müstəqil Həmkarlar İttifaqı Respublika Komitəsi" },
  { name: "Azərbaycan Dəniz Nəqliyyatı İşçiləri Həmkarlar İttifaqı Respublika Komitəsi" },
  { name: "Azərbaycan Milli Elmlər Akademiyası Azad Həmkarlar İttifaqı", aliases: ["AMEA"] },
  { name: "Elm və Təhsil İşçiləri Həmkarlar İttifaqı Respublika Komitəsi" },
  { name: "“Lukoyl-Azərbaycan” QSC İşçilərinin Həmkarlar İttifaqı", aliases: ["Lukoyl"] },
  { name: "Milli Məclisin Birləşmiş Həmkarlar İttifaqı Komitəsi" },
  { name: "Müdafiə Sənayesi İşçiləri Həmkarlar İttifaqı" },
  { name: "Mədəniyyət İşçiləri Həmkarlar İttifaqı" },
  { name: "Nazirlər Kabinetinin Həmkarlar İttifaqı Komitəsi" },
  { name: "Azərbaycan Neft və Qaz Sənayesi İşçilərinin Həmkarlar İttifaqı" },
  { name: "Azərbaycan Respublikası Prezident Administrasiyasının Həmkarlar İttifaqı Komitəsi" },
  { name: "Nəqliyyat, Rabitə və Yüksək Texnologiya İşçilərinin Həmkarlar İttifaqı Respublika Komitəsi" },
  { name: "Səhiyyə İşçilərinin Həmkarlar İttifaqı" },
  { name: "Bakı Metropoliteni Həmkarlar ittifaqı Birliyi" },
  { name: "Azərbaycan Respublikası İctimai Televiziya və Radio Yayımları Şirkətinin Müstəqil Həmkarlar İttifaqı", aliases: ["İTV"] },
  { name: "Azərbaycan Respublikası Fövqəlade Hallar Nazirliyi İşçilərinin Həmkarlar İttifaqı", aliases: ["FHN"] },
  { name: "Azərbaycan Gömrük İşçilərinin Həmkarlar İttifaqı Birliyi" },
  { name: "Azərbaycan Dövlət İdarələri və İctimai Xidmət İşçiləri Həmkarlar İttifaqı" },
  { name: "Azərbaycan Turizm Müəssisələri işçilərinin Həmkarlar İttifaqı Birliyi" },
  { name: "Xidmət və Sənaye İşçilərinin Həmkarlar İttifaqı Respublika Birliyi" },
  { name: "Elektroenergetika və Kommunal Müəssisələri İşçiləri Həmkarlar İttifaqı Respublika Birliyi" },
  { name: "Aqrar, Ekologiya və Su Təsərrüfatı İşçilərinin Həmkarlar İttifaqı Respublika Birliyi" },
];

const PRESIDENT_ADMIN_SUBORDINATES: string[] = [
  "Prezident İşlər İdarəsi",
  "\"Marxal\" Müalicə İstirahət Kompleksi",
  "Avtomobil Parkı",
  "\"Basqal\" İstirahət Kompleksi",
  "\"Şabran\" İstirahət Kompleksi",
  "Xüsusi Tibb Xidməti",
  "\"Azərsuvenir\" MMC",
  "\"Azərnəşriyyat\" MMC",
  "Aqrokompleks",
  "\"İstisu\" Müalicəvi İstirahət Kompleksi",
  "Prezident kitabxanası",
  "\"Gənclik\" iqamətgahı",
  "Siyasi Sənədlər Arxivi",
  "\"Azadlıq\" qonaq evi",
  "\"Ulduz\" qonaq evi",
  "\"Gənclik\" qonaq evi",
  "\"Respublika\" mehmanxanası",
  "Rəsmi Qəbullar Sarayı",
  "\"Xankəndi\" Müalicə Kompleksi",
  "Yeməkxana",
  "\"Təmir-Tikinti İdarəsi\" MMC",
  "\"İstisu\" mineral sular zavodu",
  "Protokol Xidməti",
  "Hacıkənd İstirahət Kompleksi",
  "Korrupsiyaya Qarşı Mübarizə Baş İdarəsi",
  "Pansionat",
  "“Bakinski Raboçi” qəzeti",
  "Laçın İstirahət Kompleksi",
];

const PURPOSES = [
  { name: "Üzvlük haqqı", code: "MEMBERSHIP_FEE", allowsEmptySource: false, reportSlug: "membership-fees" },
  { name: "Sanatoriyaların inkişafı ilə bağlı maddi yardım", code: "SANATORIUM_AID", allowsEmptySource: false, reportSlug: "sanatorium" },
  { name: "Borcun ödənilməsi / geri qaytarılması", code: "DEBT_REPAYMENT", allowsEmptySource: false, reportSlug: "debt" },
  { name: "Mədəni-kütləvi tədbirlər", code: "CULTURAL_EVENTS", allowsEmptySource: false, reportSlug: "cultural-events" },
  { name: "Overnight sazişi", code: "OVERNIGHT", allowsEmptySource: true, reportSlug: "overnight" },
];

async function main() {
  console.log("→ Rollar və icazələr...");
  const permissionKeys = [
    "transaction:create",
    "transaction:update",
    "transaction:delete",
    "transaction:read",
    "report:read",
    "report:export",
    "audit:read",
    "settings:manage",
  ];
  const permissions = await Promise.all(
    permissionKeys.map((key) =>
      prisma.permission.upsert({ where: { key }, update: {}, create: { key } })
    )
  );
  const byKey = (k: string) => permissions.find((p) => p.key === k)!;

  const executiveRole = await prisma.role.upsert({
    where: { name: RoleName.EXECUTIVE },
    update: {},
    create: {
      name: RoleName.EXECUTIVE,
      description: "İcraçı / Operator — daxilolmaları idarə edir",
      permissions: {
        connect: [
          { id: byKey("transaction:create").id },
          { id: byKey("transaction:update").id },
          { id: byKey("transaction:delete").id },
          { id: byKey("transaction:read").id },
          { id: byKey("report:read").id },
          { id: byKey("report:export").id },
          { id: byKey("audit:read").id },
        ],
      },
    },
  });

  const readerRole = await prisma.role.upsert({
    where: { name: RoleName.READER },
    update: {},
    create: {
      name: RoleName.READER,
      description: "Yalnız oxuma — dashboard, hesabat, export",
      permissions: {
        connect: [
          { id: byKey("transaction:read").id },
          { id: byKey("report:read").id },
          { id: byKey("report:export").id },
        ],
      },
    },
  });

  await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    update: {},
    create: {
      name: RoleName.ADMIN,
      description: "Sistem administratoru — master data və istifadəçi idarəsi",
      permissions: { connect: permissions.map((p) => ({ id: p.id })) },
    },
  });

  console.log("→ İstifadəçilər (demo)...");
  const passwordHash = await bcrypt.hash("ChangeMe!2026", 12);
  await prisma.user.upsert({
    where: { email: "executive@ahik.az" },
    update: {},
    create: {
      email: "executive@ahik.az",
      fullName: "Nümunə İcraçı",
      passwordHash,
      roleId: executiveRole.id,
    },
  });
  await prisma.user.upsert({
    where: { email: "reader@ahik.az" },
    update: {},
    create: {
      email: "reader@ahik.az",
      fullName: "Nümunə Rəhbər (Reader)",
      passwordHash,
      roleId: readerRole.id,
    },
  });

  console.log("→ Təşkilatlar (26 həmkarlar ittifaqı)...");
  const createdUnions = [];
  for (const org of MEMBER_UNIONS) {
    const rec = await prisma.organization.upsert({
      where: { id: `union-${slugify(org.name)}` }, // stable deterministic id via where-on-id trick below
      update: {},
      create: {
        id: `union-${slugify(org.name)}`,
        name: org.name,
        shortName: org.shortName,
        type: OrganizationType.MEMBER_UNION,
        searchableAliases: org.aliases ?? [],
      },
    });
    createdUnions.push(rec);
  }

  console.log("→ Prezident Administrasiyası + 28 alt təşkilat...");
  const presidentAdmin = await prisma.organization.upsert({
    where: { id: "org-president-administration" },
    update: {},
    create: {
      id: "org-president-administration",
      name: "Azərbaycan Respublikası Prezidenti Administrasiyası",
      shortName: "Prezident Administrasiyası",
      type: OrganizationType.PRESIDENT_ADMINISTRATION,
      searchableAliases: ["AR Prezident Administrasiyası", "Administrasiya"],
    },
  });

  for (const name of PRESIDENT_ADMIN_SUBORDINATES) {
    await prisma.organization.upsert({
      where: { id: `pa-${slugify(name)}` },
      update: {},
      create: {
        id: `pa-${slugify(name)}`,
        name,
        type: OrganizationType.PRESIDENT_ADMINISTRATION_SUBORDINATE,
        parentId: presidentAdmin.id,
      },
    });
  }

  console.log("→ Təyinatlar...");
  const purposeRecords: Record<string, string> = {};
  for (const p of PURPOSES) {
    const rec = await prisma.purpose.upsert({
      where: { code: p.code },
      update: {},
      create: {
        name: p.name,
        code: p.code,
        allowsEmptySource: p.allowsEmptySource,
        reportSlug: p.reportSlug,
      },
    });
    purposeRecords[p.code] = rec.id;
  }

  console.log("→ Demo transaction-lar (isDemo=true)...");
  const executiveUser = await prisma.user.findUniqueOrThrow({ where: { email: "executive@ahik.az" } });
  const allOrgs = await prisma.organization.findMany();
  const subOrgs = allOrgs.filter((o) => o.type === OrganizationType.PRESIDENT_ADMINISTRATION_SUBORDINATE);

  const demoRows: { date: Date; orgId: string | null; purposeCode: string; amount: number }[] = [];
  const now = new Date();
  for (let m = 0; m < 9; m++) {
    const date = new Date(now.getFullYear(), now.getMonth() - m, 10);
    for (const org of createdUnions.slice(0, 12)) {
      demoRows.push({ date, orgId: org.id, purposeCode: "MEMBERSHIP_FEE", amount: 500 + Math.round(Math.random() * 4500) });
    }
    for (const sub of subOrgs.slice(0, 8)) {
      demoRows.push({ date, orgId: sub.id, purposeCode: "MEMBERSHIP_FEE", amount: 300 + Math.round(Math.random() * 2000) });
    }
    for (const org of createdUnions.slice(0, 5)) {
      demoRows.push({ date, orgId: org.id, purposeCode: "SANATORIUM_AID", amount: 1000 + Math.round(Math.random() * 8000) });
      demoRows.push({ date, orgId: org.id, purposeCode: "CULTURAL_EVENTS", amount: 200 + Math.round(Math.random() * 3000) });
    }
    for (const org of createdUnions.slice(0, 3)) {
      demoRows.push({ date, orgId: org.id, purposeCode: "DEBT_REPAYMENT", amount: 800 + Math.round(Math.random() * 5000) });
    }
    demoRows.push({ date, orgId: null, purposeCode: "OVERNIGHT", amount: 2000 + Math.round(Math.random() * 15000) });
  }

  for (const row of demoRows) {
    await prisma.incomeTransaction.create({
      data: {
        transactionDate: row.date,
        sourceOrganizationId: row.orgId,
        purposeId: purposeRecords[row.purposeCode],
        amount: row.amount,
        currency: "AZN",
        description: "Demo məlumat (seed)",
        createdById: executiveUser.id,
        isDemo: true,
      },
    });
  }

  console.log(`✓ Seed tamamlandı. ${demoRows.length} demo transaction yaradıldı.`);
  console.log("  Demo login: executive@ahik.az / reader@ahik.az, parol: ChangeMe!2026");
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/["“”'`]/g, "")
    .replace(/[əıöüşçğ]/g, (c) =>
      ({ ə: "e", ı: "i", ö: "o", ü: "u", ş: "s", ç: "c", ğ: "g" }[c] || c)
    )
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
