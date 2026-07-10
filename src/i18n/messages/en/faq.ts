const faq = {
  faq: {
    metaTitle: "FAQ — Masrofaty",
    metaDescription: "Answers to common questions about Masrofaty — sign-up, plans, and security.",
    eyebrow: "Help",
    title: "Frequently asked questions",
    contactHint: "Quick answers — if you need more help, contact us",
    items: [
      {
        question: "Is Masrofaty free?",
        answer:
          "Yes — the free plan includes one workspace and full income and expense tracking. Pro and Plus plans offer more workspaces and features for freelancers and businesses.",
      },
      {
        question: "Is my data secure?",
        answer:
          "Your data is stored on MongoDB Atlas with encrypted connections. No one can see your finances except you — each workspace is isolated to your account.",
      },
      {
        question: "Can I track freelance work separately from my personal finances?",
        answer:
          "Absolutely. Create a “Freelance” workspace and a “Personal” workspace — each with its own accounts and categories. On Pro, you can add clients and projects and link income to them.",
      },
      {
        question: "How do I upgrade to Pro or Plus?",
        answer:
          "Upgrades are handled manually for now after you contact us — online payment is coming soon. Reach out from the Support page or via WhatsApp.",
      },
      {
        question: "Is there a mobile app?",
        answer:
          "The site is a PWA — you can install it on your phone from the “Install app” button in the dashboard.",
      },
      {
        question: "Can I export my reports?",
        answer:
          "CSV and PDF export are available on Pro and Plus plans from the Reports page. The free plan includes in-app reports and viewing.",
      },
      {
        question: "Forgot your password?",
        answer: "On the login page, tap “Forgot password” and follow the link in your email.",
      },
      {
        question: "I have a technical issue — what should I do?",
        answer: "Message us on WhatsApp or email from the Support page — we'll respond as soon as we can.",
      },
    ],
  },
} as const;

export default faq;
