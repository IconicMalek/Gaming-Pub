import { describe, expect, it } from "vitest";
import { buildWhatsAppMessage, hasValidWhatsAppBusinessNumber, isValidOrderTransition, isValidRequestTransition, validateImdb } from "./store";

describe("Gaming Pub business rules", () => {
  it("allows only the documented order lifecycle transitions", () => {
    expect(isValidOrderTransition("PENDING_ACCEPTANCE", "ACCEPTED")).toBe(true);
    expect(isValidOrderTransition("ACCEPTED", "PREPARING")).toBe(true);
    expect(isValidOrderTransition("READY", "COMPLETED")).toBe(true);
    expect(isValidOrderTransition("COMPLETED", "PREPARING")).toBe(false);
    expect(isValidOrderTransition("REJECTED", "ACCEPTED")).toBe(false);
  });

  it("keeps request lifecycle separate and blocks invalid jumps", () => {
    expect(isValidRequestTransition("PENDING", "REVIEWING")).toBe(true);
    expect(isValidRequestTransition("REVIEWING", "AVAILABLE")).toBe(true);
    expect(isValidRequestTransition("AVAILABLE", "COMPLETED")).toBe(true);
    expect(isValidRequestTransition("PENDING", "COMPLETED")).toBe(false);
    expect(isValidRequestTransition("COMPLETED", "REVIEWING")).toBe(false);
  });

  it("accepts only user-provided IMDb identifiers in supported formats", () => {
    expect(() => validateImdb("tt1234567", "https://www.imdb.com/title/tt1234567/")).not.toThrow();
    expect(() => validateImdb("1234567")).toThrow();
    expect(() => validateImdb("tt1234567", "https://example.com/title/tt1234567")).toThrow();
    expect(() => validateImdb("tt1234567", "https://www.imdb.com/title/tt7654321/")).toThrow();
  });

  it("generates a communication-only WhatsApp message from server-derived order values", () => {
    const message = buildWhatsAppMessage({
      customerName: "Amina",
      orderId: 42,
      items: [{ productName: "Configured title", quantity: 2, unitPrice: "125.00" }],
      total: "250.00",
      storageRequirement: "OWN_HDD",
    });
    expect(message).toContain("Customer: Amina");
    expect(message).toContain("Order ID: 42");
    expect(message).toContain("Configured title × 2 — 125.00 EGP");
    expect(message).toContain("Total: 250.00 EGP");
    expect(message).toContain("communication only; it does not confirm payment");
  });

  it("validates admin WhatsApp business number configuration", () => {
    expect(hasValidWhatsAppBusinessNumber("+20 100 123 4567")).toBe(true);
    expect(hasValidWhatsAppBusinessNumber("1234567")).toBe(false);
    expect(hasValidWhatsAppBusinessNumber("")).toBe(true);
  });
});
