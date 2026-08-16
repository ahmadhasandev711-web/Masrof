# Master Prompt — Refactor & Optimize Existing Next.js Project

> **السنة:** 2026
> **الهدف:** إصلاح وتحسين مشروع Next.js موجود (متوسط الحجم) بطيء وغير منظم.
> **القاعدة الذهبية:** «لا تخسر أي Feature موجود. حافظ على المنطق، حسّن الأداء والتنظيم.»

---

## 1. المبدأ الأساسي

أنت Senior Software Architect + Senior Next.js Developer + Performance Engineer.

المشروع موجود بالفعل على Vercel + MongoDB Atlas (سيول). المشكلة:
- **بطء شديد** في التحميل والتنقل.
- **كود غير منظم** — لا يطبق Separation of Concerns.
- **قاعدة بيانات** MongoDB في سيول = latency عالي للمستخدمين في مصر/العالم العربي.
- **لا pagination** — يتم تحميل كل البيانات دفعة واحدة.
- **لا indexes** — queries بطيئة.
- **state management فوضوي** — ربما Redux أو Context misuse.
- **no debounced search** — كل حرف يعمل request.
- **no lazy loading** — كل الصفحات تُحمل مرة واحدة.

**المطلوب:**
> «أعد تنظيم المشروع وتسريعه من غير ما تخسر أي Feature أو أي منطق Business.»

---

## 2. قواعد العمل (Golden Rules — Applied)

### 2.1 لا تخسر Features

- **قبل ما تمسح أي ملف:** افهم إيه اللي بيعمله.
- **قبل ما تعدل أي logic:** تأكد إن الـ test (أو الـ manual test) بيشتغل.
- **لا تحذف component لمجرد إنه مش منظم** — refactor it.
- **لو feature مش مذكور في البرومبت:** افترض إنه موجود ومحتاج يفضل شغال.

### 2.2 Audit First, Refactor Second

**قبل ما تكتب أي كود جديد:**

1. **اقرأ المشروع كامل:**
   - `package.json` — إيه الـ dependencies؟ إيه القديم؟
   - `app/` أو `pages/` — إيه الـ routes؟
   - `components/` — إيه الـ components المكررة؟
   - `lib/` أو `utils/` — إيه الـ helpers؟
   - API routes / Server Actions — إيه الـ endpoints؟
   - Database models — إيه الـ schemas؟

2. **حدد المشاكل:**
   - بطء فين بالظبط؟ (initial load؟ navigation؟ API؟ database؟)
   - إيه الـ components اللي بتعمل re-render كتير؟
   - إيه الـ API calls المكررة؟
   - إيه الـ N+1 queries؟

3. **خطط:**
   - إيه اللي يتنقل؟ (move)
   - إيه اللي يتعدل؟ (refactor)
   - إيه اللي يتضاف؟ (add)
   - إيه اللي يتحذف؟ (remove — بحذر)

### 2.3 Performance First

**الأولويات بالترتيب:**

| الأولوية | الإجراء | التأثير |
|----------|---------|---------|
| 1 | **Database Indexes** | أعلى تأثير |
| 2 | **Pagination** | أعلى تأثير |
| 3 | **Debounced Search** | متوسط |
| 4 | **Lazy Loading / Code Splitting** | متوسط |
| 5 | **State Management Cleanup** | متوسط |
| 6 | **Memoization** | منخفض-متوسط |
| 7 | **Image Optimization** | منخفض-متوسط |

---

## 3. Database — MongoDB Optimization أو Migration

### 3.1 لو هتفضل على MongoDB (Quick Fix)

- **Indexes:**
  ```javascript
  // في كل collection، ضيف indexes على:
  // - الحقول اللي بتتبحث عليها (search, filter, sort)
  // - Foreign keys (لو فيه relations)
  // - التواريخ (date ranges)

  db.collection('invoices').createIndex({ customerId: 1, createdAt: -1 });
  db.collection('invoices').createIndex({ status: 1 });
  db.collection('products').createIndex({ name: 'text', code: 'text' }); // text search
  ```

- **Pagination:**
  ```javascript
  // لا ترجع كل البيانات
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const data = await Model.find().skip(skip).limit(limit);
  const total = await Model.countDocuments();
  ```

- **Projection:**
  ```javascript
  // لا ترجع كل الـ fields
  const data = await Model.find({}, { name: 1, price: 1, status: 1 });
  ```

- **Connection:**
  - استخدم connection pooling (`maxPoolSize: 10`).
  - لا تفتح connection جديد في كل request.

### 3.2 لو هتنقل لـ PostgreSQL (Recommended)

- **Supabase PostgreSQL** في فرانكفورت (أقرب لمصر/العالم العربي).
- **Prisma ORM** — migration سهل من MongoDB.
- **RLS Policies** — security أحسن.
- **Relations** — foreign keys حقيقية.

