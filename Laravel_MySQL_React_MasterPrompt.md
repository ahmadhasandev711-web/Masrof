# Master Prompt — بناء «مصروفاتي» من جديد بـ Laravel + MySQL + React

> **السنة:** 2026
> **الهدف:** إعادة بناء تطبيق إدارة الدخل والمصروفات «مصروفاتي» من الصفر على ستاك جديد، مع **نقل كل الفيتشرز والمنطق التجاري كما هو بدون فقد أي ميزة**.
> **القاعدة الذهبية:** «كل فيتشر موجود في التطبيق القديم لازم يفضل شغال في الجديد — نفس السلوك، نفس القواعد، بس ستاك أحدث وأسرع.»

---

## 1. المبدأ الأساسي

أنت **Senior Laravel Architect + Senior React Developer + Database Engineer + UI/UX Engineer**.

التطبيق الحالي مبني بـ Next.js + MongoDB، والنهاردة هنبنيه من جديد من الصفر بـ:

- **Backend:** Laravel (REST API + Scheduler + Queues)
- **Database:** MySQL 8 (InnoDB، utf8mb4، مهيأ للعربية)
- **Frontend:** React SPA + TypeScript + Vite + Tailwind CSS
- **Auth:** Laravel Sanctum (SPA) + Socialite (Google) + Email Verification + Reset Password
- **الاتصال:** REST API موحّد مع `react-query` للكاش

**المطلوب النهائي:** تطبيق ويب PWA ثنائي اللغة (عربي/إنجليزي) RTL-first، يشمل كل الفيتشرز المذكورة بالتفصيل أدناه، بأداء سريع (First Load < 2s، تنقّل فوري)، وقابل للاستضافة على VPS مصري/خليجي أو Laravel Forge.

---

## 2. الستاك التقني المقترح

| الطبقة | التقنية |
|---|---|
| Backend | Laravel 12 (PHP 8.3+) — REST API |
| Database | MySQL 8 (InnoDB, `utf8mb4_general_ci` أو `utf8mb4_unicode_ci`) |
| Cache | Laravel Cache (Redis لو متاح، وإلا File/Array) |
| Queue/Jobs | Laravel Queue + Scheduler (الإشعارات اليومية، المصروفات المتكررة) |
| Auth | Sanctum tokens (SPA cookie) + Socialite Google + Laravel Notifications (emails) |
| Frontend | React 18/19 + TypeScript + Vite + React Router |
| Data fetching | TanStack React Query (v5) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Styling | Tailwind CSS (بنفس Design System أدناه) |
| i18n | i18next + RTL (dir="rtl") |
| PWA | vite-plugin-pwa / Workbox |
| OCR | Tesseract على السيرفر (أو ميكروسيرفس) — يفضّل exec عبر `tesseract` binary |
| Push | `minishlink/web-push` |
| Export | CSV (يدوي) + Excel (`phpoffice/phpspreadsheet`) + PDF (dompdf / Browsershot) |
| Payments | لا دفع إلكتروني بعد (Paymob مستقبلاً) — الترقية يدوية من الأدمن |

---

## 3. قواعد التصميم (Design System)

> هذه القواعد مأخوذة من التطبيق الحالي — يجب الحفاظ عليها حرفيًا في الواجهة الجديدة.

### 3.1 الهوية البصرية
- **اللون الأساسي (Primary):** `#065F46` (أخضر غامق/زمردي) — الأزرار الرئيسية، الروابط، الـ active states. Hover: `#054d3a`.
- **الخلفية:** `#FBF9F4` (بيج فاتح دافئ).
- **لون النص:** `#1C1B1A`.
- **الحدود:** `#E4DFD3` (بيج فاتح).
- **تمييز ثانوي:** `#D97706` (كهرماني) — للتحذيرات/التنبيهات.
- **خلفيات خضراء فاتحة:** `#ECFDF5` / `#D1FAE5` — للبطاقات النشطة والأخبار.
- **الحالة المالية:** الدخل = أخضر، المصروف = أحمر/وردي، المحايد = رمادي.

### 3.2 الخطوط
- **النصوص (Body):** خط **Cairo** (عربي واضح).
- **العناوين التسويقية:** خط **Markazi Text** للـ hero/marketing فقط.
- أحجام: عناوين كبيرة للصفحة، `font-medium` للبطاقات، `text-sm` للتفاصيل الثانوية.

