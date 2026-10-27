export function getIgdbCoverImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const secureUrl = url.startsWith("//") ? `https:${url}` : url;
  return secureUrl.replace("/t_thumb/", "/t_cover_big_2x/");
}