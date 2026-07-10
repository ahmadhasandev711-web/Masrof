import "server-only";

/** Support & social links — optional env vars with sensible fallbacks. */
export function getSupportConfig(prefillText = "Hi, I have a question about Masrofaty") {
  const whatsappRaw = process.env.SUPPORT_WHATSAPP?.replace(/\D/g, "") ?? "";
  const whatsapp = whatsappRaw || "201000000000";

  return {
    email: process.env.SUPPORT_EMAIL ?? "support@masrofaty.app",
    whatsapp,
    whatsappDisplay: process.env.SUPPORT_WHATSAPP_DISPLAY ?? "+20 100 000 0000",
    whatsappUrl: `https://wa.me/${whatsapp}?text=${encodeURIComponent(prefillText)}`,
    facebookUrl: process.env.SOCIAL_FACEBOOK_URL ?? "",
    linkedinUrl: process.env.SOCIAL_LINKEDIN_URL ?? "",
  };
}
