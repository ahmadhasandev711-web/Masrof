import { describe, it, expect } from "vitest";
import { createRegisterSchema, createLoginSchema } from "./schemas";

const fakeTranslator = (key: string) => `error.${key}`;

describe("auth schemas", () => {
  describe("createRegisterSchema", () => {
    const schema = createRegisterSchema(fakeTranslator as any);

    it("accepts valid registration data with Egyptian phone", () => {
      const res = schema.safeParse({
        name: "أحمد حسن",
        email: "ahmad@example.com",
        phoneNumber: "01012345678",
        password: "Password123",
      });
      expect(res.success).toBe(true);
    });

    it("accepts international phone numbers", () => {
      const res = schema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        phoneNumber: "+966512345678",
        password: "Password123",
      });
      expect(res.success).toBe(true);
    });

    it("rejects invalid phone number", () => {
      const res = schema.safeParse({
        name: "Test",
        email: "test@example.com",
        phoneNumber: "123",
        password: "Password123",
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0]?.message).toBe("error.phoneInvalid");
      }
    });

    it("rejects missing phone number", () => {
      const res = schema.safeParse({
        name: "Test",
        email: "test@example.com",
        phoneNumber: "",
        password: "Password123",
      });
      expect(res.success).toBe(false);
    });

    it("rejects short password", () => {
      const res = schema.safeParse({
        name: "Test",
        email: "test@example.com",
        phoneNumber: "01012345678",
        password: "123",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("createLoginSchema", () => {
    const schema = createLoginSchema(fakeTranslator as any);

    it("accepts email identifier", () => {
      const res = schema.safeParse({
        identifier: "test@example.com",
        password: "Password123",
      });
      expect(res.success).toBe(true);
    });

    it("accepts phone number identifier", () => {
      const res = schema.safeParse({
        identifier: "01012345678",
        password: "Password123",
      });
      expect(res.success).toBe(true);
    });

    it("accepts international phone number identifier", () => {
      const res = schema.safeParse({
        identifier: "+966512345678",
        password: "Password123",
      });
      expect(res.success).toBe(true);
    });

    it("rejects invalid identifier", () => {
      const res = schema.safeParse({
        identifier: "invalid-string",
        password: "Password123",
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0]?.message).toBe("error.identifierInvalid");
      }
    });
  });
});
