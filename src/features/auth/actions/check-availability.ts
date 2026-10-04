"use server";

import { mongoDb } from "@/lib/db/mongo-client";
import { normalizePhoneNumber } from "@/lib/phone";

export interface CheckAvailabilityResult {
  emailTaken: boolean;
  phoneTaken: boolean;
}

export async function checkAccountAvailability(input: {
  email?: string;
  phoneNumber?: string;
}): Promise<CheckAvailabilityResult> {
  const result: CheckAvailabilityResult = {
    emailTaken: false,
    phoneTaken: false,
  };

  const collection = mongoDb.collection("user");

  if (input.email) {
    const existingEmail = await collection.findOne({
      email: input.email.trim().toLowerCase(),
    });
    if (existingEmail) {
      result.emailTaken = true;
    }
  }

  if (input.phoneNumber) {
    const normalized = normalizePhoneNumber(input.phoneNumber);
    if (normalized) {
      const existingPhone = await collection.findOne({
        phoneNumber: normalized,
      });
      if (existingPhone) {
        result.phoneTaken = true;
      }
    }
  }

  return result;
}
