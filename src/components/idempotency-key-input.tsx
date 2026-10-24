"use client";

type Props = {
  value: string;
};

export function IdempotencyKeyInput({ value }: Props) {
  return <input type="hidden" name="idempotencyKey" value={value} readOnly />;
}
