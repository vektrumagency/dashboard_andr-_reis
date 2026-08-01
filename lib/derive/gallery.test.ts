import { describe, expect, it, vi } from "vitest";
import { imageUrlExpiry } from "./gallery";

describe("imageUrlExpiry", () => {
  it("identifies an expired Idealista signature", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-01T12:00:00Z"));
    expect(
      imageUrlExpiry("https://img4.idealista.pt/s/v1/photo.jpg?Expires=1785500000&Signature=x"),
    ).toMatchObject({ expired: true });
    vi.useRealTimers();
  });

  it("treats durable Blob URLs as non-expiring", () => {
    expect(
      imageUrlExpiry("https://store.public.blob.vercel-storage.com/idealista/1/photo.jpg"),
    ).toEqual({ expired: false, expiresAt: null });
  });
});
