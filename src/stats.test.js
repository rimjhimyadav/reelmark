import { describe, expect, test } from "vitest";
import { getStreaks, getWatchEvents, hoursPerMonth, splitMinutes, topGenres, totalMinutes, yearSummary } from "./stats";

describe("splitMinutes", () => {
  test("turns minutes into days, hours and minutes", () => {
    expect(splitMinutes(1505)).toEqual({ days: 1, hours: 1, minutes: 5 });
    expect(splitMinutes(59)).toEqual({ days: 0, hours: 0, minutes: 59 });
  });
});

describe("getWatchEvents", () => {
  test("one event per episode and per watched movie", () => {
    const items = [
      { type: "tv", runtime: 30, watched: { "1-1": "2026-10-01T10:00:00", "1-2": "2026-10-02T10:00:00" } },
      { type: "movie", runtime: 100, watchedAt: "2026-10-03T10:00:00" },
      { type: "movie", runtime: 100, watchedAt: null }, // in the library, but not watched yet
    ];
    const events = getWatchEvents(items);
    expect(events).toHaveLength(3);
    expect(totalMinutes(events)).toBe(160);
  });
});

describe("getStreaks", () => {
  const today = new Date("2026-10-27T12:00:00");

  test("counts days in a row up to today", () => {
    const days = { "2026-10-25": 1, "2026-10-26": 2, "2026-10-27": 1, "2026-10-20": 1 };
    expect(getStreaks(days, today)).toEqual({ current: 3, longest: 3 });
  });

  test("not watching anything today yet doesn't break the streak", () => {
    const days = { "2026-10-25": 1, "2026-10-26": 1 };
    expect(getStreaks(days, today).current).toBe(2);
  });

  test("longest streak can be in the past", () => {
    const days = { "2026-09-01": 1, "2026-09-02": 1, "2026-09-03": 1, "2026-09-04": 1, "2026-10-27": 1 };
    expect(getStreaks(days, today)).toEqual({ current: 1, longest: 4 });
  });
});

describe("hoursPerMonth", () => {
  test("puts events in the right month", () => {
    const events = [
      { date: "2026-10-05T10:00:00", minutes: 120 },
      { date: "2026-09-05T10:00:00", minutes: 60 },
    ];
    const months = hoursPerMonth(events, 3, new Date("2026-10-27T12:00:00"));
    expect(months.map((m) => m.hours)).toEqual([0, 1, 2]);
  });
});

describe("topGenres", () => {
  test("most common genre first", () => {
    const items = [{ genres: ["Drama", "Comedy"] }, { genres: ["Drama"] }, { genres: ["Action"] }];
    expect(topGenres(items, 2)).toEqual([
      { name: "Drama", count: 2 },
      { name: "Comedy", count: 1 },
    ]);
  });
});

describe("yearSummary", () => {
  test("only counts the chosen year", () => {
    const show = { id: 1, type: "tv", runtime: 30, rating: 4, genres: ["Drama"], watched: { "1-1": "2026-03-01T10:00:00", "1-2": "2025-03-01T10:00:00" } };
    const movie = { id: 2, type: "movie", runtime: 90, rating: 5, genres: ["Comedy"], watchedAt: "2026-05-01T10:00:00" };
    const summary = yearSummary([show, movie], 2026);

    expect(summary.minutes).toBe(120);
    expect(summary.episodes).toBe(1);
    expect(summary.movies).toBe(1);
    expect(summary.topShow.item).toBe(show);
    expect(summary.favorites[0]).toBe(movie); // you gave it 5 stars
    expect(summary.bestMonth.label).toBe("May");
  });
});
