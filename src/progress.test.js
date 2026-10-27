import { describe, expect, test } from "vitest";
import { airedEpisodes, getNextEpisode, getProgress } from "./progress";

// a show with 2 seasons of 3 episodes, where only 2 episodes of season 2 are out
const show = {
  seasons: [
    { number: 1, episodes: 3 },
    { number: 2, episodes: 3 },
  ],
  lastAired: { season: 2, episode: 2 },
  watched: {},
};

describe("airedEpisodes", () => {
  test("stops at the last episode that is out", () => {
    expect(airedEpisodes(show)).toHaveLength(5);
    expect(airedEpisodes(show).at(-1)).toEqual({ season: 2, episode: 2 });
  });

  test("is empty when nothing aired yet", () => {
    expect(airedEpisodes({ ...show, lastAired: null })).toEqual([]);
  });
});

describe("getNextEpisode", () => {
  test("starts at S1 E1", () => {
    expect(getNextEpisode(show)).toEqual({ season: 1, episode: 1 });
  });

  test("goes to the next season after the last episode of a season", () => {
    const watched = { "1-1": "x", "1-2": "x", "1-3": "x" };
    expect(getNextEpisode({ ...show, watched })).toEqual({ season: 2, episode: 1 });
  });

  test("finds an episode you skipped", () => {
    const watched = { "1-1": "x", "1-3": "x" };
    expect(getNextEpisode({ ...show, watched })).toEqual({ season: 1, episode: 2 });
  });

  test("is null when you watched everything that is out", () => {
    const watched = { "1-1": "x", "1-2": "x", "1-3": "x", "2-1": "x", "2-2": "x" };
    expect(getNextEpisode({ ...show, watched })).toBeNull();
  });
});

describe("getProgress", () => {
  test("counts only episodes that are out", () => {
    const watched = { "1-1": "x", "1-2": "x" };
    expect(getProgress({ ...show, watched })).toEqual({ watched: 2, aired: 5, percent: 40 });
  });
});
