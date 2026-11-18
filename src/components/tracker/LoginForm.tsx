"use client";

import { keepValuesOnSubmit } from "./useKeepValuesSubmit";
import { useActionState } from "react";
import { signInAction } from "@/app/tracker/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, null);
  return (
    <form onSubmit={keepValuesOnSubmit(action)} className="mt-6 space-y-4">
      <div aria-live="assertive">
        {state?.message ? (
          <p className="rounded-md border-2 border-danger bg-[#fdf0f0] px-3 py-2 font-semibold text-danger">
            {state.message}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="email" className="block font-semibold">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field mt-1" />
      </div>
      <div>
        <label htmlFor="password" className="block font-semibold">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field mt-1"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-burgundy px-4 py-3 font-bold text-cream hover:bg-burgundy-700 disabled:opacity-70"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
