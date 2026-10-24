const notifications = {
 notifications: {
 footer: "سندات — <a href=\"{appUrl}\">{appUrl}</a>",
 welcome: {
 greeting: "أهلاً {name}",
 greetingDefault: "أهلاً",
 subject: "مرحباً بك في منصة سندات",
 body: "حسابك جاهز. ابدأ بإدارة فواتيرك وأرباحك من هنا:",
 dashboardLink: "لوحة التحكم",
 },
 newsletter: {
 subject: "اشتركت في نشرة سندات",
 thanks: "شكراً لاشتراكك في نشرة سندات البريدية.",
 promise: "سنرسل لك نصائح ورؤى عملية في إدارة الأعمال والمالية — بدون أي إزعاج.",
 },
 budget: {
 exceededTitle: "تجاوزت ميزانية",
 warningTitle: "اقتربت من حد الميزانية",
 exceededPushTitle: "تجاوزت الميزانية",
 warningPushTitle: "اقتربت من حد الميزانية",
 pushBody: "{name}: {spent} من {limit}",
 inWorkspace: "في مساحة «{workspace}».",
 spending: "الإنفاق: {spent} من {limit} ({percentage}%)",
 reviewLink: "راجع الميزانيات",
 },
 recurring: {
 subject: "مصروف مستحق: {description}",
 pushTitle: "مصروف مستحق اليوم",
 dueInWorkspace: "مصروف متكرر مستحق في «{workspace}».",
 dueDate: "الاستحقاق: {date}",
 recordLink: "سجّل المصروف",
 defaultDescription: "مصروف متكرر",
 },
 subscription: {
 subject: "اشتراك {plan} ينتهي خلال {days} يوم",
 body: "اشتراكك في باقة {plan} ينتهي في {expiresAt}.",
 daysLeft: "(باقي {days} يوم)",
 renewLink: "تواصل للتجديد",
 myPlanLink: "خطتي",
 },
 },
} as const;

export default notifications;
