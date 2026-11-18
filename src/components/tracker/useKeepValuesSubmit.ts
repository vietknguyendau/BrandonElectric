"use client";

import { startTransition, type FormEvent } from "react";

/**
 * React resets a <form action={fn}> after every submit, which would wipe what
 * staff typed whenever validation fails. Dispatching the action ourselves keeps
 * the values in place.
 */
export function keepValuesOnSubmit(dispatch: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
}
