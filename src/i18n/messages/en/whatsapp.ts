const whatsapp = {
  whatsapp: {
    recurringReminder: {
      title: "Reminder from Masrofaty 💰",
      workspace: "Workspace: {name}",
      expense: "Expense: {description}",
      amount: "Amount: {amount}",
      dueDate: "Due: {date}",
    },
    receivableReminder: {
      greeting: "Hello {name},",
      body: "Reminder for receivables on project «{project}» ({workspace}).",
      remaining: "Remaining: {amount}",
      dueDate: "Due date: {date}",
      thanks: "Thank you for your cooperation.",
    },
  },
} as const;

export default whatsapp;