### 3.3 الأشكال والمسافات
- **البطاقات:** `rounded-2xl` + ظل خفيف (`shadow-sm`) + حدود `#E4DFD3`.
- **الأزرار:** `rounded-lg`، أساسية خضراء `#065F46` بنص أبيض، ثانوية بحدود رمادية وخلفية بيضاء، خطر = أحمر.
- **الحقول (Inputs):** `rounded-lg` + حدود `neutral-300` + focus أخضر (`focus:ring-2 ring-emerald-100`).
- **الأيقونات:** داخل دوائر خلفية ناعمة (`iconCircle`).

### 3.4 الأنماط السلوكية
- **RTL أولاً (Arabic-first):** الاتجاه الافتراضي `rtl`، و `ltr` عند الإنجليزية. كل الـ layouts والمحاذاة تتأقلم تلقائياً.
- **الرسائل:** **ممنوع نهائياً** `window.alert` / `window.confirm` المتصفحية — استبدلها بـ **ConfirmDialog** مخصص داخل التطبيق (overlay + بطاقة) و **Toasts** للنجاح/الخطأ (أخضر للنجاح، أحمر للخطأ، تختفي تلقائياً بعد ~3 ثواني).
- **Empty states:** بطاقات منقطة (`border-dashed`) بنص رمادي ورسمة/أيقونة.
- **Skeletons:** أثناء التحميل، لا Spinners وحيدة.
- **Responsive:** Desktop = Sidebar + Topbar، Mobile = Bottom Nav + Sheet للمزيد.

---

## 4. الأصول المعمارية (قواعد مالية إلزامية)

هذه **قواعد تجارية لا يجوز كسرها** — نقلها كما هي من التطبيق القديم:

### 4.1 الفلوس = أعداد صحيحة (Minor Units)
- **كل مبلغ يُخزَّن كـ BIGINT (عدد صحيح) لأصغر وحدة** (قرش/سنت). ممنوع تخزين floats.
- دوال تحويل إلزامية: `toMinorUnits()` (بالتقريب)، `fromMinorUnits()`، و `formatMoney()` عبر `Intl.NumberFormat`.
- لا عمليات حسابية على floats في أي مكان في الكود.

### 4.2 اتساق الرصيد (cached_balance)
- كل حساب فيه `cached_balance` يتم تحديثه **داخل نفس معاملة قاعدة البيانات (DB Transaction)** مع إنشاء/تعديل/حذف المعاملة.
- **إنشاء معاملة:** `cached_balance = cached_balance + delta` (دخل `+`، مصروف `-`).
- **تعديل:** اعكس أثر العملية القديمة ثم طبّق الجديدة (قد تكون على حساب مختلف).
- **حذف/أرشفة:** اعكس الأثر.
- **شبكة أمان:** دالة `recalculateAccountBalance()` تعيد الحساب من الأصل (رصيد = افتتاحي + دخل − مصروف + تحويلات داخلة − خارجة) — للمراجعة/الإصلاح.

### 4.3 التحويلات (Transfers)
- خصم من حساب المصدر + إيداع في حساب الوجهة داخل معاملة واحدة.
- **فحص الرصيد:** ممنوع تحويل يخلي رصيد المصدر سالباً (إلا لو الحساب مسموح بـ overdraft).
- التحويلات **لا تؤثر** على الدخل/المصروف.

### 4.4 تعدد العملات
- كل حساب له عملة (EGP/USD/EUR/SAR/AED...).
- **عملة الـ Workspace الأساسية** + جدول `exchange_rates` في الـ workspace (أو JSON column) لأسعار الصرف اليدوية.
- التقارير/الملخصات تحوّل كل شيء للعملة الأساسية؛ **لو سعر الصرف ناقص → تعرض الواجهة "غير متاح" بدل رقم خاطئ** (`canConvertAll` + `missingRates`).
- الرصيد الإجمالي للداشبورد يُعرض بالعملات + الإجمالي المحوّل للعملة الأساسية.

---

## 5. الفيتشرز الكاملة (نقل كل منها كما هو)

