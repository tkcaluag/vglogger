"use client";

import { useActionState } from "react";
import { saveGameLog } from "./actions";

const STATUSES = [
  { value: "played", label: "Played" },
  { value: "playing", label: "Playing" },
  { value: "backlog", label: "Backlog" },
  { value: "wishlist", label: "Wishlist" },
] as const;

const RATINGS = Array.from({ length: 10 }, (_, index) => (index + 1) / 2);

type LogGameFormProps = {
  gameId: string;
  initialStatus?: string;
  initialRating?: string;
  initialReview?: string;
  initialPlayedOn?: string;
};

export default function LogGameForm({
  gameId,
  initialStatus = "played",
  initialRating = "",
  initialReview = "",
  initialPlayedOn = "",
}: LogGameFormProps) {
  const action = saveGameLog.bind(null, gameId);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="log-game-form">
      {state.error || state.success ? (
        <p
          className={state.error ? "auth-message auth-error" : "auth-message"}
          role={state.error ? "alert" : "status"}
        >
          {state.error || state.success}
        </p>
      ) : null}
      <label htmlFor="log-status">Status</label>
      <select id="log-status" name="status" defaultValue={initialStatus} required>
        {STATUSES.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>

      <label htmlFor="log-rating">Rating</label>
      <select id="log-rating" name="rating" defaultValue={initialRating}>
        <option value="">No rating</option>
        {RATINGS.map((rating) => (
          <option key={rating} value={rating.toFixed(1)}>
            {rating.toFixed(1)} / 5
          </option>
        ))}
      </select>

      <label htmlFor="log-review">Review</label>
      <textarea
        id="log-review"
        name="review"
        defaultValue={initialReview}
        maxLength={5000}
        rows={5}
      />

      <label htmlFor="log-played-on">Played on</label>
      <input
        id="log-played-on"
        name="played_on"
        type="date"
        defaultValue={initialPlayedOn}
      />

      <button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save log"}
      </button>
    </form>
  );
}
