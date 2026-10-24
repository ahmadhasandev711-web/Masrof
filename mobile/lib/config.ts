const rawUrl = process.env.EXPO_PUBLIC_API_URL ?? "https://sanadat.site";
export const API_URL = rawUrl.replace(/\/+$/, "");