### 5.1 المصادقة (Auth)
- تسجيل/دخول بالإيميل وكلمة مرور (حد أدنى 8 أحرف).
- **تأكيد الإيميل** عند التسجيل (إيميل تحقق برابط).
- **نسيان كلمة المرور / إعادة التعيين** عبر إيميل.
- **Google OAuth** (اختياري) + ربط الحساب بنفس الإيميل.
- جلسة مدتها 30 يوم، تجديد 24 ساعة.
- صفحات: `/login`، `/register`، `/forgot-password`، `/reset-password`، `/verify-email`.
- `ADMIN_EMAILS` (قائمة) → تحدد مستخدمي الأدمن.

### 5.2 المساحات (Workspaces) والفريق
- المستخدم يستطيع إنشاء **أكثر من Workspace** (حسب الباقة).
- أنواع المساحة: `personal` / `freelance` / `business`.
- **الأدوار:** `owner` / `admin` (تعديل) / `member` (تعديل) / `viewer` (قراءة فقط).
- **المساحة النشطة:** يختار المستخدم مساحة نشطة، لكن **كل عملية تحقق صلاحية** عبر `verifyWorkspaceAccess()` — ممنوع الوثوق بـ `workspace_id` من العميل بدون تحقق.
- **الدعوات:** بريد + token عشوائي صالح 7 أيام + حد أقصى للأعضاء (حسب الباقة) + rate limit 20 دعوة/ساعة.
- **ميزات الباقة تُورّث لمساحة المالك:** عضو في مساحة Plus يستخدم أدوات Plus **داخل تلك المساحة فقط**.

### 5.3 الحسابات (Accounts)
- الحقول: name، type، currency، opening_balance، cached_balance، is_archived.
- عند الإنشاء: `cached_balance = opening_balance`.
- ملخص الأرصدة مجمّع حسب العملة + الإجمالي بالعملة الأساسية.
- أرشفة (soft delete) — لا حذف فعلي.

### 5.4 التصنيفات (Categories)
- نظام واحد: **System Categories** (مشتركة بين كل المساحات، `workspace_id = NULL`) + **Custom Categories** لكل مساحة.
- نوعان: `income` / `expense`، مع أيقونة.
- **تصنيفات افتراضية (~24):** 6 دخل (مرتب، عملاء،...) + 13 مصروف (أكل، إيجار، سوفت وير،...) + اقتراحات حسب نوع المساحة.
- أرشفة فقط، لا حذف فعلي.

### 5.5 المعاملات (Transactions)
- حقول: type (income/expense)، amount، transaction_date، description، notes، account_id، category_id، client_id (اختياري)، project_id (اختياري)، attachment، created_by.
- **قائمة مفلترة + بحث + Pagination:**
  - فلاتر: type، account، category، date range، بحث نصي في الوصف (substring).
  - **Server-side pagination** (صفحة/صفحة من API مع meta).
  - بحث debounced (300ms).
- **إرفاق صورة إيصال** مع كل معاملة.
- تصدير Excel (بحد أقصى 5000 صف + علم `truncated`).

### 5.6 التحويلات (Transfers)
- من حساب إلى حساب، مبلغ، تاريخ، وصف اختياري.
- نفس العملة فقط (أو بنفس سعر صرف معيّن).
- فحص رصيد المصدر (انظر 4.3).

### 5.7 العملاء والمشاريع (Clients & Projects)
- **عملاء:** name، email، phone + عدد مشاريعهم + بحث بالاسم/رقم الموبايل + **تعديل** + **أرشفة**.
- **مشاريع:** name، status (active/completed/paused)، expected_amount، due_date، client_id.
- لكل مشروع: **إجمالي المدفوع** (مجموع معاملات income المرتبطة بالمشروع) + **المتبقي**.
- **تذكيرات مستحقات** المشاريع (متأخرة عن الاستحقاق).

### 5.8 الفواتير (Invoices) والطباعة
- ترقيم تلقائي: `INV-{year}-{0001}` (مع قفل/sequence لمنع التكرار).
- بنود: description، quantity، unit price، amount.
- **الحالات:** `draft` / `sent` / `paid` / `cancelled` + **`overdue` يُستنتج تلقائياً** من تاريخ الاستحقاق.
- عند mark as paid → تسجيل `paid_at`.
- **طباعة PDF بصيغتين:** A4 و POS (فاتورة حرارية) + **طباعة تقرير** PDF.
- عرض بيانات الـ workspace (business name، logo، tax id، phone، address).

