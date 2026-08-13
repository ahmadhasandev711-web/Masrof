# مصروفاتي (Masrofaty)

تطبيق عربي أولاً (Arabic-first) لإدارة الدخل والمصروفات — للأفراد، الفريلانسرز، وأصحاب المشاريع الصغيرة في مصر.

## الستاك التقني

| التقنية | الإصدار |
|---|---|
| Node.js | 24.x (Active LTS) |
| Next.js | 16.2.10 (App Router) |
| React | 19.2 |
| TypeScript | 5.9 |
| MongoDB | 8.x (**لازم replica set** — MongoDB Atlas مثالي) |
| Mongoose | 9.7.x |
| Tailwind CSS | v4 |
| Better-Auth | مصادقة (email/password + Google OAuth اختياري) |
| Zod v4 | Validation |
| Serwist | PWA / Service Worker |
| Tesseract.js | OCR للإيصالات (Plus) |

## التشغيل محلياً

```bash
npm install
cp .env.example .env.local   # واملأ القيم الحقيقية
npm run seed:categories      # لازم قبل أي حاجة تانية — بيدخل التصنيفات الافتراضية
npm run seed:posts           # اختياري — بيدخل مقالات بداية للمدونة
npm run dev
```

### مشاكل اتصال MongoDB؟

لو شفت `MongooseServerSelectionError` أو `ReplicaSetNoPrimary`:

```bash
npm run db:ping
```

**في MongoDB Atlas:**
1. **Network Access** → أضف IP جهازك (أو `0.0.0.0/0` للتطوير فقط).
2. **Database** → تأكد إن الـ cluster **مش Paused**.
3. **Database Access** → المستخدم عنده صلاحية read/write على قاعدة `masrofaty`.

**على Windows:** الافتراضي `mongodb+srv` مع DNS عام (8.8.8.8). لو فشل، جرّب `MONGODB_URI_DIRECT` من Atlas، أو `MONGODB_RESOLVE_SRV=1` للتحويل اليدوي.

**Turbopack:** لو في أخطاء غريبة في التطوير، جرّب `npx next dev --webpack`.

### متغيرات البيئة المطلوبة (`.env.local`)

- `MONGODB_URI` — من MongoDB Atlas (يدعم transactions — لازم replica set، مش standalone mongod)
- `MONGODB_DB_NAME`
- `BETTER_AUTH_SECRET` — `openssl rand -base64 32`
- `BETTER_AUTH_URL` و `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` في التطوير
- `RESEND_API_KEY` + `AUTH_EMAIL_FROM` — **اختياري للتطوير** (بدونها: الإيميلات تتطبع في التيرمنال)

## البناء للإنتاج

```bash
npm run build   # يستخدم --webpack عمداً (Serwist محتاج webpack، مش Turbopack)
npm run start
npm test        # Vitest — money, OCR parser, display names
```

## البنية المعمارية (Modular Monolith)

```
src/
  app/                  → صفحات/layouts فقط (App Router)
  features/             → منطق كل domain مستقل (auth, workspaces, accounts, categories, transactions, budgets, reports)
  components/           → مكونات UI مشتركة
  lib/                  → auth, db, money, env (infrastructure)
  models/               → Mongoose schemas المشتركة بين الـ features
```

### القرارات المعمارية الأساسية

1. **Multi-tenancy عبر Workspace:** كل عملية على بيانات مالية بتمر أولاً على `verifyWorkspaceAccess()` — مفيش `workspaceId` من الـ client بيتصدق عليه من غير ما نتأكد إن المستخدم فعلاً عضو في المساحة دي.

2. **الفلوس = Integer دايماً:** كل قيمة مالية متخزنة بالقرش (minor units) — `lib/money`. مفيش عمليات حسابية على floats.

3. **استراتيجية الـ Balance (Hybrid):** `cachedBalance` بيتحدث atomically مع كل Transaction (نفس الـ MongoDB transaction)، والمصدر الحقيقي يفضل الـ Transactions نفسها. `recalculateAccountBalance()` بتعمل إعادة حساب من الأصل كشبكة أمان.

4. **Categories بدون تكرار:** كوليكشن واحد لـ System Categories (`workspaceId: null`) + Custom Categories، بدل ما ننسخ تصنيفات لكل Workspace.

