export type HomepageStep = {
  number: string;
  title: string;
  body: string;
};

export type HomepageContent = {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  stepsTitle: string;
  steps: HomepageStep[];
  blogTitle: string;
  blogSubtitle: string;
  newsletterTitle: string;
  newsletterSubtitle: string;
  finalCtaTitle: string;
  finalCtaSubtitle: string;
  finalCtaButton: string;
  footerNewsletterTitle: string;
  footerNewsletterSubtitle: string;
};

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  heroBadge: "للفريلانسرز والمشاريع الصغيرة في مصر",
  heroTitle: "اعرف فلوسك جايه منين،\nورايحة فين، بالظبط.",
  heroSubtitle:
    "تابع دخلك ومصروفاتك، ودير عملاءك وفواتيرك من مساحة واحدة — عربي، بالجنيه، من غير تعقيد المحاسبة.",
  heroCtaPrimary: "ابدأ مجانًا الآن",
  heroCtaSecondary: "اقرأ في المدونة",
  stepsTitle: "تبدأ في 3 خطوات بس",
  steps: [
    {
      number: "01",
      title: "افتح مساحتك",
      body: "شخصية، فريلانس، أو شركة صغيرة — كل مساحة بحساباتها وتصنيفاتها المستقلة.",
    },
    {
      number: "02",
      title: "سجّل العمليات والعملاء",
      body: "كل دخل ومصروف بيتسجل في ثانية — ومع باقة أعلى تطلع فواتير PDF لعملائك.",
    },
    {
      number: "03",
      title: "شوف الصورة كاملة",
      body: "تقارير واضحة تقولك فلوسك رايحة فين، وميزانيات تنبهك قبل ما تتجاوزها.",
    },
  ],
  blogTitle: "من المدونة",
  blogSubtitle: "نصائح عملية تساعدك تدير فلوسك أحسن",
  newsletterTitle: "خليك على اطلاع",
  newsletterSubtitle: "اشترك في النشرة واستلم مقالات عن إدارة الفلوس والفريلانس — من غير سبام.",
  finalCtaTitle: "مستعد تعرف وضعك المالي الحقيقي؟",
  finalCtaSubtitle: "التسجيل مجاني، وأول مساحة جاهزة في أقل من دقيقتين.",
  finalCtaButton: "إنشاء حساب مجاني",
  footerNewsletterTitle: "نشرة سندات",
  footerNewsletterSubtitle: "مقالات عملية عن الفلوس والفريلانس — مرة كل أسبوعين تقريباً.",
};

export function mergeHomepageContent(
  stored: Partial<HomepageContent> | null | undefined,
): HomepageContent {
  if (!stored) return DEFAULT_HOMEPAGE_CONTENT;

  return {
    ...DEFAULT_HOMEPAGE_CONTENT,
    ...stored,
    steps:
      stored.steps && stored.steps.length === 3
        ? stored.steps
        : DEFAULT_HOMEPAGE_CONTENT.steps,
  };
}