### 5.9 الميزانيات (Budgets)
- ميزانية شهرية لتصنيف (أو ميزانية عامة بدون تصنيف).
- حقول: name، amount، category_id (اختياري)، month/period.
- **نسبة الصرف:** حساب صرف الشهر الحالي لكل تصنيف عبر SQL aggregation + تحويل العملات للعملة الأساسية.
- أرشفة الميزانية.

### 5.10 أهداف الادخار (Savings Goals)
- حقول: name، target_amount، current_amount، deadline (اختياري).
- **إضافة للهدف:** `current_amount += x` (أو سحب).
- عرض: نسبة الإنجاز %، المتبقي، هل اكتمل.

### 5.11 المصروفات المتكررة (Recurring Expenses)
- حقول: description، amount، frequency (`monthly`/`weekly`)، day_of_month/day_of_week، next_due_date، account، category، is_active.
- **تسجيل الآن (Record now):** ينشئ معاملة مصروف + يقدّم `next_due_date` تلقائياً (`advanceDueDate`).
- **قائمة المستحقة (Due):** اللي `next_due_date <= نهاية اليوم`.
- **Scheduler يومي:** إشعار/تسجيل تلقائي للمستحقات (اختياري، يمكن تركه manual).

### 5.12 التقارير (Reports)
- **ملخص الفترة:** دخل / مصروف / صافي — لنطاقات: هذا الشهر، الشهر السابق، آخر 3 شهور، آخر 6 شهور، هذه السنة، custom.
- **توزيع حسب التصنيف** (Category Breakdown): مجموع لكل تصنيف (ترتيب تنازلي) + نسب.
- **الاتجاه الشهري** (Monthly Trend): دخل/مصروف لكل شهر آخر N شهر.
- **تقارير متقدمة (Plus):** متوسط 3 شهور + جدول 6 شهور + **رصيد تراكمي (Cash Flow)**.
- تصدير CSV/Excel/PDF (حسب الباقة).

### 5.13 استيراد CSV بنكي
- رفع ملف CSV → محلل يدعم quotes ويتعرف على أعمدة (date/description/amount) بالعربية والإنجليزية.
- يتخطى الصفوف الفاسدة، ينشئ معاملات expense.
- نافذة preview قبل الحفظ.

### 5.14 النسخ الاحتياطي (Backup / Restore)
- **تصدير JSON** يشمل كل مجموعات البيانات (حسابات، تصنيفات، معاملات، عملاء، مشاريع، فواتير، ميزانيات، أهداف، متكررات، تحويلات) + meta المساحة (يشمل الأرشيف، يستثني system categories لأنها مشتركة).
- **استعادة:** إعادة بناء Workspace جديد بالكامل من الـ JSON مع إعادة ربط العلاقات، داخل معاملة DB واحدة.

### 5.15 OCR للايصالات + اقتراح التصنيف
- **نقطتان منفصلتان:** `/uploads/receipt` (رفع + ضغط sharp → webp، حد 5MB، rate limit 20/60s) و `/receipts/scan` (Tesseract eng+ara، timeout ~45s، rate limit 10/60s). الأولى للكل، والثانية لمشتركي Plus فقط.
- **استخراج حقول:** الإجمالي (أنماط عربي/إنجليزي) + التاريخ + اسم التاجر (أول سطر نصي).
- **اقتراح تصنيف:** قواعد كلمات مفتاحية ثنائية اللغة لـ ~15 تصنيف + fallback مع ثقة منخفضة.
- النتيجة تمر للنموذج: `scan: { amount?, transactionDate?, description?, confidence? }` + `categorySuggestion: { categoryId, confidence }` — يملأها تلقائياً (انظر 5.24).
- متاح فقط في باقة Plus.

### 5.16 الإشعارات (Email + Push)
- **إشعار يومي للداشبورد** (بعد الاستجابة): ملخص الدخل/المصروف + تنبيهات (budget exceeded، هدف اكتمل، مستحقات، إلخ).
- **إرسال مرة واحدة يومياً** لكل عنصر (dedupe key: id:workspace:item:date).
- **Web Push** (VAPID) للاشتراكات + إلغاء عند 404/410.
- **إشعار انتهاء الاشتراك** خلال 1-7 أيام قبلها.
- قوالب HTML بسيطة RTL.

