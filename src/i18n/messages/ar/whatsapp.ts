const whatsapp = {
  whatsapp: {
    recurringReminder: {
      title: "تذكير من مصروفاتي 💰",
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
  },
} as const;

export default whatsapp;
