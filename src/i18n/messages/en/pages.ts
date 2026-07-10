const pages = {
  pages: {
    onboarding: {
      title: "Let's set up your first workspace",
      subtitle: "Everything you track (accounts, categories, budgets) lives inside this workspace",
    },
    error: {
      title: "An unexpected error occurred",
      home: "Home",
    },
    accounts: {
      title: "Accounts",
      totalBalance: "Total balance",
    },
    transactions: {
      title: "Transactions",
      viewerReadOnly: "You have view-only access in this workspace — you cannot add or edit transactions.",
    },
    budgets: {
      title: "Budgets & recurring expenses",
    },
    categories: {
      title: "Categories",
    },
    clients: {
      title: "Clients",
    },
    projects: {
      title: "Projects",
    },
    reports: {
      title: "Reports",
      advanced: "Advanced reports",
      upgradeExport: "Upgrade to export",
      backToReports: "← Reports",
    },
    advancedReports: {
      title: "Advanced reports",
    },
    plan: {
      title: "My plan",
      subtitle: "Your subscription and features",
    },
    backup: {
      title: "Backup",
    },
    import: {
      title: "Bank statement import",
    },
    goals: {
      title: "Savings goals",
    },
    invoices: {
      title: "Client invoices",
    },
    newWorkspace: {
      title: "New workspace",
      subtitle: "Each workspace has its own accounts, categories, and budgets",
      back: "← Back",
    },
    print: {
      reportTitle: "Masrofaty — financial report",
      generatedAt: "Generated:",
      expenseBreakdown: "Expense breakdown",
      incomeBreakdown: "Income breakdown",
    },
    blog: {
      notFound: "Post not found — Masrofaty",
      unavailableEyebrow: "Not available in this language",
      unavailableTitle: "This article isn't available in your current language",
      unavailableBody: "You can read it in {locale} or browse other articles.",
      allPosts: "All posts ←",
      readingMinutes: "min read",
      readArticle: "Read article ←",
      relatedPosts: "Related posts",
    },
  },
} as const;

export default pages;