### 5.17 تذكيرات واتساب (اختياري)
- حفظ رقم واتساب في الإعدادات.
- روابط/رسائل تذكير للمصروفات المتكررة والمستحقات المتأخرة.

### 5.18 الباقات والخطط (Freemium)
- **3 خطط:** `free` / `pro` ($5 شهرياً أو $48 سنوياً) / `plus` (legacy مخفية).
- **~15 flag للميزات:** csvExport, pdfExport, recurringExpenses, clientsAndProjects, savingsGoals, bankImport, advancedReports, workspaceBackup, pushNotifications, multiCurrency, whatsappReminders, noAds, teamWorkspace, ocrReceipts, aiCategory.
- **حدود كمية:** maxInvoicesPerMonth (10 free)، maxClients (20)، maxActiveProjects (5)، maxSavingsGoals (2)، maxRecurringExpenses (3) — `-1` = غير محدود.
- **Free = مع إعلانات.** Pro = بدون إعلانات.
- **لا دفع إلكتروني بعد:** الترقية **يدوية من الأدمن** (تعديل plan للمستخدم) + رابط واتساب للتواصل.
- الـ limits قابلة للتعديل من لوحة الأدمن مع versioning للترحيل.
- `resolveEffectivePlan`: suspended/cancelled/منتهي = يعود free.

### 5.23 الدفع الإلكتروني (Paymob Accept — scaffold مستقبلي)
- **غير مفعّل في الإنتاج**: الترقية يدوية فقط. لا Stripe.
- يوجد **هيكل Paymob جاهز** لمرحلة لاحقة: `isPaymobConfigured()` (يتطلب `PAYMOB_API_KEY` + `PAYMOB_INTEGRATION_ID` + `PAYMOB_HMAC_SECRET`) و `createPaymobCheckoutIntention({ userId, email, planId: pro|plus, amount })` تُرجع hosted checkout iframe عند التفعيل.
- حتى التفعيل الكامل (checkout + webhook handlers): كل استدعاء يرجع `not_configured` أو `not_activated` مع رسالة "تواصل مع الدعم للترقية اليدوية". **لا تُبنى تجربة دفع فعلية إلا بعد التفعيل الكامل.**

### 5.24 نموذج "إضافة معاملة" (إنشاء معاملة)
السلوك المطلوب حرفياً من التطبيق الحالي (`create-transaction-form`):
- **تبديل النوع:** زران flex-1 (مصروف/دخل) — المصروف default، النشط أحمر (`border-red-300 bg-red-50 text-red-700`)، الدخل النشط أخضر (`border-emerald-300 bg-emerald-50 text-emerald-700`).
- حقول: المبلغ (number، step 0.01، min 0.01، محاذاة يمين)، التاريخ (default = اليوم)، الحساب، التصنيف (مفلتر حسب النوع، auto-select أول تصنيف)، وصف اختياري، ملاحظات اختيارية.
- **عملاء/مشاريع اختيارية:** select بهم فقط لو في نتائج (خيار "لا شيء").
- **رفع إيصال** (jpeg/png/webp):
  - لو `ocrReceipts` متاحة → يرفع لنقطة scan (يرجع scan + categorySuggestion)، **لو مش متاحة** → يرفع لنقطة upload العادية فقط.
  - عند نجاح الـ scan: **يعبّي تلقائياً** المبلغ + التاريخ + الوصف، يفرض النوع مصروف، ويعرض نسبة الثقة. عند فشل الـ scan: hint "scanFailed" بس.
  - عند categorySuggestion: يختار التصنيف.
- **زر "اقترح التصنيف"** (علم `aiCategory`): POST بـ `{ workspaceId, type, description }` → يملأ التصنيف + نسبة الثقة. معطّل لو لا يوجد وصف.
- hidden fields: workspaceId + attachmentUrl + attachmentName.
- زر الإرسال: `rounded-lg bg-emerald-700 text-white hover:bg-emerald-800`، معطّل أثناء الحفظ أو عدم وجود حسابات/تصنيفات. رسالة `needsAccount` بكهرماني لو لا يوجد حساب.

