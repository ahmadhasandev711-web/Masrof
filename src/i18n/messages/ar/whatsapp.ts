const whatsapp = {
 whatsapp: {
 recurringReminder: {
 title: "تذكير من منصة سندات ",
 workspace: "مساحة: {name}",
 expense: "مصروف: {description}",
 amount: "المبلغ: {amount}",
 dueDate: "الاستحقاق: {date}",
 },
 receivableReminder: {
 greeting: "مرحباً {name}،",
 body: "تذكير بمستحقات مشروع «{project}» ({workspace}).",
 remaining: "المتبقي: {amount}",
 dueDate: "تاريخ الاستحقاق: {date}",
 thanks: "شكراً لتعاونكم.",
 },
 invoiceShare: {
 greeting: "مرحباً {name}،",
 body: "مرفق فاتورة رقم «{invoice}» من {workspace}.",
 amount: "المبلغ المستحق: {amount}",
 dueDate: "تاريخ الاستحقاق: {date}",
 viewLink: "رابط الفاتورة المباشر:\n{url}",
 thanks: "شكراً لتعاملكم معنا.",
 },
 },
} as const;

export default whatsapp;