5. **كل Transaction (إنشاء/تعديل/حذف) بتحصل جوه MongoDB Transaction واحدة** مع تحديث رصيد الحساب — ضمان إن الاتنين يحصلوا مع بعض أو يفشلوا مع بعض.

## الباقات والميزات

| الميزة | Free | Pro | Plus |
|--------|------|-----|------|
| مساحات العمل | 1 | 3 | ∞ |
| فريق (أعضاء/مساحة) | — | — | حتى 5 |
| OCR إيصالات | — | — | ✓ |
| تصنيف AI | — | — | ✓ |
| تقارير متقدمة + cash flow | — | — | ✓ |
| استيراد CSV بنك | — | — | ✓ |

- **إدارة الباقات:** `/admin/plans` — flags ديناميكية من MongoDB
- **Paymob:** مخطط لاحقاً (غير مفعّل حالياً)

## مساحة الفريق (Team Workspace)

- **Plus فقط** — مالك المساحة لازم يكون على باقة Plus
- **دعوة بالبريد** → `/invite/[token]` — قبول أو إنشاء حساب
- **أدوار:** `owner` · `member` (تعديل) · `viewer` (قراءة فقط)
- **حد أعضاء:** 5 في Plus (قابل للتعديل من `/admin/plans`)
- **Rate limit:** 20 دعوة/ساعة لكل مستخدم

## OCR والتصنيف الذكي

- **OCR:** رفع إيصال في `/dashboard/transactions` → `POST /api/receipts/scan` (Tesseract eng+ara)
- **AI category:** اقتراح تصنيف بالكلمات المفتاحية + زر «اقتراح تصنيف» (Plus)
- **Cash flow:** `/dashboard/reports/advanced` — متوسط 3 شهور + جدول 6 شهور + رصيد تراكمي

## الموقع العام والمدونة

- **معزول تمامًا** عن `/dashboard` — route group منفصل `(marketing)`، مفيش أي وصول لبيانات الـ Workspaces من هنا
- **المقالات:** موديل `Post` بسيط (Markdown → HTML وقت العرض بمكتبة `marked`)، بدون CMS UI — النشر عن طريق `npm run seed:posts` (idempotent بالـ slug، زي `seed:categories`)
- **ثنائي اللغة:** `{locale, slug}` — AR + EN
- **مكان الإعلانات:** `AdSlot` على المدونة (مقال + قائمة) — فعّل AdSense بـ `NEXT_PUBLIC_ADSENSE_CLIENT_ID` و slot IDs في `.env`؛ `/ads.txt` يتولّد تلقائياً
- **SEO:** `sitemap.ts` و`robots.ts` جاهزين، `/dashboard` ممنوع من الفهرسة
- **قرار معماري مهم:** صفحات المدونة `force-dynamic` (مش static ولا ISR) — عمدًا، عشان الـ build متعتمدش على اتصال قاعدة البيانات وقت البناء نفسه؛ لو الترافيك زاد كتير في المستقبل، سهل نرجع نضيف ISR وقتها

## Onboarding

- **دعوات معلّقة:** لو في دعوة workspace، تظهر في `/onboarding` قبل إنشاء مساحة جديدة
- **تصنيفات مقترحة:** حسب نوع المساحة (personal / freelance / business) — badges في نموذج الإنشاء

## أوامر مفيدة

- `npm run seed:categories` — يضيف/يحدّث التصنيفات الافتراضية (idempotent، آمن تشغله أكتر من مرة)
- `npm run seed:posts` — مقالات المدونة AR + EN
- `npm run db:ping` — يختبر اتصال MongoDB Atlas من جهازك
- `npm test` — اختبارات Vitest

## النشر على Hostinger (Node.js + GitHub)

**الدومين:** `https://masrofaty.qema-tech.com`

### 1) GitHub

```bash
git remote add origin https://github.com/ahmadhasandev711-web/Masrofaty.git
git push -u origin main
```

### 2) Hostinger hPanel

1. **Websites → Add website → Node.js Web App**
2. **Connect GitHub** → repo `Masrofaty` → branch `main`
3. **Build command:** `npm ci && npm run build`
4. **Start command:** `npm start`
5. **Node.js:** 20.x أو أحدث (يفضّل 22+)
6. **Subdomain:** `masrofaty.qema-tech.com`

### 3) Environment variables (في Hostinger — لا ترفع `.env.local` على GitHub)

