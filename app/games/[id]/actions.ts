"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { queryIgdb } from "@/lib/igdb";
import { getIgdbCoverImageUrl } from "@/lib/igdb-image";

const LOG_STATUSES = ["played", "playing", "backlog", "wishlist"] as const;
const MAX_REVIEW_LENGTH = 5000;

type GameForLog = {
  id: number;
  name: string;
  cover?: { url?: string | null } | null;
};

function getStringField(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  return typeof value === "string" ? value : null;
}

function parseRating(value: string): number | null | undefined {
  if (!value) return null;

  const rating = Number(value);
  if (
    !Number.isFinite(rating) ||
    rating < 0.5 ||
    rating > 5 ||
    !Number.isInteger(rating * 2)
  ) {
    return undefined;
  }

  return rating;
}

function isValidPlayedOn(value: string): boolean {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function saveGameLog(
  gameId: string,
  _previousState: { error?: string; success?: string },
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError && authError.name !== "AuthSessionMissingError") throw authError;
  if (!user) return { error: "Log in to save this game to your library." };

  if (!/^\d+$/.test(gameId) || !Number.isSafeInteger(Number(gameId))) {
    return { error: "This game has an invalid ID." };
  }

  const status = getStringField(formData, "status");
  const ratingInput = getStringField(formData, "rating");
  const reviewInput = getStringField(formData, "review");
  const playedOnInput = getStringField(formData, "played_on");

  if (!status || !LOG_STATUSES.includes(status as (typeof LOG_STATUSES)[number])) {
    return { error: "Choose a valid status." };
  }
  if (ratingInput === null || reviewInput === null || playedOnInput === null) {
    return { error: "Submit valid values for every field." };
  }

  const rating = parseRating(ratingInput);
  if (rating === undefined) {
    return { error: "Choose a rating from 0.5 to 5 in half-star steps." };
  }

  const review = reviewInput.trim();
  if (review.length > MAX_REVIEW_LENGTH) {
    return { error: `Reviews must be ${MAX_REVIEW_LENGTH} characters or fewer.` };
  }
  if (!isValidPlayedOn(playedOnInput)) {
    return { error: "Enter a valid played-on date." };
  }

  const igdbId = Number(gameId);
  const games = await queryIgdb<GameForLog>(
    "games",
    `where id = ${igdbId}; fields id, name, cover.url; limit 1;`,
  );
  const game = games[0];
  if (!game || game.id !== igdbId || !game.name) {
    return { error: "This game could not be found in IGDB." };
  }

  const { error: gameError } = await supabase.from("games").upsert(
    {
      igdb_id: game.id,
      name: game.name,
      cover_url: getIgdbCoverImageUrl(game.cover?.url),
    },
    { onConflict: "igdb_id", ignoreDuplicates: true },
  );
  if (gameError) throw gameError;

  const { error: logError } = await supabase.from("logs").upsert(
    {
      user_id: user.id,
      game_id: game.id,
      status,
      rating,
      review: review || null,
      played_on: playedOnInput || null,
    },
    { onConflict: "user_id,game_id" },
  );
  if (logError) throw logError;

  revalidatePath(`/games/${igdbId}`);
  return { success: "Your game log has been saved." };
}
