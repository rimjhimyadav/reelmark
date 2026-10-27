import { describe, expect, test } from "vitest";
import { getSeason } from "./seasons";

describe("getSeason", () => {
  test("every month has a season", () => {
    for (let month = 0; month < 12; month++) {
      expect(getSeason(new Date(2026, month, 15))).toBeDefined();
    }
  });

  test("october is spooky", () => {
    expect(getSeason(new Date(2026, 9, 27)).label).toBe("Spooky season");
  });
});
