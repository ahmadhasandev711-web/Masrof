/**
 * Seeds starter blog posts. Idempotent by `{ locale, slug }`.
 *
 * Also migrates legacy posts (pre-bilingual schema):
 * - backfills `locale: "ar"` where missing
 * - drops the old unique `slug_1` index
 *
 * Usage: npm run seed:posts
 */
import { connectToDatabase } from "@/lib/db/mongoose";
import { PostModel } from "@/models/post";

type SeedPost = {
  locale: "ar" | "en";
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string | null;
  isPublished: boolean;
  publishedAt: Date;
};

const POSTS: SeedPost[] = [
  {
    locale: "ar",
    slug: "kefaya-fel-shahr",
    title: "طريقة الأظرفة: أبسط نظام لتقسيم راتبك الشهري",
    excerpt:
      "قبل ما تفكر في أي تطبيق أو جدول بيانات معقد، نظام الأظرفة (أو نسخته الرقمية) هو أسرع طريقة تتحكم بيها في مصاريفك الشهرية من أول يوم.",
    category: "إدارة مالية",
    content: `## الفكرة ببساطة

بدل ما راتبك يدخل حساب واحد ويختفي على مدار الشهر من غير ما تعرف راح فين، قسّمه من أول يوم على "أظرفة" افتراضية: كل ظرف له غرض واحد بس.

### الأظرفة الأساسية اللي تبدأ بيها

1. **الإيجار والفواتير الثابتة** — أول حاجة تتجنّب، لأنها مش قابلة للتفاوض
2. **الأكل والمواصلات** — المصاريف اليومية المتكررة
3. **الادخار** — حتى لو نسبة صغيرة، المهم إنها ثابتة كل شهر
4. **مصاريف متغيرة** — تسوق، ترفيه، أي حاجة مش أساسية

### ليه النظام ده بينفع فعلاً

المشكلة مش إنك بتصرف كتير، المشكلة إنك مش شايف الصورة كاملة. لما تقسّم من الأول، أي قرار شراء بيبقى واضح: "الظرف ده خلص ولا لسه فيه مساحة؟"

### من الورق للتطبيق

نفس الفكرة، لكن بدل ظرف ورقي فعلي، كل ظرف بيبقى **تصنيف** في حسابك. وبدل ما تعد الفلوس بإيدك، التطبيق بيوريك فورًا كل تصنيف وصل لحد كام من الميزانية المحددة له.
`,
    isPublished: true,
    publishedAt: new Date("2026-05-01"),
  },
  {
    locale: "en",
    slug: "kefaya-fel-shahr",
    title: "The envelope method: the simplest way to split your monthly salary",
    excerpt:
      "Before you reach for a complex spreadsheet or app, the envelope method (or its digital version) is the fastest way to take control of your monthly spending from day one.",
    category: "Personal finance",
    content: `## The idea in plain terms

Instead of letting your salary land in one account and disappear over the month with no clear trail, split it on day one into virtual "envelopes" — each envelope has one job.

### The core envelopes to start with

1. **Rent and fixed bills** — pay these first; they are non-negotiable
2. **Food and transport** — everyday recurring costs
3. **Savings** — even a small fixed amount every month counts
4. **Flexible spending** — shopping, entertainment, anything non-essential

### Why this actually works

The problem is rarely that you spend too much — it is that you cannot see the full picture. When you split upfront, every purchase becomes a clear question: "Is there still room in this envelope?"

### From paper to app

Same concept: each envelope becomes a **category** in your account. Instead of counting cash by hand, the app shows instantly how much of each category budget you have used.
`,
    isPublished: true,
    publishedAt: new Date("2026-05-01"),
  },
  {
    locale: "ar",
    slug: "freelancer-fasel-felous",
    title: "فريلانسر؟ 4 أسباب لازم تفصل فلوس الشغل عن فلوسك الشخصية",
    excerpt:
      "أكتر غلطة بتتكرر عند الفريلانسرز في مصر: كل الفلوس بتدخل نفس المحفظة. النتيجة إنك متعرفش فعلاً بتكسب كام صافي.",
    category: "فريلانس",
    content: `## المشكلة

لما فلوس العميل بتدخل نفس الحساب اللي بتصرف منه على البيت والأكل، بيحصل حاجتين سيئتين:

- **متعرفش أرباحك الحقيقية** — لأن اللي بتشوفه في الحساب مخلوط: دخل شغل + مصروفات شخصية
- **بتصرف من فلوس المفروض تتجنّب** — زي ضريبة مستحقة أو اشتراك برنامج لازم تجدده

## الحل: مساحتين منفصلتين

مش لازم حسابين بنكيين فعليين (رغم إنه أفضل لو قدرت). أقل حاجة: مساحة (Workspace) منفصلة لشغل الفريلانس، بحساباتها وتصنيفاتها الخاصة.

### إيه اللي بيفرقه ده فعليًا

1. **تعرف صافي ربحك الشهري** — دخل العملاء ناقص مصاريف الشغل (برامج، إنترنت، معدات)
2. **تحدد نسبة تحطها جنب للضرائب** من كل دفعة عميل، قبل ما تلمسها
3. **تقارن أداء الشهور** — الشهر ده كسبت أكتر ولا أقل من اللي فات؟
4. **قرارات أوضح** — تقدر تقرر تزود سعرك أو تاخد مشروع جديد بناءً على أرقام حقيقية، مش إحساس

## نقطة أخيرة

الفصل ده مش رفاهية، هو أول خطوة فعلية نحو التعامل مع الفريلانس كمصدر دخل جاد، مش "شغل جانبي".
`,
    isPublished: true,
    publishedAt: new Date("2026-05-20"),
  },
  {
    locale: "en",
    slug: "freelancer-fasel-felous",
    title: "Freelancer? 4 reasons to separate work money from personal money",
    excerpt:
      "The most common mistake freelancers make: every payment goes into the same wallet. The result? You never really know your net income.",
    category: "Freelance",
    content: `## The problem

When client payments land in the same account you use for rent and groceries, two bad things happen:

- **You cannot see your real profit** — what you see is a mix of business income and personal spending
- **You spend money you should set aside** — taxes due, software renewals, and other business obligations

## The fix: two separate workspaces

You do not always need two bank accounts (though that helps). At minimum, use a separate **workspace** for freelance work with its own accounts and categories.

### What this changes in practice

1. **Know your monthly net profit** — client income minus business expenses (software, internet, gear)
2. **Set aside tax from each payment** before you spend it
3. **Compare month to month** — did you earn more or less than last month?
4. **Make clearer decisions** — raise your rate or take a new project based on numbers, not gut feeling

## One last point

Separation is not a luxury. It is the first practical step toward treating freelance work as real income, not a side hustle.
`,
    isPublished: true,
    publishedAt: new Date("2026-05-20"),
  },
  {
    locale: "ar",
    slug: "kam-tebi-tewaffar",
    title: "كام المفروض تدّخر كل شهر؟ إجابة عملية مش نظرية",
    excerpt:
      "قاعدة الـ 20% اللي بتسمعها في كل مكان مش دايمًا واقعية في مصر. إليك طريقة أوقع لتحديد رقم الادخار الصح ليك.",
    category: "نصائح عامة",
    content: `## ليه القواعد الجاهزة مش دايمًا بتنفع

قاعدة زي "ادّخر 20% من دخلك" مبنية على افتراضات مش كل الناس فيها: دخل ثابت، مصاريف أساسية معروفة، وظروف اقتصادية مستقرة. في حياة كتير من الناس، الرقم ده إما مستحيل أو أقل من اللازم.

## الطريقة الأدق: ابدأ بمصاريفك الحقيقية

بدل ما تحدد نسبة من الآخر، اتبع الترتيب ده:

1. **سجّل مصاريفك الحقيقية لمدة شهر كامل** — مش تقدير، أرقام فعلية
2. **افصل الأساسي عن الكمالي** — إيجار وأكل حاجة، اشتراكات ترفيه حاجة تانية
3. **اطرح المصاريف الأساسية من دخلك** — الباقي هو "المساحة المتاحة"
4. **قسّم المساحة دي** بين ادخار ومصاريف كمالية، حسب أولوياتك أنت

## ليه التسجيل هو الخطوة الحاسمة

من غير رقم حقيقي لمصاريفك، أي هدف ادخار هيبقى تخمين. الأداة الوحيدة اللي بتخليك تعرف رقمك الصح هي إنك تتابع فعليًا — مش تقدّر.

بعد شهرين-تلاتة من المتابعة، هتلاقي نفسك عارف بالظبط قد إيه تقدر تدّخر من غير ما تحس إنك بتضغط على نفسك.
`,
    isPublished: true,
    publishedAt: new Date("2026-06-10"),
  },
  {
    locale: "en",
    slug: "kam-tebi-tewaffar",
    title: "How much should you save each month? A practical answer",
    excerpt:
      'The "save 20%" rule you hear everywhere is not always realistic. Here is a more grounded way to find the right number for you.',
    category: "General tips",
    content: `## Why one-size rules often fail

A rule like "save 20% of your income" assumes stable pay, predictable essentials, and steady economic conditions. For many people, that number is either impossible or too low.

## A better approach: start with real expenses

Instead of picking a percentage upfront, follow this order:

1. **Track your actual spending for a full month** — real numbers, not estimates
2. **Split essentials from optional** — rent and food are one bucket; entertainment subscriptions are another
3. **Subtract essentials from income** — what is left is your "available space"
4. **Split that space** between savings and flexible spending based on your priorities

## Why tracking matters most

Without a real picture of your expenses, any savings goal is a guess. The only reliable way to find your number is to track consistently — not to estimate.

After two or three months of tracking, you will know exactly how much you can save without feeling squeezed.
`,
    isPublished: true,
    publishedAt: new Date("2026-06-10"),
  },
];

