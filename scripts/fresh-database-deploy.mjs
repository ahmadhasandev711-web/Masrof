#!/usr/bin/env node
/**
 * Fresh database + deploy checklist for sanadat.site (does NOT connect to Mongo by default).
 *
 * Usage:
 *   node scripts/fresh-database-deploy.mjs              # print checklist
 *   node scripts/fresh-database-deploy.mjs --execute    # drop DB + seed (requires CONFIRM_DROP=YES)
 */

const execute = process.argv.includes("--execute");

const checklist = `
=== سندات — مسح قاعدة البيانات ونشر نظيف (بدون عملاء) ===

قبل أي شيء:
  [ ] نسخة احتياطية إن وُجدت بيانات تريد الاحتفاظ بها
  [ ] .env على السيرفر: MONGODB_URI, MONGODB_DB_NAME, BETTER_AUTH_SECRET
  [ ] BETTER_AUTH_URL=https://sanadat.site
  [ ] NEXT_PUBLIC_APP_URL=https://sanadat.site
  [ ] ADMIN_EMAILS و SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD في .env.local أو env السيرفر

1) إيقاف التطبيق (pm2/systemd) لتقليل اتصالات أثناء المسح

2) مسح قاعدة البيانات (اختر أحد الطرق):

   أ) mongosh:
      use <MONGODB_DB_NAME>
      db.dropDatabase()

   ب) أو من المشروع (خطير — يتطلب تأكيد):
      CONFIRM_DROP=YES node scripts/fresh-database-deploy.mjs --execute

3) البذور (من جذر المشروع بعد npm ci):

      npm run seed:categories
      npm run seed:admin
      # اختياري: npm run seed:posts

4) بناء ونشر:

      npm run build
      # أعد تشغيل العملية (pm2 restart / systemctl restart)

5) تحقق يدوي:

      [ ] تسجيل دخول الأدمن
      [ ] إنشاء مساحة عمل
      [ ] إنشاء فاتورة + معاملة (idempotency: إعادة المحاولة لا تكرر السجل)
      [ ] رؤوس CSP في DevTools → Network → document (لا أخطاء script لـ AdSense إن مفعّل)
      [ ] الموبايل يتصل بـ NEXT_PUBLIC / API نفس الدومين

=== انتهى ===
`;

console.log(checklist);

async function dropDatabase() {
  if (!execute) return;
  if (process.env.CONFIRM_DROP !== "YES") {
    console.error("Refusing drop: set CONFIRM_DROP=YES to run --execute");
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is required");
    process.exit(1);
  }
  const dbName = process.env.MONGODB_DB_NAME ?? "masrofaty";
  const { MongoClient } = await import("mongodb");
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 30_000 });
  await client.connect();
  await client.db(dbName).dropDatabase();
  await client.close();
  console.log(`Dropped database: ${dbName}`);
  console.log("Next: npm run seed:categories && npm run seed:admin");
}

void dropDatabase().catch((err) => {
  console.error(err);
  process.exit(1);
});