| Variable | Production value |
|----------|------------------|
| `MONGODB_URI` | Atlas connection string |
| `MONGODB_DB_NAME` | `masrofaty` |
| `BETTER_AUTH_SECRET` | سر قوي (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | `https://masrofaty.qema-tech.com` |
| `NEXT_PUBLIC_APP_URL` | `https://masrofaty.qema-tech.com` |
| `ADMIN_EMAILS` | بريدك للوحة `/admin` |
| `RESEND_API_KEY` | (اختياري) لإرسال الإيميلات |

### 4) MongoDB Atlas

- **Network Access:** أضف IP سيرفر Hostinger (أو `0.0.0.0/0` مؤقتاً للتجربة)
- بعد النشر: `npm run seed:categories` و `npm run seed:posts` (مرة واحدة)

### 5) Google OAuth (إن استخدمته)

- Origins: `https://masrofaty.qema-tech.com`
- Redirect: `https://masrofaty.qema-tech.com/api/auth/callback/google`

## النقل إلى Vercel (الخطوة الحالية)

الملف [`vercel.json`](vercel.json) جاهز — region `fra1` (قريب من MongoDB Atlas أوروبا).

**Repo:** `https://github.com/ahmadhasandev711-web/Masrof`

### 1) ادفع آخر التغييرات على GitHub

```bash
git add .
git commit -m "Prepare Vercel deploy: freemium limits, plan sync, vercel.json."
git push origin main
```

### 2) Vercel Dashboard

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → `ahmadhasandev711-web/Masrof`
2. Framework: **Next.js** (يتعرّف تلقائي)
3. Build: `npm run build` · Install: `npm ci` · Output: default
4. **Environment Variables** (Production) — انسخ من `.env.local` وعدّل الـ URLs:

| Variable | Production value |
|----------|------------------|
| `MONGODB_URI` | نفس Atlas |
| `MONGODB_DB_NAME` | `masrofaty` |
| `BETTER_AUTH_SECRET` | نفس السر |
| `BETTER_AUTH_URL` | `https://masrofaty.qema-tech.com` |
| `NEXT_PUBLIC_APP_URL` | `https://masrofaty.qema-tech.com` |
| `TRUSTED_ORIGINS` | `https://masrofaty.qema-tech.com,https://*.vercel.app` |
| `ADMIN_EMAILS` | بريدك |
| `RESEND_API_KEY` + `AUTH_EMAIL_FROM` | (اختياري) |
| `S3_BUCKET` + `S3_*` + `S3_PUBLIC_BASE_URL` | **مطلوب** — Cloudflare R2 موصى به |

5. **Deploy** — انتظر أول build (~2–3 دقائق)

### 3) Custom Domain + DNS

1. Vercel → Project → **Settings → Domains** → أضف `masrofaty.qema-tech.com`
2. Vercel يعطيك سجل DNS (CNAME أو A)
3. في Hostinger hPanel → **DNS** للدومين `qema-tech.com`:
   - غيّر `masrofaty` من Hostinger Node إلى **CNAME** يشير لـ `cname.vercel-dns.com` (أو اللي Vercel يطلبه)
4. SSL يتفعّل تلقائي من Vercel (5–30 دقيقة)

### 4) بعد ما الدومين يشتغل

- [ ] Google OAuth: origins + redirect → `https://masrofaty.qema-tech.com`
- [ ] Resend: domain verified لـ `qema-tech.com`
- [ ] Atlas Network Access: `0.0.0.0/0` أو IP ranges Vercel
- [ ] اختبر: login · dashboard · فاتورة · رفع إيصال
- [ ] **أوقف** Node app على Hostinger (بعد التأكد)

### 5) Object storage (R2) — مطلوب للملفات

بدون S3/R2، الرفع يشتغل مؤقتًا بس **يُمسح عند كل redeploy**.

1. Cloudflare R2 → Create bucket
2. API token → Access Key + Secret
3. Public access / custom domain → `S3_PUBLIC_BASE_URL`
4. في Vercel env:
   ```
   S3_BUCKET=masrofaty
   S3_ACCESS_KEY_ID=...
   S3_SECRET_ACCESS_KEY=...
   S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   S3_REGION=auto
   S3_PUBLIC_BASE_URL=https://pub-xxxxx.r2.dev
   ```

Build يبقى `npm run build` (= `next build --webpack` لـ Serwist).
