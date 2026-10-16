export type Skill = { name: string; usedIn?: readonly string[] };
export type SkillGroup = { name: string; skills: readonly Skill[] };

export const ALL_GROUPS = "All";

// Groups to show for a filter choice. Unknown choices show everything,
// so a bad value can never hide the whole list.
export function filterSkillGroups(groups: readonly SkillGroup[], choice: string): readonly SkillGroup[] {
  if (choice === ALL_GROUPS) return groups;
  const match = groups.filter((g) => g.name === choice);
  return match.length > 0 ? match : groups;
}
