const pages = {
  pages: {
    onboarding: {
      title: "Let's set up your first workspace",
      subtitle:
        "Create a workspace for freelancing or personal money — then add accounts, log transactions, and issue client invoices.",
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
      details: "Project Details",
      expected: "Expected Value",
      invoiced: "Invoiced",
      collected: "Collected",
      costs: "Costs & Expenses",
      netProfit: "Net Profit",
      profitMargin: "Profit Margin",
      margin: "margin",
      overBudgetWarning: "Over Budget!",
      financialSummary: "Project Financial Summary",
      collectionProgress: "Collection Progress",
      budgetConsumption: "Budget Consumption",
      invoicesSection: "Project Invoices",
      expensesSection: "Project Costs & Expenses",
      createInvoice: "New Invoice",
      recordExpense: "Record Expense",
      noInvoices: "No invoices linked to this project yet.",
      noExpenses: "No expenses recorded for this project yet.",
      backToProjects: "Back to Projects",
      viewDetails: "Project Details",
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
    debts: {
      title: "Debts & Liabilities",
      subtitle: "Track and repay loans and installments",
    },
    settings: {
      title: "Workspace settings",
      ownerOnly: "Only the workspace owner can edit invoice branding.",
      newWorkspaceBtn: "+ New workspace",
    },
    newWorkspace: {
      title: "New workspace",
      subtitle: "Each workspace has its own accounts, categories, and budgets",
      back: "← Back",
      freeNotice: "Each new workspace starts on the Free plan with completely isolated accounts. You can upgrade any workspace to Pro independently.",
      maxLimitReached: "You have reached the maximum workspaces allowed by your current plan. Please upgrade to Pro to add more.",
    },
    print: {
      reportTitle: "Sanadat — Financial Report",
      generatedAt: "Generated:",
      expenseBreakdown: "Expense breakdown",
      incomeBreakdown: "Income breakdown",
    },
    blog: {
      notFound: "Post not found — Sanadat",
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
