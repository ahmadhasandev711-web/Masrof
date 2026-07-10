const notifications = {
  notifications: {
    footer: "Masrofaty — <a href=\"{appUrl}\">{appUrl}</a>",
    welcome: {
      greeting: "Hello {name}",
      greetingDefault: "Hello",
      subject: "Welcome to Masrofaty",
      body: "Your account is ready. Start tracking your income and expenses here:",
      dashboardLink: "Dashboard",
    },
    newsletter: {
      subject: "You subscribed to the Masrofaty newsletter",
      thanks: "Thanks for subscribing to the Masrofaty newsletter.",
      promise: "We'll send you articles and tips on managing money — no spam.",
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
