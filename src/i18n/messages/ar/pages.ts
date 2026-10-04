const pages = {
  pages: {
    onboarding: {
      title: "خلينا نجهز مساحتك الأولى",
      subtitle:
        "أنشئ مساحة للعمل أو للحساب الشخصي — بعدها هتقدر تضيف حسابات، تسجّل عمليات، وتطلع فواتير للعملاء.",
    },
    error: {
      title: "حصل خطأ غير متوقع",
      home: "الرئيسية",
    },
    accounts: {
      title: "الحسابات",
      totalBalance: "إجمالي الرصيد",
    },
    transactions: {
      title: "العمليات",
      viewerReadOnly: "صلاحيتك قراءة فقط في هذه المساحة — لا يمكنك إضافة أو تعديل المعاملات.",
    },
    budgets: {
      title: "الميزانيات والمصاريف المتكررة",
    },
    categories: {
      title: "التصنيفات",
    },
    clients: {
      title: "العملاء",
    },
    projects: {
      title: "المشاريع",
      details: "تفاصيل المشروع",
      expected: "القيمة المتوقعة",
      invoiced: "المفوتر",
      collected: "المحصّل",
      costs: "التكاليف والمصروفات",
      netProfit: "صافي الربح",
      profitMargin: "هامش الربح",
      margin: "هامش",
      overBudgetWarning: "تجاوز الميزانية!",
      financialSummary: "الملخص المالي للمشروع",
      collectionProgress: "نسبة التحصيل",
      budgetConsumption: "استهلاك الميزانية",
      invoicesSection: "فواتير المشروع",
      expensesSection: "تكاليف ومصروفات المشروع",
      createInvoice: "إصدار فاتورة",
      recordExpense: "تسجيل مصروف",
      noInvoices: "لا توجد فواتير مرتبطة بهذا المشروع حتى الآن.",
      noExpenses: "لا توجد مصروفات أو تكاليف مسجلة لهذا المشروع.",
      backToProjects: "العودة للمشاريع",
      viewDetails: "تفاصيل المشروع",
    },
    reports: {
      title: "التقارير",
      advanced: "تقارير متقدمة",
      upgradeExport: "رقّي للتصدير",
      backToReports: "← التقارير",
    },
    advancedReports: {
      title: "تقارير متقدمة",
    },
    plan: {
      title: "خطتي",
      subtitle: "اشتراكك الحالي وميزاتك",
    },
    backup: {
      title: "نسخ احتياطي",
    },
    import: {
      title: "استيراد كشف بنك",
    },
    goals: {
      title: "أهداف الادخار",
    },
    invoices: {
      title: "فواتير العملاء",
    },
    debts: {
      title: "الديون والالتزامات",
      subtitle: "تتبع الأقساط والقروض وسدادها",
    },
    settings: {
      title: "إعدادات المساحة",
      ownerOnly: "تعديل هوية الفواتير متاح لمالك المساحة فقط.",
      newWorkspaceBtn: "+ مساحة عمل جديدة",
    },
    newWorkspace: {
      title: "مساحة عمل جديدة",
      subtitle: "كل مساحة لها حساباتها وتصنيفاتها وميزانياتها المنفصلة",
      back: "← رجوع",
      freeNotice: "تبدأ كل مساحة جديدة بالباقة المجانية (Free) ولها حساباتها المستقلة تماماً. يمكنك ترقية أي مساحة إلى Pro بشكل منفصل في أي وقت.",
      maxLimitReached: "لقد وصلت إلى الحد الأقصى لمساحات العمل المسموح بها في خطتك الحالية. يرجى الترقية إلى باقة برو لإضافة المزيد.",
    },
    print: {
      reportTitle: "سندات — تقرير مالي",
      generatedAt: "تاريخ الإنشاء:",
      expenseBreakdown: "تفصيل المصروفات",
      incomeBreakdown: "تفصيل الدخل",
    },
    blog: {
      notFound: "المقال غير موجود — سندات",
      unavailableEyebrow: "غير متاح بهذه اللغة",
      unavailableTitle: "هذا المقال غير متاح باللغة الحالية",
      unavailableBody: "يمكنك قراءته بـ {locale} أو تصفّح باقي المقالات.",
      allPosts: "كل المقالات ←",
      readingMinutes: "دقائق قراءة",
      readArticle: "اقرأ المقال ←",
      relatedPosts: "مقالات ذات صلة",
    },
  },
} as const;

export default pages;
