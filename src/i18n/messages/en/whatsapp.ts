const whatsapp = {
  whatsapp: {
    recurringReminder: {
      title: "Reminder from Sanadat 💰",
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
    invoiceShare: {
      greeting: "Hello {name},",
      body: "Here is invoice #{invoice} from {workspace}.",
      amount: "Amount due: {amount}",
      dueDate: "Due date: {date}",
      viewLink: "View invoice online:\n{url}",
      thanks: "Thank you for your business.",
    },
  },
} as const;

export default whatsapp;
