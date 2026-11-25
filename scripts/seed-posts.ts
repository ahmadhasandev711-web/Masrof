/**
 * Seeds Sanadat's 4 focused SEO blog posts (AR + EN). Idempotent by `{ locale, slug }`.
 * Removes legacy generic starter posts so the blog stays 100% focused on problems Sanadat solves.
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
  category: string;
  tags: string[];
  isPublished: boolean;
  publishedAt: Date;
};

const LEGACY_SLUGS = [
  "kefaya-fel-shahr",
  "freelancer-fasel-felous",
  "kam-tebi-tewaffar",
];

const POSTS: SeedPost[] = [
  {
    locale: "ar",
    slug: "professional-invoice-whatsapp-collection",
    title: "إزاي تعمل فاتورة احترافية للعميل في 30 ثانية وتحصّل مستحقاتك عبر واتساب",
    excerpt:
      "بطّل تضيع وقتك في تعديل فواتير Word و Excel ونسيان الدفعات الجزئية. دليلك لإصدار فاتورة احترافية ومشاركة رابطها وتحصيل فلوسك عبر واتساب بأسلوب راقٍ.",
    category: "فريلانس",
    tags: ["فاتورة عميل", "برنامج فواتير", "تحصيل مستحقات", "واتساب", "فريلانس"],
    content: `## ليه فواتير الـ Word و Excel بتخسّرك وقت ومستحقات؟

كتير من الفريلانسرز وأصحاب المكاتب الصغيرة بيعانوا من نفس المشكلة كل شهر: تخلص الشغل مع العميل، وبعدين تقعد نص ساعة تعدّل ملف Word أو Excel قديم، تحوله PDF، تكتشف إن الرقم غلط أو نسيت الضريبة أو الخصم، وبعد أسبوعين تنسى العميل دفع كام وباقي له كام.

الأسوأ من كده هو إحراج المطالبة بالفلوس لما الدفعة تتأخر — فتسكت أو تبعت رسالة غير واضحة.

## 5 أخطاء بتأخر تحصيل فواتيرك من العملاء

1. **إرسال الفاتورة كرسالة نصية أو صورة مش واضحة** — بدون رقم فاتورة مرجعي ولا تاريخ استحقاق.
2. **غياب تفاصيل البنود** — لما العميل يشوف "تصميم موقع: 15,000" غير لما يشوف بنود واضحة بالسعر والكمية والضريبة.
3. **عدم تسجيل الدفعات الجزئية** — العميل يدفع عربون 50% وتضيع متابعة الباقي بين الشات والتحويلات.
4. **صعوبة المراجعة من موبايل العميل** — ملفات PDF كبيرة أو غير منظمة بتتأجل من العميل.
5. **نسيان المتابعة في موعد الاستحقاق** — لأن مفيش تنبيه واضح بالفواتير المتأخرة.

## إزاي تصدر فاتورة وتحصّلها في نص دقيقة مع سندات؟

في **سندات**، الفاتورة مش مجرد ورقة شكلها حلو — هي جزء من نظام متكامل مربوط بحساباتك وعملاءك:

- **قوالب بنود جاهزة**: لو عندك خدمات متكررة (مثل باقة سوشيال ميديا، تطوير صفحة، استشارة)، بتختار القالب وتنزل البنود فوراً.
- **حساب تلقائي للضريبة والخصم والإجمالي**: بدون أي معادلات Excel عرضة للغلط.
- **رابط عام أنيق للفاتورة + طباعة A4**: تبعت للعميل رابطاً مباشراً يفتحه من موبايله أو يحمّل الفاتورة كـ PDF بهوية نشاطك التجارية (اللوجو، الضريبة، رقم الهاتف).
- **تسجيل الدفعات الجزئية على الحساب الفعلي**: لما العميل يحوّل عربون على فودافون كاش أو الحساب البنكي، بتسجّل الدفعة فتسمّع فوراً في رصيد الحساب وفي كشف حساب العميل، وحالة الفاتورة تتحدث تلقائياً إلى "مدفوعة جزئياً" أو "مدفوعة".
- **تذكير واتساب جاهز بضغطة زر**: يفتح واتساب على رقم العميل برسالة مهذبة ومكتوبة باحتراف فيها رقم الفاتورة والمبلغ المتبقي وتاريخ الاستحقاق.

## خلاصة عملية

العميل بيدفع أسرع بكتير لما الفاتورة تكون واضحة، محترفة، وموعدها ومبلغها المتبقي محددين بدقة.

[ابدأ مجاناً على سندات وأصدر أول فاتورة في 30 ثانية](/register)
`,
    isPublished: true,
    publishedAt: new Date("2026-11-24"),
  },
  {
    locale: "en",
    slug: "professional-invoice-whatsapp-collection",
    title: "How to Create a Professional Client Invoice in 30 Seconds and Collect via WhatsApp",
    excerpt:
      "Stop wasting time editing Word or Excel invoices and losing track of partial payments. Learn how to send clean invoices and collect faster via WhatsApp.",
    category: "Freelance",
    tags: ["client invoice", "invoicing software", "whatsapp reminder", "freelance"],
    content: `## Why Word and Excel invoices slow down getting paid

Many freelancers and small agencies repeat the same exhausting cycle every week: finish client work, spend 30 minutes fixing an old Word or spreadsheet template, export a PDF, realize a tax or discount line is off, and then lose track of partial deposits two weeks later.

Even worse is the awkwardness of chasing late payments without a clear, polite breakdown.

## 5 mistakes that delay client payments

1. **Sending raw text totals instead of an invoice** — no invoice number, no due date, no paper trail.
2. **Vague line items** — clear itemized services with quantity, unit price, and tax build immediate trust.
3. **Losing track of partial payments** — deposits get buried in chat history and bank alerts.
4. **Hard-to-read files on mobile** — clients delay paying what is annoying to open.
5. **No structured follow-up** — overdue invoices sit unpaid simply because nobody followed up cleanly.

## How Sanadat turns invoicing into instant collection

In **Sanadat**, an invoice is connected directly to your accounts, clients, and projects:

- **Reusable invoice templates**: save your recurring packages and insert line items in one tap.
- **Automatic tax, discount, and total math**: zero spreadsheet formula mistakes.
- **Shareable public invoice link & clean A4 PDF**: send a mobile-friendly link or branded invoice PDF with your business name, tax ID, and logo.
- **Partial payments linked to your real account**: record a deposit into Cash, Wallet, or Bank—your account balance, invoice status, and client statement update together automatically.
- **One-click WhatsApp payment reminder**: opens WhatsApp with a polite, ready-to-send message showing the invoice number, remaining balance, and due date.

## Bottom line

Clients pay faster when your invoice is clear, itemized, and effortless to verify.

[Start free on Sanadat and send your first invoice in 30 seconds](/register)
`,
    isPublished: true,
    publishedAt: new Date("2026-11-24"),
  },
  {
    locale: "ar",
    slug: "calculate-real-project-profitability",
    title: "إزاي تحسب صافي ربح كل مشروع (وليه الدخل الكبير مش معناه إنك كسبان)",
    excerpt:
      "ممكن تقفل مشروع بـ 40 ألف جنيه وتكتشف في الآخر إنك خسران أو طالع بالكاد بمجهودك. اتعلم إزاي تربط الفواتير والمصاريف والعملات بكل مشروع بدقة.",
    category: "مشاريع صغيرة",
    tags: ["أرباح المشاريع", "حسابات مشاريع", "مصروفات المشروع", "تعدد العملات", "وكالة"],
    content: `## الوهم الكبير: "دخل لي 40 ألف من المشروع ده!"

واحدة من أخطر الخدع المالية اللي بيقع فيها الفريلانسرز والوكالات والمقاولين الصغيرين هي الخلط بين **سعر المشروع (الإيراد)** وبين **صافي الربح الحقيقي**.

تتفق على مشروع بـ 40,000 جنيه، لكن على مدار شهرين:
- بتدفع 8,000 لمستقل خارجي أو مساعد.
- بتشترك في أدوات وإعلانات أو خامات بـ 6,500 جنيه.
- بتدفع انتقالات ومصاريف تشغيل متفرقة بدون تسجيل.
- ولو بتتعامل مع عميل بالدولار أو الريال، فرق سعر الصرف بيلخبط الحسابات أكتر.

في النهاية، تشوف الفلوس دخلت الحساب وتحس إنك كسبان، لكن لو حسبت بالأرقام الحقيقية تكتشف إن هامش ربحك اتآكل!

## 3 أرقام لازم تشوفهم لأي مشروع قبل ما تقبل المشروع اللي بعده

1. **المتفق عليه مقابل المفوتر والمحصّل**: العميل اتفق معاك على كام؟ فوترت له كام؟ واستلمت كام فعلاً؟
2. **إجمالي المصروفات المباشرة على المشروع**: كل جنيه اتصرف عشان المشروع ده يخلص لازم يتربط بيه مباشرة.
3. **صافي الربح (المحصّل ناقص المصروفات)**: ده الرقم الوحيد اللي بيقولك المشروع ده يستاهل تعبك ولا تسعيرك محتاج يتعدّل.

## إزاي سندات بيحسب لك ربحية كل مشروع أوتوماتيك؟

في **سندات**، صفحة تفاصيل المشروع بتجمع الصورة كاملة في مكان واحد:

- **ربط المشروع بالعميل والمبلغ المتفق عليه وتاريخ التسليم**.
- **ربط أي فاتورة أو حركة دخل أو مصروف بالمشروع** من شاشة الويب أو الموبايل مباشرة.
- **دعم العملات المتعددة بأسعار صرف مساحتك**: استلمت بالدولار أو الريال وصرفت بالجنيه؟ سندات بيحوّل الأرقام لعملتك الأساسية عشان تشوف صافي ربح حقيقي.
- **مؤشر المتبقي للتحصيل**: تعرف فوراً لو فيه مشاريع خلصت ولسه ليها فلوس عند العميل مع تنبيه في الرئيسية.

## النتيجة؟ تسعير أذكى وأرباح أعلى

لما تعرف بالظبط أنهي نوع مشاريع بيكسّبك وأنهي نوع بياكل وقتك ومصاريفك، هتقدر ترفع سعرك بثقة وترفض المشاريع الخسرانة بدري.

[جرّب حساب ربحية مشاريعك مجاناً في سندات](/register)
`,
    isPublished: true,
    publishedAt: new Date("2026-11-23"),
  },
  {
    locale: "en",
    slug: "calculate-real-project-profitability",
    title: "How to Calculate Real Project Profitability (And Why High Revenue Doesn’t Mean Profit)",
    excerpt:
      "You can close a 40,000 EGP project and still barely break even. Learn how linking invoices, expenses, and multi-currency rates reveals real project profit.",
    category: "Small business",
    tags: ["project profitability", "agency finance", "expense tracking", "multi currency"],
    content: `## The revenue trap: "I closed a big project!"

One of the riskiest financial blind spots for freelancers, agencies, and small studios is confusing **project revenue** with **net project profit**.

You sign a project for 40,000 EGP, then over two months you:
- Pay subcontractors or part-time help.
- Cover software licenses, ad spend, or materials out of pocket.
- Collect a milestone in USD or SAR while paying expenses in local currency.

Money lands in your account, so it feels profitable—until you look closer and realize your margin disappeared.

## 3 numbers every project needs

1. **Expected vs. billed vs. collected**: what was agreed, what was invoiced, and what actually hit your account.
2. **Direct project expenses**: every cost tied to delivering that project.
3. **Net profit (collected minus expenses)**: the only number that tells you whether your pricing actually works.

## How Sanadat tracks project profitability automatically

Inside **Sanadat**, every project has a live financial breakdown:

- **Link each project to a client, target value, and due date**.
- **Attach any invoice, income, or expense to the project** on both web and mobile.
- **Multi-currency conversion**: invoice in USD/SAR and spend in EGP—Sanadat converts totals using your workspace exchange rates so profit stays accurate.
- **Receivables visibility**: instantly see completed projects with unpaid balances right from your dashboard alerts.

## Price smarter on your next contract

Once you see which projects actually generate healthy margins and which ones drain your cash, raising rates and filtering bad-fit work becomes objective.

[Track your real project profits free on Sanadat](/register)
`,
    isPublished: true,
    publishedAt: new Date("2026-11-23"),
  },
  {
    locale: "ar",
    slug: "client-statements-and-account-balances",
    title: "فوضى المستحقات والـ Excel: إزاي تدير كشوف حسابات العملاء وأرصدة المحافظ بدون لخبطة",
    excerpt:
      "فلوسك متوزعة بين فودافون كاش وإنستاباي والبنك والخزنة، وكل شوية عميل يسألك «أنا دفعت كام وباقي عليا كام؟». إليك النظام الصح لإدارة الأرصدة وكشوف الحساب.",
    category: "مشاريع صغيرة",
    tags: ["كشف حساب عميل", "فودافون كاش", "إنستاباي", "بديل اكسل", "أرصدة الحسابات"],
    content: `## المشكلة اليومية: "الفلوس فين والعميل له إيه وعليه إيه؟"

أغلب الشغل الحر والمشاريع الصغيرة في مصر مش ماشي على حساب بنكي واحد. الفلوس بتتحرك كل يوم بين:
- **محفظة إلكترونية** (فودافون كاش، أورانج كاش، اتصالات كاش، أو إنستاباي)
- **حساب بنكي**
- **خزنة أو كاش في الإيد**

لما تيجي تسجّل الحركات دي في Excel:
1. لو حوّلت 5,000 جنيه من المحفظة للبنك، كتير بيسجلوها "مصروف" في المحفظة و"دخل" في البنك — وده بيضرب إجمالي دخلك ومصروفك في التقارير بالغلط!
2. ولو عميل طلب منك كشف حساب يوضح الفواتير والدفعات والمتبقي عليه، بتضطر تقعد تجمّع البيانات من شات واتساب وكشف البنك وتبعتهاله يدوي.

## إزاي تحل المشكلتين بنظام واحد؟

### 1. افصل التحويلات الداخلية عن الدخل والمصروف
التحويل من فودافون كاش للبنك أو من البنك للخزنة هو **تحويل داخلي** بين حساباتك — بينقّص حساب ويزوّد التاني بالظبط من غير ما يغيّر أرقام الدخل أو المصروف أو أرباحك الشهرية.

### 2. كشف حساب عميل حيّ جاهز في أي لحظة
بدل ملفات إكسل متفرقة، كل عميل في نظامك لازم يكون له سجل موحّد يظهر فيه:
- إجمالي المفوتر (كل الفواتير غير الملغاة).
- إجمالي المحصّل وتاريخ كل دفعة وعلى أي حساب دخلت.
- الرصيد المتبقي عند العميل.
- إمكانية طباعة كشف الحساب أو تصديره PDF بشكل رسمي باسم نشاطك التجاري.

## سندات بيطبق ده عملياً إزاي؟

- **حسابات متعددة بالأنواع الحقيقية**: كاش، حساب بنكي، محفظة إلكترونية (مع دعم أشهر المحافظ)، وبطاقات.
- **حركات وتحويلات دقيقة**: سحب أو إيداع أو تحويل بين الحسابات بنفس العملة بأمان تام.
- **كشف حساب عميل فوري + طباعة A4**: تفتحه من الويب أو الموبايل في ثانية وتطّلع العميل على وضعه المالي بدقة واحترافية.

[نظّم حساباتك وكشوف عملاءك مجاناً مع سندات](/register)
`,
    isPublished: true,
    publishedAt: new Date("2026-11-22"),
  },
  {
    locale: "en",
    slug: "client-statements-and-account-balances",
    title: "Ending Spreadsheet Chaos: Managing Client Statements, Wallets & Bank Balances in One Place",
    excerpt:
      "Money split across cash, mobile wallets, and bank accounts—plus clients asking what they paid and owe. Here is how to track balances and client statements cleanly.",
    category: "Small business",
    tags: ["client statement", "account balances", "excel alternative", "receivables"],
    content: `## The everyday mess: scattered wallets and manual statements

Most freelancers and small businesses do not operate out of a single bank account. Money moves daily between:
- **Mobile wallets & instant transfers**
- **Bank accounts**
- **Cash on hand**

When people track this manually in spreadsheets, two errors happen immediately:
1. **Moving money between accounts gets logged as income and expense**, inflating monthly revenue and spending reports falsely.
2. **Every time a client asks for a statement**, you spend an hour hunting down chat screenshots and bank transfers to build a summary.

## Fixing both with one clean structure

### 1. Keep internal transfers separate from revenue and expenses
Moving 5,000 from a mobile wallet to your bank account is an **internal transfer**. It updates both account balances without distorting your income, expenses, or net profit.

### 2. Live client statements on demand
Every client should have one clear ledger showing:
- Total invoiced amount.
- Every payment received, when it arrived, and which account it landed in.
- Exact remaining balance due.
- One-click printable A4 statement with your business branding.

## How Sanadat handles this out of the box

- **Dedicated accounts** for cash, bank accounts, mobile wallets, and cards—each with its own currency and live balance.
- **Safe account transfers** that keep your profit reports honest.
- **Instant client statements** accessible from both the web dashboard and mobile app.

[Organize your accounts and client statements free on Sanadat](/register)
`,
    isPublished: true,
    publishedAt: new Date("2026-11-22"),
  },
  {
    locale: "ar",
    slug: "cashflow-debts-recurring-budgets-system",
    title: "الديون، الاشتراكات المنسية، وتقلب الدخل: نظام عملي لتأمين الكاش فلو الشهري",
    excerpt:
      "ليه الكاش بيخلص قبل آخر الشهر حتى لو دخلك كويس؟ تعرف على نظام بسيط يجمع الميزانيات الشهرية والمصروفات المتكررة والديون في مكان واحد.",
    category: "إدارة مالية",
    tags: ["إدارة الديون", "مصروفات متكررة", "ميزانية شهرية", "كاش فلو", "إدارة مالية"],
    content: `## المشكلة مش في قلة الدخل — المشكلة في "المفاجآت"

كم مرة دخل لك مبلغ كويس أول الشهر، وبعدين اتفاجئت بنهاية الشهر إن الرصيد خلص؟ السبب غالباً واحد من تلاتة:
1. **مصروفات متكررة بتنسى ميعادها**: إيجار المكتب، باقة الإنترنت، اشتراكات السيرفر والـ AI وبرامج التصميم.
2. **أقساط وديون مش مترابطة بالحسابات**: بتدفع جزء من دين ومش فاكر فاضل كام ولا اتخصم من أنهي حساب.
3. **غياب سقف واضح للمصروفات**: مفيش تنبيه يقولك إنك قربت تخلّص ميزانية التسويق أو المصروفات الشخصية هذا الشهر.

## خطة 4 خطوات عشان تمسك الكاش فلو بجد

### 1. سجّل كل التزام متكرر بميعاده
حط كل مصروف ثابت (شهري أو أسبوعي) في قائمة المصروفات المتكررة. لما ييجي ميعاده، النظام ينبهك فتسجله على الحساب بضغطة واحدة بدل ما يتنسي ويتراكم.

### 2. اربط سداد الديون بحساباتك الفعلية
سواء عليك التزام لمورد، قسط جهاز، أو سلفة: سجّل الدين بإجماليه وموعده، وكل دفعة سداد تتخصم فوراً من حسابك وتتسجل كمصروف واضح — من غير ما تحسب المتبقي بإيدك.

### 3. حط ميزانيات ذكية للتصنيفات اللي بتتسرب منها الفلوس
مش لازم تعمل 20 ميزانية. ابدأ بميزانية عامة أو لـ 3 تصنيفات (مثلاً: إعلانات، مصاريف تشغيل، مصاريف شخصية). لما توصل لـ 80% أو 100% النظام بينبهك قبل ما تخرج عن السيطرة.

### 4. حوّل الفائض لأهداف ادخار حقيقية
مبلغ لطوارئ الشغل، تحديث اللابتوب، أو خطة توسع — لما تحط هدف ادخار برقم وموعد وتزود رصيده كل شهر، الفائض ما بيضيعش في مصاريف عشوائية.

## كل ده متجمع لك في سندات

في **سندات** (ويب وموبايل)، الميزانيات والمصاريف المتكررة والديون وأهداف الادخار شغالين مع بعض لحظياً — عشان دايماً تكون سابق التزاماتك بخطوة.

[ابدأ تنظيم الكاش فلو والتزاماتك على سندات الآن](/register)
`,
    isPublished: true,
    publishedAt: new Date("2026-11-21"),
  },
  {
    locale: "en",
    slug: "cashflow-debts-recurring-budgets-system",
    title: "Debts, Forgotten Subscriptions & Irregular Income: A Practical Monthly Cashflow System",
    excerpt:
      "Why does cash run out before month-end even with good income? A practical system uniting monthly budgets, recurring bills, debts, and savings goals.",
    category: "Personal finance",
    tags: ["debt tracking", "recurring expenses", "monthly budget", "cashflow"],
    content: `## It is rarely an income problem—it is a visibility problem

Ever start the month feeling comfortable, only to wonder where the cash went three weeks later? Usually, three blind spots drain your cashflow:
1. **Forgotten recurring bills**: office rent, internet, hosting, cloud tools, and software renewals.
2. **Untracked debts and installments**: paying off a supplier or loan without seeing the remaining balance update against your real account.
3. **No spending guardrails**: realizing you overspent on ads or discretionary categories only after the month ends.

## A 4-part system to stay ahead of your cashflow

### 1. List every recurring expense once
Put weekly or monthly bills into a recurring schedule. When a bill is due, get a clear alert and record it onto the exact account in one tap.

### 2. Link debt repayments directly to your accounts
Track what you owe by creditor and due date. Every repayment reduces the remaining debt and deducts from your chosen account automatically.

### 3. Set practical budgets on leaky categories
Start with 2–3 high-impact budgets (or one workspace-wide cap). Early warnings at 80% and 100% give you time to adjust before overspending.

### 4. Give surplus cash a real savings goal
Equipment upgrades, tax reserves, or an emergency runway—tracking progress toward a target keeps surplus cash from vanishing into random spending.

## Built together inside Sanadat

In **Sanadat** across web and mobile, budgets, recurring bills, debts, and savings goals all live inside the same financial workspace—so you always know where you stand.

[Take control of your monthly cashflow on Sanadat](/register)
`,
    isPublished: true,
    publishedAt: new Date("2026-11-21"),
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

  const deleted = await PostModel.deleteMany({ slug: { $in: LEGACY_SLUGS } });
  if (deleted.deletedCount > 0) {
    console.log(`↪ Removed ${deleted.deletedCount} legacy starter post(s).`);
  }

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