### 5.19 لوحة الأدمن `/admin`
- إحصائيات (posts/users/subscribers).
- **المستخدمين:** جدول (الاسم/الإيميل/الخطة/الحالة/تاريخ التسجيل) + تحكم في الاشتراك (ترقية/تعليق/إلغاء).
- **الخطط:** تعديل الـ flags والحدود والنصوص (ar/en) لكل خطة.
- **المقالات:** إدارة (جدول + محرر Markdown + صورة مميزة).
- **محتوى الرئيسية:** editable steps.
- **المشتركين:** جدول + إلغاء اشتراك.
- حماية: الأدمن فقط (ADMIN_EMAILS).

### 5.20 الموقع التسويقي + المدونة
- الصفحة الرئيسية (Hero + 3 خطوات + blog + newsletter + CTA).
- **التسعير** (خطط مترجمة حسب اللغة).
- **FAQ** (محتوى قابل للترجمة).
- **المدونة:** فهرس (فلتر category) + مقال (Markdown → HTML، مقالات ذات صلة، meta OG).
- **الإعلانات (AdSense):** `AdSlot` على المدونة والـ marketing، معطّلة لمستخدمي Pro (noAds).
- صفحات قانونية (Privacy، Terms، Support).
- **SEO:** sitemap + robots (dashboard ممنوع من الفهرسة) + Open Graph.

### 5.21 ثنائية اللغة (i18n)
- لغتان: `ar` (افتراضي، RTL) و `en` (LTR).
- كل النصوص في ملفات ترجمة منفصلة لكل لغة.
- مبدّل لغة في الهيدر.
- التواريخ والأرقام: `ar-EG` / `en-US`.
- المحتوى العربي (الرئيسية) من قاعدة البيانات، والإنجليزي من ملفات الترجمة.

### 5.22 PWA
- manifest (الاسم، الأيقونات 192/512، standalone، theme `#065F46`، dir rtl، lang ar).
- Service Worker: يخزّن **الأصول فقط**، ويمنع خزن HTML/API (تجنّب البيانات القديمة).
- زرار تثبيت مخصص (`beforeinstallprompt` → deferred prompt → `prompt()` بضغطة المستخدم) + خطوات يدوية لـ iOS.
- **ممنوع** استدعاء `preventDefault()` على الحدث بدون UI حقيقي.

---

## 6. قاعدة البيانات (MySQL Schema المقترح)

> جميع الجداول `InnoDB` + `utf8mb4`، مع soft-delete عبر `is_archived` (أو `deleted_at`) حيث يناسب، و `timestamps`.

```
users                 (id, name, email, password, google_id?, email_verified_at, remember_token)
password_reset_tokens
personal_access_tokens (Sanctum)

workspaces            (id, owner_id, name, type, currency, exchange_rates JSON, branding JSON, created_at)
workspace_members     (workspace_id, user_id, role [owner/admin/member/viewer], UNIQUE(workspace_id,user_id))
workspace_invitations (workspace_id, email, token, invited_by, expires_at, UNIQUE(token))

accounts              (id, workspace_id, name, type, currency, opening_balance BIGINT, cached_balance BIGINT, is_archived)
categories            (id, workspace_id NULLABLE, kind, name, icon, is_system, slug, is_archived)  -- system = workspace_id NULL
transactions          (id, workspace_id, account_id, category_id, client_id NULL, project_id NULL,
                       type, amount BIGINT, transaction_date, description, notes,
                       attachment_url, created_by, is_archived)
                       INDEX (workspace_id, is_archived, transaction_date), INDEX (workspace_id, account_id), INDEX (workspace_id, category_id)

transfers             (id, workspace_id, from_account_id, to_account_id, amount BIGINT, transfer_date, description, is_archived)
clients               (id, workspace_id, name, email, phone, is_archived)
projects              (id, workspace_id, client_id NULL, name, status, expected_amount BIGINT, due_date, is_archived)
invoices              (id, workspace_id, client_id NULL, invoice_number UNIQUE, issue_date, due_date, status, paid_at, items JSON, is_archived)
budgets               (id, workspace_id, category_id NULL, name, amount BIGINT, period, is_archived)
savings_goals         (id, workspace_id, name, target_amount BIGINT, current_amount BIGINT, deadline, is_archived)
recurring_expenses    (id, workspace_id, account_id, category_id, description, amount BIGINT,
                       frequency, day_of_month, day_of_week, next_due_date, is_active, is_archived)

plans                 (id, key, name_ar, name_en, price, flags JSON, limits JSON, is_active, sort_order, limits_version)
user_subscriptions    (id, user_id, plan, status, expires_at, updated_by, timestamps)
push_subscriptions    (id, user_id, endpoint UNIQUE, keys JSON)
email_notification_log(id, dedupe_key UNIQUE, ...)
posts                 (id, locale, slug, title, excerpt, content, category, featured_image, is_published, published_at)
site_contents         (key, locale, content JSON)
subscribers           (email UNIQUE)
user_settings         (user_id, whatsapp_phone, locale)
```

