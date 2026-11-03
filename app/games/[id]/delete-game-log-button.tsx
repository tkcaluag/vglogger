"use client";

import { useActionState } from "react";
import { deleteGameLog } from "./actions";

export default function DeleteGameLogButton({ gameId }: { gameId: string }) {
  const action = deleteGameLog.bind(null, gameId);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="delete-log-form">
      {state.error || state.success ? (
        <p
          className={state.error ? "auth-message auth-error" : "auth-message"}
          role={state.error ? "alert" : "status"}
        >
          {state.error || state.success}
        </p>
      ) : null}
      <button type="submit" disabled={pending}>
        {pending ? "Deleting..." : "Delete log"}
      </button>
    </form>
  );
}
