interface Groupable {
  id: number;
  lang: string;
  group_id?: string;
  name?: string;
}

/**
 * Groups items by group_id and picks the best match for the preferred language.
 * If the preferred language row has no name, falls back to Khmer, then English, then any.
 * Attaches _siblings to the picked item.
 */
export function groupByLang<T extends Groupable>(
  items: T[],
  preferredLang: string
): T[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = item.group_id || `nogroup_${item.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  const result: T[] = [];
  for (const [, group] of groups) {
    // Try preferred language, but only if it has a name
    let pick = group.find((g) => g.lang === preferredLang && g.name);
    // Fallback: try Khmer
    if (!pick) pick = group.find((g) => g.lang === "km" && g.name);
    // Fallback: try English
    if (!pick) pick = group.find((g) => g.lang === "en" && g.name);
    // Fallback: any with a name
    if (!pick) pick = group.find((g) => g.name);
    // Last resort: first item
    if (!pick) pick = group[0];
    (pick as Record<string, unknown>)._siblings = group;
    result.push(pick);
  }
  return result;
}