**خطوات الـ Migration:**
1. Export MongoDB → JSON.
2. Create Prisma schema.
3. Transform data (MongoDB _id → UUID, flatten nested objects).
4. Import to PostgreSQL.
5. Update API layer (Prisma Client).

---

## 4. إعادة تنظيم المشروع (Folder Structure)

### 4.1 الهيكل المطلوب

```
project/
├── app/                          # Next.js App Router (أو pages/)
│   ├── (auth)/                   # Auth group
│   ├── (dashboard)/              # Dashboard group
│   ├── api/                      # API Routes (if Pages Router)
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── ui/                       # shadcn/ui أو base components
│   ├── shared/                   # Reusable components
│   │   ├── data-table.tsx        # Table مع pagination + sort + filter
│   │   ├── search-input.tsx      # Debounced search
│   │   ├── pagination.tsx        # Pagination component
│   │   ├── stat-card.tsx         # KPI cards
│   │   ├── empty-state.tsx       # Empty states
│   │   └── loading-skeleton.tsx  # Skeletons
│   ├── forms/                    # Form components
│   └── charts/                   # Chart components
│
├── lib/
│   ├── db/                       # Database layer
│   │   ├── connection.ts         # MongoDB connection (or Prisma client)
│   │   ├── models/               # Mongoose models (or Prisma schema)
│   │   └── queries/              # Reusable queries
│   ├── api/                      # API utilities
│   │   ├── client.ts             # API client (axios/fetch wrapper)
│   │   └── endpoints.ts          # API endpoint definitions
│   ├── validation.ts             # Zod schemas
│   ├── constants.ts              # App constants
│   └── utils.ts                  # Helper functions
│
├── hooks/                        # Custom React hooks
│   ├── use-debounce.ts
│   ├── use-pagination.ts
│   ├── use-api.ts                # TanStack Query wrappers
│   └── use-auth.ts
│
├── types/                        # TypeScript types
│   ├── index.ts
│   └── api.ts
│
├── styles/
│   └── globals.css
│
├── public/
│   └── images/
│
├── next.config.js (أو .ts)
├── tailwind.config.js (أو .ts)
├── tsconfig.json
└── package.json
```

### 4.2 قواعد التنظيم

- **لا تضع API calls في Components.** استخدم hooks أو lib/api.
- **لا تضع Business Logic في Components.** استخدم hooks أو lib.
- **لا تضع Database queries في Components.** استخدم lib/db/queries.
- **Component = UI فقط.** Logic = hook أو utility.

---

## 5. تحسين الأداء (Performance Fixes)

### 5.1 API Layer

- **Pagination:** كل list API يرجع `{ data, meta: { page, limit, total, totalPages } }`.
- **Debounced Search:** 300ms delay.
- **Selective Fields:** لا `find()` بدون projection.
- **Caching:**
  - `Cache-Control` headers.
  - `next/cache` (ISR أو `unstable_cache`).
  - React Query (TanStack Query) للـ client-side caching.

### 5.2 Frontend

- **TanStack Query:**
  ```typescript
  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, search],
    queryFn: () => fetchInvoices({ page, search }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  ```

- **Pagination Component:**
  - Server-side pagination (لا تحمل كل البيانات).
  - URL-synced (`?page=2&search=abc`).

- **Debounced Search:**
  ```typescript
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    refetch({ search: debouncedSearch });
  }, [debouncedSearch]);
  ```

- **Code Splitting:**
  ```typescript
  const HeavyChart = dynamic(() => import('@/components/charts/heavy-chart'), {
    ssr: false,
    loading: () => <Skeleton className="h-[300px]" />,
  });
  ```

- **Memoization:**
  ```typescript
  const filteredData = useMemo(() => {
    return data.filter(item => item.status === filter);
  }, [data, filter]);
  ```

- **Image Optimization:**
  - استخدم `next/image` في كل مكان.
  - `loading="lazy"` للـ images تحت fold.
  - `priority` للـ hero images.

### 5.3 Database (MongoDB)

- **Indexes:** على كل حقل بتتبحث أو تتفلتر عليه.
- **Compound Indexes:** للـ queries المتعددة الأعمدة.
- **Text Index:** للـ search.
- **TTL Index:** للـ logs أو data المؤقتة.
- **Aggregation Pipeline:** للـ reports بدل ما تجيب data وتعمل calculations في JS.

---

## 6. State Management Cleanup

### 6.1 لو بتستخدم Redux

- **هل محتاج Redux؟** إذا كان الـ state server-side (من API) → استخدم TanStack Query.
- **Redux يفضل للـ:**
  - Global UI state (sidebar, theme, modal open/close).
  - Complex client-side state (form wizard, multi-step).
- **لا تخزن server state في Redux.**

### 6.2 لو بتستخدم Context

