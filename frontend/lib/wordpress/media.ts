import { wpFetch } from "./client";
import { normalizeMedia, type Media, type WPMedia } from "./types";

/** A single media item by its WordPress attachment ID. */
export async function getMedia(id: number): Promise<Media | null> {
  const media = await wpFetch<WPMedia>(`wp/v2/media/${id}`);
  return normalizeMedia(media);
}
