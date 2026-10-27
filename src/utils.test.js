import { describe, expect, test } from "vitest";
import { countdown } from "./utils";

describe("countdown", () => {
  const today = "2026-10-27";

  test("says today and tomorrow", () => {
    expect(countdown("2026-10-27", today)).toBe("Today");
    expect(countdown("2026-10-28", today)).toBe("Tomorrow");
  });

  test("counts days for the next two weeks", () => {
    expect(countdown("2026-11-01", today)).toBe("In 5 days");
    expect(countdown("2026-11-10", today)).toBe("In 14 days");
  });

  test("shows the date when it's further away", () => {
    expect(countdown("2026-12-17", today)).toBe("17 Dec");
  });

  test("works across the end of the month", () => {
    expect(countdown("2026-11-02", "2026-10-31")).toBe("In 2 days");
  });
});
