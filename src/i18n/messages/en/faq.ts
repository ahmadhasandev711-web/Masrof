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
          "Yes — Free includes one workspace, tracking, and limited invoices/clients with ads. Pro is $5/month: no ads, higher limits, and advanced tools.",
      },
      {
        question: "Is my data secure?",
        answer:
          "Your data is stored on MongoDB Atlas with encrypted connections. No one can see your finances except you — each workspace is isolated to your account.",
      },
      {
        question: "Can I track freelance work separately from my personal finances?",
        answer:
          "Absolutely. Create a “Freelance” workspace and a “Personal” workspace — each with its own accounts and categories. On Pro, you get more workspaces plus unlimited clients and projects.",
      },
      {
        question: "How do I upgrade to Pro?",
        answer:
          "Upgrades are handled manually for now after you contact us — online payment is coming soon. Reach out from the Support page or via WhatsApp.",
      },
      {
        question: "Is there a mobile app?",
        answer:
          "A native mobile app is coming. For now the site works on mobile; you can also use the web dashboard.",
      },
      {
        question: "Can I export my reports?",
        answer:
          "CSV and PDF export are available on Pro from the Reports page. Free includes in-app reports and viewing.",
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
