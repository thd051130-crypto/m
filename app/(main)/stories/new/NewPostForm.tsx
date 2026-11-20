"use client";
import { useActionState, useState } from "react";
import { createPost, type ActionState } from "../actions";
import { CATEGORIES, POST_MAX, POST_MIN } from "@/lib/constants";
import { SubmitButton } from "@/components/SubmitButton";

export function NewPostForm({ defaultCategory, prompt }: { defaultCategory: string; prompt: string | null }) {
  const [state, action] = useActionState<ActionState, FormData>(createPost, {});
  const [category, setCategory] = useState(defaultCategory);
  const [body, setBody] = useState(prompt ? `Q. ${prompt}\n\n` : "");
  return (
    <form action={action} className="flex flex-col gap-5 px-4 pb-10">
      <input type="hidden" name="category" value={category} />
      <fieldset>
        <legend className="label">카테고리</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.key}
              aria-pressed={category === c.key}
              onClick={() => setCategory(c.key)}
              className={`chip ${category === c.key ? "chip-on" : ""}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <textarea
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          minLength={POST_MIN}
          maxLength={POST_MAX}
          rows={10}
          required
          placeholder="오늘 있었던 일, 요즘 마음… 편하게 적어 주세요."
          className="input resize-none leading-7"
        />
        <p className="mt-1 text-right text-xs text-ink-soft">
          {body.trim().length} / {POST_MAX}
        </p>
      </div>
      {state.error && <p className="error">{state.error}</p>}
      <SubmitButton>올리기</SubmitButton>
    </form>
  );
}
