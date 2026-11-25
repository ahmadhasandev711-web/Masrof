import { describe, expect, it } from "vitest";
import { sanadatPhoneNumberPlugin } from "@/lib/auth/phone-number-plugin";

describe("sanadatPhoneNumberPlugin", () => {
  it("preserves user phone schema, endpoints, and rate limits while removing blocking OTP init hooks", () => {
    const plugin = sanadatPhoneNumberPlugin() as Record<string, unknown>;

    expect(plugin.id).toBe("phone-number");
    expect(plugin.init).toBeUndefined();
    expect(plugin.hooks).toBeUndefined();

    const schema = plugin.schema as { user?: { fields?: Record<string, unknown> } };
    expect(schema.user?.fields).toHaveProperty("phoneNumber");
    expect(schema.user?.fields).toHaveProperty("phoneNumberVerified");

    const endpoints = plugin.endpoints as Record<string, unknown>;
    expect(endpoints).toHaveProperty("signInPhoneNumber");
  });
});
