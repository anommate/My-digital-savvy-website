import { wpFetchList } from "./client";
import { normalizeMedia, type TeamMember, type WPTeamMember } from "./types";

function normalizeTeamMember(member: WPTeamMember): TeamMember {
  return {
    id: member.id,
    slug: member.slug,
    name: member.title.rendered,
    role: member.acf?.role ?? null,
    bio: member.acf?.bio ?? null,
    photo: normalizeMedia(member._embedded?.["wp:featuredmedia"]?.[0]),
  };
}

/**
 * Real team members only (per the brief: "only when real team information
 * exists"). Returns [] until the team_member post type is populated —
 * never substitute stock photography or invented names.
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  const members = await wpFetchList<WPTeamMember>("wp/v2/team_member", {
    searchParams: { _embed: true, per_page: 50 },
  });
  return members.map(normalizeTeamMember);
}
