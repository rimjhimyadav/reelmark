// the "this month" row on explore changes with the time of year
// months start at 0, so 0 = january and 11 = december
// genre ids are from TMDB: 18 drama, 27 horror, 53 thriller, 10749 romance, 28 action, 12 adventure, 35 comedy, 10751 family
// a comma means "all of these genres", a | means "any of them"
const SEASONS = [
  {
    months: [0, 2],
    title: "Big dramas everyone talks about",
    note: "Catch up before the Oscars.",
    params: { with_genres: "18", sort_by: "vote_average.desc", "vote_count.gte": 3000 },
  },
  {
    months: [1],
    title: "Love stories worth watching",
    note: "For date night, or a night in.",
    params: { with_genres: "10749", sort_by: "popularity.desc" },
  },
  {
    months: [3, 4, 5],
    title: "Big summer blockbusters",
    note: "Loud, fun and made for a big screen.",
    params: { with_genres: "28|12", sort_by: "popularity.desc" },
  },
  {
    months: [6, 7, 8],
    title: "Rainy day comfort movies",
    note: "Chai, a blanket and one of these.",
    params: { with_genres: "35|10751", sort_by: "vote_average.desc", "vote_count.gte": 2000 },
  },
  {
    months: [9],
    title: "Watch with the lights off",
    note: "Horror and thrillers for October.",
    params: { with_genres: "27|53", sort_by: "popularity.desc" },
  },
  {
    months: [10, 11],
    title: "Cozy movies for the holidays",
    note: "Christmas classics and new ones.",
    params: { with_keywords: "207317", sort_by: "popularity.desc", "vote_count.gte": 200 }, // 207317 = "christmas"
  },
];

export function getSeason(date = new Date()) {
  const month = date.getMonth();
  return SEASONS.find((season) => season.months.includes(month));
}
