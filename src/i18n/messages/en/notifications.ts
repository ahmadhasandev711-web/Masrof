const notifications = {
  notifications: {
    footer: "Sanadat — <a href=\"{appUrl}\">{appUrl}</a>",
    welcome: {
      greeting: "Hello {name}",
      greetingDefault: "Hello",
      subject: "Welcome to Sanadat",
      body: "Your account is ready. Start managing your invoices and profits here:",
      dashboardLink: "Dashboard",
    },
    newsletter: {
      subject: "You subscribed to the Sanadat newsletter",
      thanks: "Thanks for subscribing to the Sanadat newsletter.",
      promise: "We'll send you practical articles and tips on business finance — no spam.",
    },
    budget: {
      exceededTitle: "Budget exceeded",
      warningTitle: "Approaching budget limit",
      exceededPushTitle: "Budget exceeded",
      warningPushTitle: "Approaching budget limit",
      pushBody: "{name}: {spent} of {limit}",
      inWorkspace: "in workspace «{workspace}».",
      spending: "Spending: {spent} of {limit} ({percentage}%)",
      reviewLink: "Review budgets",
    },
    recurring: {
      subject: "Expense due: {description}",
      pushTitle: "Expense due today",
      dueInWorkspace: "Recurring expense due in «{workspace}».",
      dueDate: "Due: {date}",
      recordLink: "Record expense",
      defaultDescription: "Recurring expense",
    },
    subscription: {
      subject: "{plan} subscription expires in {days} days",
      body: "Your {plan} subscription expires on {expiresAt}.",
      daysLeft: "({days} days left)",
      renewLink: "Contact to renew",
      myPlanLink: "My plan",
    },
  },
} as const;

export default notifications;