- **Context للـ:** theme, auth user, locale.
- **لا Context للـ:** data fetching, lists, forms.

### 6.3 الهيكل المطلوب

| State Type | التقنية |
|------------|---------|
| **Server State** | TanStack Query |
| **Global UI State** | Zustand (أو Redux Toolkit لو complex) |
| **Local Component State** | useState / useReducer |
| **Form State** | React Hook Form |
| **URL State** | Next.js router query params |

---

## 7. Refactoring Strategy — خطوة بخطوة

### Phase 1: Audit & Plan (لا كود جديد)

1. **اقرأ كل ملف** في المشروع.
2. **اكتب list**:
   - إيه الـ routes؟
   - إيه الـ components؟
   - إيه الـ API endpoints؟
   - إيه الـ database collections؟
3. **حدد المشاكل**:
   - بطء فين؟
   - إيه الـ duplicate code؟
   - إيه الـ unused code؟
4. **خطط الـ Refactor**:
   - إيه يتنقل؟
   - إيه يتعدل؟
   - إيه يتضاف؟

### Phase 2: Database Fixes

1. **Add Indexes** (أعلى تأثير).
2. **Add Pagination** لكل list endpoint.
3. **Add Projection** (select specific fields).
4. **Connection Pooling**.

### Phase 3: API Layer Refactor

1. **افصل API calls** عن Components → lib/api/.
2. **Add pagination** لكل list.
3. **Add debounced search**.
4. **Add caching headers**.
5. **Add error handling** consistent.

### Phase 4: Frontend Refactor

1. **Install TanStack Query** + setup.
2. **Create reusable components:**
   - DataTable (مع pagination + sort + filter).
   - SearchInput (debounced).
   - Pagination.
   - StatCard.
   - EmptyState.
   - LoadingSkeleton.
3. **Refactor pages:**
   - استخدم reusable components.
   - افصل logic عن UI (custom hooks).
   - Code splitting للـ heavy components.
4. **Add memoization** حيث مناسب.

### Phase 5: State Management Cleanup

1. **Migrate server state** إلى TanStack Query.
2. **Simplify global state** (Zustand بدل Redux لو ممكن).
3. **Use React Hook Form** للـ forms.

### Phase 6: Polish

1. **Image optimization** (next/image).
2. **Font optimization** (next/font).
3. **Bundle analysis** (`@next/bundle-analyzer`).
4. **Lighthouse audit**.
5. **Vercel Analytics**.

---

## 8. قواعد الـ Code Quality

### 8.1 Naming

- **Functions:** verbs (fetchInvoices, calculateTotal, handleSubmit).
- **Variables:** nouns (invoiceList, isLoading, searchQuery).
- **Booleans:** is/has/can (isPaid, hasItems, canDelete).
- **Files:** PascalCase للـ components, camelCase للـ utilities.

### 8.2 Functions

- ≤ 20 سطر.
- ≤ 3 parameters (لو أكثر → object).
- Single responsibility.
- Return early (تجنب nesting العميق).

### 8.3 Comments

- لا comments لشرح كود سيئ.
- Comments للـ "why" فقط.
- Descriptive names بدل comments.

### 8.4 No Magic Numbers/Strings

```typescript
// Bad
if (status === 2) { ... }

// Good
const STATUS_ACTIVE = 2;
if (status === STATUS_ACTIVE) { ... }
```

---

## 9. Checklist قبل أي Refactor

### قبل ما تبدأ:

- [ ] فهمت المشروع كامل؟
- [ ] حددت المشاكل بالأرقام؟ (Lighthouse score, API response time)
- [ ] عملت backup من الكود الحالي؟
- [ ] خططت الـ phases؟

### أثناء الـ Refactor:

- [ ] كل feature قديم بيشتغل؟
- [ ] لا hard delete لأي feature؟
- [ ] Tests بتشتغل؟ (لو موجودة)
- [ ] Performance تحسن؟

### بعد الـ Refactor:

- [ ] Lighthouse score ≥ 90؟
- [ ] API response time < 500ms؟
- [ ] No console errors؟
- [ ] No unused code؟
- [ ] Bundle size مقبول؟

---

## 10. الخلاصة

> «لا تبني من جديد. أعد تنظيم ما هو موجود. حافظ على المنطق، حسّن الأداء.»

### الأولويات:

1. **Database indexes** — أعلى تأثير.
2. **Pagination** — لا تحمل كل البيانات.
3. **Debounced search** — أقل requests.
4. **TanStack Query** — Caching + Background refetch.
5. **Code splitting** — أقل JS في initial load.
6. **Reusable components** — أقل duplicate.
7. **State cleanup** — أقل re-renders.
8. **Image optimization** — أسرع load.

### لا تنسى:

- **لا تخسر أي Feature.**
- **لا over-engineering.**
- **Audit first, refactor second.**
- **Measure before and after.**
