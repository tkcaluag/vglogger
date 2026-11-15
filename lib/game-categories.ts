export const gameCategories = {
  popular: {
    title: "Popular",
    sort: "rating_count desc",
    where: "rating_count > 100",
    homeQuery:
      "fields id, name, cover.url; sort rating_count desc; where rating_count > 100; limit 8;",
  },
  "new-releases": {
    title: "New releases",
    sort: "first_release_date desc",
    where: "first_release_date != null",
    homeQuery:
      "fields id, name, cover.url; sort first_release_date desc; where first_release_date != null; limit 8;",
  },
  "highly-rated": {
    title: "Highly rated",
    sort: "total_rating desc",
    where: "total_rating > 80 & rating_count > 50",
    homeQuery:
      "fields id, name, cover.url; sort total_rating desc; where total_rating > 80 & rating_count > 50; limit 8;",
  },
} as const;

export type GameCategorySlug = keyof typeof gameCategories;

export function isGameCategorySlug(value: string): value is GameCategorySlug {
  return Object.hasOwn(gameCategories, value);
}