**قواعد:** كل query بـ `where workspace_id = X` لازم يكون عنده index مركّب مناسب. الفواتير لازم `invoice_number` فريد (مع lock على الترقيم). لا JOIN بدون index على العمود.

---

## 7. تصميم الـ API (REST)

نمط موحّد لكل الموارد:

```
GET    /api/workspaces/{id}/transactions?page=1&per_page=30&type=&account_id=&category_id=&date_from=&date_to=&search=
POST   /api/workspaces/{id}/transactions
PATCH  /api/workspaces/{id}/transactions/{tx_id}
DELETE /api/workspaces/{id}/transactions/{tx_id}     (soft archive)
```

- **الاستجابة الموحدة للقوائم:** `{ data: [...], meta: { page, per_page, total, total_pages } }`.
- **البحث:** server-side + debounce 300ms في الواجهة.
- **الاستجابة للأخطاء:** موحّدة `{ error: { code, message } }` مع HTTP codes صحيحة.
- **التحقق:** Form Request + قواعد Zod مطابقة على الواجهة.
- **Authorization:** لكل endpoint `workspace_id` لازم تمر بـ `verifyWorkspaceAccess` (owner/admin/member=write، viewer=read).
- **تحويل العملات:** التقارير ترجع `can_convert_all` + `missing_rates` لتحديد عرض "غير متاح".
- **Rate limiting:** على النقاط الحساسة (auth، OCR، CSV import).

---

## 8. بنية المشروع

### Laravel Backend
```
app/Http/Controllers/Api/V1/   → Controllers رفيعة (REST)
app/Http/Requests/             → Form Requests (validation)
app/Models/                    → Eloquent models + casts (BIGINT minor units)
app/Services/                  → Money, Currency, Balance, InvoiceNumber, Recurring, Reports
app/Jobs/                      → Daily notifications, due recurring, email sending
app/Actions/                   → منطق تجاري معقّد (createTransaction مع تحديث الرصيد)
database/migrations/           → كل الجداول + indexes
database/seeders/              → system categories + plans + demo posts
routes/api.php                 → /api/v1/...
```

### React Frontend
```
src/
  api/          → axios/fetch wrapper + react-query hooks لكل مورد
  components/ui/  → Button, Input, Card, Modal, ConfirmDialog, Toast, Skeleton, EmptyState, DataTable, Pagination, SearchInput
  components/   → مكونات الصفحات
  features/     → لكل domain (auth, accounts, transactions, invoices, ...)
  hooks/        → useDebounce, usePagination, useWorkspace, useAuth
  i18n/         → ar/en + RTL
  routes/       → React Router
  stores/       → فقط UI state خفيف (Zustand أو Context للـ workspace النشطة/اللغة) — ممنوع تخزين server state
  styles/       → Tailwind + tokens التصميم
```

**قواعد:** لا API calls داخل components (استخدم hooks/query)، لا Business Logic في components، component = UI فقط.

---

## 9. الأداء

