import { describe, it, expect } from "vitest";
import { countUnread } from "@/lib/notifications";

const items = [
  { createdAt: "2026-07-02T10:00:00.000Z" },
  { createdAt: "2026-07-02T09:00:00.000Z" },
  { createdAt: "2026-07-02T08:00:00.000Z" },
];

describe("countUnread", () => {
  it("counts everything when there is no last-seen timestamp", () => {
    expect(countUnread(items, null)).toBe(3);
  });

  it("counts only items strictly newer than last-seen", () => {
    expect(countUnread(items, "2026-07-02T09:00:00.000Z")).toBe(1);
  });

  it("is zero when last-seen is at/after the newest item", () => {
    expect(countUnread(items, "2026-07-02T10:00:00.000Z")).toBe(0);
    expect(countUnread(items, "2026-07-02T12:00:00.000Z")).toBe(0);
  });

  it("treats an unparseable last-seen as 'never seen'", () => {
    expect(countUnread(items, "not-a-date")).toBe(3);
  });

  it("is zero for an empty list", () => {
    expect(countUnread([], null)).toBe(0);
  });
});
