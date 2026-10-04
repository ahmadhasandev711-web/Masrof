const legal = {
  legal: {
    privacy: {
      metaTitle: "Privacy Policy — Sanadat",
      title: "Privacy Policy",
      subtitle: "Last updated: July 2026",
      sections: [
        {
          heading: "Data we collect",
          body: "When you sign up, we store your name, email address, and account details. Financial data (invoices, transactions, accounts, budgets) is stored securely and isolated to your workspaces only.",
        },
        {
          heading: "How we use data",
          body: "We use your data strictly to operate and deliver the service — issuing invoices, displaying reports, and managing your account. We never sell or share your data with third parties.",
        },
        {
          heading: "Storage and security",
          body: "Data is secured in encrypted cloud infrastructure with TLS/256-bit encryption. Passwords and credentials are cryptographically hashed and never stored in plain text.",
        },
        {
          heading: "Your rights",
          body: "You can request full export or deletion of your account and records at any time by reaching out to our Support team.",
        },
        {
          heading: "Cookies",
          body: "We use essential cookies to maintain secure authenticated sessions, active workspace context, and language preferences.",
        },
        {
          heading: "Contact",
          body: "For any privacy-related inquiries, please reach out via our Support page.",
        },
      ],
    },
    terms: {
      metaTitle: "Terms of Service — Sanadat",
      title: "Terms of Service",
      subtitle: "Last updated: July 2026",
      sections: [
        {
          heading: "The service",
          body: "Sanadat is an enterprise-grade platform for managing invoices, receivables, and project profitability for agencies, studios, and modern businesses.",
        },
        {
          heading: "Your account",
          body: "You are responsible for keeping your login credentials confidential and ensuring the accuracy of data in your invoices and records.",
        },
        {
          heading: "Paid plans",
          body: "Free and paid plans are described transparently on the Pricing page. Pro plan subscriptions provide enhanced features based on the selected billing interval.",
        },
        {
          heading: "Account suspension",
          body: "We reserve the right to suspend accounts that violate these terms or misuse the platform. You may cancel your subscription at any time.",
        },
        {
          heading: "Limitation of liability",
          body: "Business and financial decisions are solely yours. Sanadat provides management tools and does not provide legal accounting or certified tax advisory.",
        },
        {
          heading: "Changes",
          body: "We may update these terms — continued use after an update means you accept the changes.",
        },
      ],
    },
  },
} as const;

export default legal;