async function migrateLegacyPosts() {
  const backfill = await PostModel.updateMany(
    { $or: [{ locale: { $exists: false } }, { locale: null }] },
    { $set: { locale: "ar" } },
  );
  if (backfill.modifiedCount > 0) {
    console.log(`↪ Backfilled locale on ${backfill.modifiedCount} legacy post(s).`);
  }

  const collection = PostModel.collection;
  const indexes = await collection.indexes();

  for (const index of indexes) {
    const key = index.key as Record<string, number>;
    const isLegacySlugOnly = key.slug === 1 && key.locale == null;
    if (!isLegacySlugOnly) continue;

    const name = index.name;
    if (!name) continue;

    await collection.dropIndex(name);
    console.log(`↪ Dropped legacy index "${name}" (slug-only unique).`);
  }

  await PostModel.syncIndexes();
  console.log("↪ Post indexes synced.");
}

async function main() {
  await connectToDatabase();
  await migrateLegacyPosts();

  let created = 0;
  let updated = 0;

  for (const post of POSTS) {
    const before = await PostModel.findOneAndUpdate(
      { locale: post.locale, slug: post.slug },
      { $set: post },
      { upsert: true, returnDocument: "before" },
    );

    if (before) updated += 1;
    else created += 1;
  }

  console.log(`✅ Posts seeded: ${created} created, ${updated} updated (${POSTS.length} total).`);
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Seeding posts failed:", error);
  process.exit(1);
});
