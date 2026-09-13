import { describe, expect, it } from "vitest";
import { buildWhatsAppMessage, hasValidWhatsAppBusinessNumber, isValidOrderTransition, isValidRequestTransition, sanitizeRichText, validateImdb, validateWhatsAppTemplate } from "./store";

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

  it("includes hardware cart components in the WhatsApp order message", () => {
    const message = buildWhatsAppMessage({
      customerName: "Omar",
      orderId: 73,
      items: [{ productName: "1TB NVMe SSD", quantity: 1, unitPrice: "1850.00" }, { productName: "Gaming Headset", quantity: 2, unitPrice: "900.00" }],
      total: "3650.00",
      storageRequirement: "OWN_HDD",
    });
    expect(message).toContain("1TB NVMe SSD × 1 — 1850.00 EGP");
    expect(message).toContain("Gaming Headset × 2 — 900.00 EGP");
    expect(message).toContain("Total: 3650.00 EGP");
  });

  it("validates admin WhatsApp business number configuration", () => {
    expect(hasValidWhatsAppBusinessNumber("+20 100 123 4567")).toBe(true);
    expect(hasValidWhatsAppBusinessNumber("1234567")).toBe(false);
    expect(hasValidWhatsAppBusinessNumber("")).toBe(true);
  });

  it("renders Arabic WhatsApp messages from a safe customizable template", () => {
    const message = buildWhatsAppMessage({
      customerName: "Amina",
      orderId: 42,
      items: [{ productName: "لعبة", quantity: 1, unitPrice: "125.00" }],
      total: "125.00",
      storageRequirement: "OWN_HDD",
      language: "ar",
      template: "مرحباً {{customerName}}\nرقم {{orderId}}\n{{items}}\n{{total}}\n{{storage}}",
    });
    expect(message).toContain("مرحباً Amina");
    expect(message).toContain("رقم 42");
    expect(message).toContain("125.00 جنيه مصري");
  });

  it("requires all order placeholders in customized templates", () => {
    expect(() => validateWhatsAppTemplate("Hello {{customerName}} only")).toThrow("missing");
    expect(() => validateWhatsAppTemplate("Hello {{customerName}} {{orderId}} {{items}} {{total}} {{storage}}" )).not.toThrow();
  });

  it("keeps rich descriptions formatted while removing executable markup", () => {
    const result = sanitizeRichText('<p><strong>Bold</strong> <a href="https://example.com">link</a></p><script>alert(1)</script>');
    expect(result).toContain("<strong>Bold</strong>");
    expect(result).toContain("https://example.com");
    expect(result).not.toContain("script");
  });
});
