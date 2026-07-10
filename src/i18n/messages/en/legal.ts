const legal = {
  legal: {
    privacy: {
      metaTitle: "Privacy policy — Masrofaty",
      title: "Privacy policy",
      subtitle: "Last updated: July 2026",
      sections: [
        {
          heading: "Data we collect",
          body: "When you sign up, we store your name, email address, and account details. Financial data (transactions, accounts, budgets) is stored linked to your workspaces.",
        },
        {
          heading: "How we use data",
          body: "We use your data only to operate the service — showing your reports, saving your transactions, and managing your subscription. We do not sell your data to third parties.",
        },
        {
          heading: "Storage and security",
          body: "Data is hosted on MongoDB Atlas with encrypted connections (TLS). Passwords are hashed via better-auth and are not stored in plain text.",
        },
        {
          heading: "Your rights",
          body: "You can request deletion of your account and data by contacting us from the Support page. After deletion, we remove your data from our systems as soon as practicable.",
        },
        {
          heading: "Cookies",
          body: "We use cookies for session management (sign-in), active workspace, and UI language. On the blog and public marketing pages we may show Google AdSense ads — Google may use cookies to personalize ads per Google's privacy policy.",
        },
        {
          heading: "Contact",
          body: "For any privacy questions, contact us from the Support page.",
        },
      ],
    },
    terms: {
      metaTitle: "Terms of use — Masrofaty",
      title: "Terms of use",
      subtitle: "Last updated: July 2026",
      sections: [
        {
          heading: "The service",
          body: "Masrofaty is a tool for managing personal and professional income and expenses. The service is provided “as is” — we improve it continuously but do not provide financial or tax advice.",
        },
        {
          heading: "Your account",
          body: "You are responsible for keeping your password secure and for the accuracy of the data you enter. Using the service for illegal purposes is prohibited.",
        },
        {
          heading: "Paid plans",
          body: "Free and paid plans are described on the Pricing page. Annual subscriptions (Pro / Plus) renew according to the terms agreed at payment. Online payment will be enabled later through an approved payment gateway.",
        },
        {
          heading: "Account suspension",
          body: "We reserve the right to suspend accounts that violate these terms or misuse the platform. You can cancel your account by contacting us.",
        },
        {
          heading: "Limitation of liability",
          body: "Financial decisions are yours. Masrofaty is a tracking tool — we do not guarantee profits or tax accuracy. Consult your accountant for important decisions.",
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