1. **Indexes** على كل الـ where/join/order (أعلى أولوية).
2. **Pagination** لكل list (لا تحميل كامل).
3. **Debounced search** (300ms).
4. **Projection/select** محدد للأعمدة المطلوبة فقط في الـ queries الثقيلة.
5. **Caching:** استجابات القوائم (Laravel Cache / HTTP Cache-Control) + `react-query` staleTime مناسب (5 دقائق للقوائم).
6. **Aggregation في SQL** للتقارير (GROUP BY) بدل جلب كل البيانات والعمليات في JS.
7. **Code splitting:** تحميل lazy للـ charts والثقال.
8. **Optimistic updates** في react-query للمعاملة السريعة.
9. **Queue** للإشعارات/المصروفات المتكررة — خارج الـ request.
10. First Load الهدف < 2s، TTFB للـ API < 300ms (بعد الكاش).

---

## 10. الأمان

- Sanctum SPA (httpOnly cookie session) + CSRF.
- **Authorization محكم:** كل عملية مالية تتحقق من عضوية الـ workspace والدور.
- `is_archived` لا يظهر أبداً في القوائم (فلتر دائم).
- الترقية/التعليق = من الأدمن فقط.
- Rate limiting على auth و OCR.
- لا كشف secrets في الـ env (كلها عبر `config/` + `.env`).
- تخزين الملفات على Laravel Filesystem (S3/R2 أو local) — لا files داخل الـ repo.

---

## 11. Milestones (التنفيذ على مراحل)

| Phase | المحتوى | الناتج |
|---|---|---|
| **1** | Auth + Workspaces + Accounts + Categories | دخول + مساحة + حسابات + تصنيفات |
| **2** | Transactions + Transfers + Balance | السجل الرئيسي + الأرصدة |
| **3** | Clients + Projects + Invoices + Print | العملاء/المشاريع/الفواتير |
| **4** | Budgets + Goals + Recurring | الميزانيات/الأهداف/المتكررات |
| **5** | Reports + Advanced + Exports | التقارير والتصدير |
| **6** | Import CSV + Backup/Restore | الاستيراد والنسخ الاحتياطي |
| **7** | Plans + Limits + Admin | نظام الباقات والأدمن |
| **8** | Notifications (email/push) + WhatsApp | الإشعارات |
| **9** | OCR + Category suggestion | الـ OCR |
| **10** | Marketing + Blog + i18n + SEO | الموقع العام |
| **11** | PWA + Performance + Polish | PWA + تحسينات نهائية |

**كل Phase تُسلّم تعمل وتُختبر قبل البدء في التالية.**

---

## 12. قواعد Code Quality

- **الفلوس:** أبداً عدد صحيح (BIGINT) — ممنوع float.
- **الدوال:** verbs، ≤ 20 سطر، ≤ 3 parameters (object للزيادة)، return early.
- **Naming:** booleans = is/has/can، ملفات components = PascalCase، أدوات = camelCase.
- **Comments:** للـ "why" فقط. لا magic numbers — constants.
- **ترجمة:** كل النصوص من ملفات i18n، لا hardcode عربي في الكود.
- **Tests:** لكل Service/Logic مالي (money math، balance، invoice numbering، recurring advance) — ولو أقلها وحدة اختبار أساسية لكل module.

---

## 13. Checklist القبول النهائي

- [ ] كل فيتشر في القسم 5 موجود وشغال؟
- [ ] الفلوس كلها integers (لا floats)؟
- [ ] الأرصدة تتحدث ذرياً مع المعاملات؟
- [ ] أول تحميل < 2s و navigation فوري؟
- [ ] RTL/LTR سليمين بالعربي والإنجليزي؟
- [ ] لا `alert`/`confirm` متصفحية — كل الرسائل ConfirmDialog/Toast؟
- [ ] PWA يشتغل (install + offline assets)؟
- [ ] الأدمن بيقدر يعدّل الخطط والحدود؟
- [ ] CSV/Excel/PDF export يشتغلون؟
- [ ] النسخ الاحتياطي والاستعادة يشتغلون بدون فقدان بيانات؟
- [ ] تقارير متعددة العملات تعرض "غير متاح" عند نقص السعر؟
- [ ] لا console errors ولا warnings؟

---

## 14. الخلاصة

> «لا تخسر أي فيتشر. انقل المنطق المالي حرفياً. ستاك أسرع وأبسط. عربي أولاً، RTL، تصميم نظيف.»

**الأولويات:** الأرصدة الذرية أولاً → المعاملات → الفواتير → التقارير → الباقات → الباقي.
