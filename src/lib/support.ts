import "server-only";

/** Support & social links — optional env vars with sensible fallbacks. */
export function getSupportConfig(prefillText = "Hi, I have a question about Sanadat") {
  const whatsappRaw = process.env.SUPPORT_WHATSAPP?.replace(/\D/g, "") ?? "";
  const whatsapp = whatsappRaw || "201125030642";

  return {
    email: process.env.SUPPORT_EMAIL ?? "info@sanadat.site",
    whatsapp,
    whatsappDisplay: process.env.SUPPORT_WHATSAPP_DISPLAY ?? "+20 112 503 0642",
    whatsappUrl: `https://wa.me/${whatsapp}?text=${encodeURIComponent(prefillText)}`,
    facebookUrl: process.env.SOCIAL_FACEBOOK_URL ?? "",
    linkedinUrl: process.env.SOCIAL_LINKEDIN_URL ?? "",
  };
}
