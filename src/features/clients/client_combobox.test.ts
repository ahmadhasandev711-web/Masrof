import { describe, expect, it } from "vitest";

type ComboboxClientItem = {
  _id: string;
  name: string;
  phone?: string | null;
};

// Filter logic extracted from ClientCombobox for pure algorithmic unit testing
function filterClients(clients: ComboboxClientItem[], query: string): ComboboxClientItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return clients;

  const queryDigits = q.replace(/\D/g, "");

  return clients.filter((client) => {
    const matchName = client.name.toLowerCase().includes(q);
    const phoneDigits = (client.phone || "").replace(/\D/g, "");
    const matchPhone =
      Boolean(client.phone && client.phone.toLowerCase().includes(q)) ||
      Boolean(queryDigits && phoneDigits.includes(queryDigits));
    return matchName || matchPhone;
  });
}

describe("ClientCombobox Search & Filter Logic", () => {
  const mockClients: ComboboxClientItem[] = [
    { _id: "c-1", name: "شركة النور للمقاولات", phone: "01012345678" },
    { _id: "c-2", name: "أحمد حسن", phone: "+201123456789" },
    { _id: "c-3", name: "Tech Solutions LLC", phone: "01298765432" },
    { _id: "c-4", name: "شركة الأمل", phone: null },
    { _id: "c-5", name: "Nour Al-Hoda", phone: "01099998888" },
  ];

  it("returns all clients when query is empty or whitespace", () => {
    expect(filterClients(mockClients, "")).toHaveLength(5);
    expect(filterClients(mockClients, "   ")).toHaveLength(5);
  });

  it("filters clients by Arabic name (partial match)", () => {
    const results = filterClients(mockClients, "النور");
    expect(results).toHaveLength(1);
    expect(results[0]._id).toBe("c-1");
  });

  it("filters clients by English name (case-insensitive)", () => {
    const results = filterClients(mockClients, "tech");
    expect(results).toHaveLength(1);
    expect(results[0]._id).toBe("c-3");
  });

  it("filters clients by phone number (exact match)", () => {
    const results = filterClients(mockClients, "01012345678");
    expect(results).toHaveLength(1);
    expect(results[0]._id).toBe("c-1");
  });

  it("filters clients by phone digits even with formatting (+20)", () => {
    const results = filterClients(mockClients, "1123456789");
    expect(results).toHaveLength(1);
    expect(results[0]._id).toBe("c-2");
  });

  it("matches by either name or phone correctly (e.g. 010 matches c-1 and c-5)", () => {
    const results = filterClients(mockClients, "010");
    expect(results).toHaveLength(2);
    expect(results.map((r) => r._id)).toEqual(["c-1", "c-5"]);
  });

  it("handles clients with null or missing phone without errors", () => {
    const results = filterClients(mockClients, "الأمل");
    expect(results).toHaveLength(1);
    expect(results[0]._id).toBe("c-4");
  });

  it("returns empty array when query matches neither name nor phone", () => {
    const results = filterClients(mockClients, "غير موجود 999999");
    expect(results).toHaveLength(0);
  });
});
