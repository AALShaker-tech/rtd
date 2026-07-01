import { describe, it, expect } from "vitest";
import { buildEntry, serializeError } from "@/lib/logger";

const TIME = "2026-07-01T12:00:00.000Z";

describe("serializeError", () => {
  it("captures name/message/stack for an Error", () => {
    const out = serializeError(new Error("boom"));
    expect(out).toMatchObject({ name: "Error", message: "boom" });
    expect(typeof out?.stack).toBe("string");
  });

  it("stringifies a non-Error value", () => {
    expect(serializeError("nope")).toEqual({ message: "nope" });
  });

  it("returns undefined for null/undefined", () => {
    expect(serializeError(null)).toBeUndefined();
    expect(serializeError(undefined)).toBeUndefined();
  });
});

describe("buildEntry", () => {
  it("builds a base entry with level, msg and time", () => {
    expect(buildEntry("info", "hello", undefined, TIME)).toEqual({
      level: "info",
      msg: "hello",
      time: TIME,
    });
  });

  it("keeps non-error fields under `fields`", () => {
    const entry = buildEntry("info", "created", { reference: "RTD-2026-1", count: 3 }, TIME);
    expect(entry.fields).toEqual({ reference: "RTD-2026-1", count: 3 });
    expect(entry.err).toBeUndefined();
  });

  it("splits a reserved `err` field into serialized `err`", () => {
    const entry = buildEntry("error", "failed", { err: new Error("x"), requestId: "r1" }, TIME);
    expect(entry.err).toMatchObject({ name: "Error", message: "x" });
    expect(entry.fields).toEqual({ requestId: "r1" });
  });

  it("omits `fields` when only an error was provided", () => {
    const entry = buildEntry("error", "failed", { err: new Error("x") }, TIME);
    expect(entry.fields).toBeUndefined();
    expect(entry.err).toBeDefined();
  });
});
