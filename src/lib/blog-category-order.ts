export type BlogCategoryEntry = [
  string,
  {
    label: string;
    count: number;
  },
];

export function compareBlogCategoryEntries(
  [slugA, categoryA]: BlogCategoryEntry,
  [slugB, categoryB]: BlogCategoryEntry
): number {
  const countDifference = categoryB.count - categoryA.count;
  if (countDifference !== 0) return countDifference;
  if (slugA === slugB) return 0;
  return slugA < slugB ? -1 : 1;
}
