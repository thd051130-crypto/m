"use client";
import { useActionState, useState } from "react";
import { saveMood, type FormState } from "@/app/onboarding/actions";
import { ACTIVE_TIMES, CHAT_STYLES, INTERESTS, MAX_INTERESTS, MOODS } from "@/lib/constants";
import { SubmitButton } from "./SubmitButton";

type Initial = { moods: string[]; chat_styles: string[]; interests: string[]; active_times: string[] };

export function MoodForm({ next, initial }: { next: string; initial?: Initial | null }) {
  const [state, action] = useActionState<FormState, FormData>(saveMood, {});
  return (
    <form action={action} className="flex flex-col gap-7 px-4 pb-10">
      <input type="hidden" name="next" value={next} />
      <p className="rounded-[14px] bg-beige px-4 py-3 text-sm text-ink-soft">
        진단이 아니라 비슷한 사람을 찾는 데만 써요. 다른 사람에게는 보이지 않고, 언제든 바꿀 수 있어요.
      </p>
      <ChipGroup title="요즘 마음은 어때요? (여러 개 선택)" name="moods" items={MOODS} initial={initial?.moods} />
      <ChipGroup title="어떤 대화가 편한가요?" name="chat_styles" items={CHAT_STYLES} initial={initial?.chat_styles} />
      <ChipGroup
        title={`관심사 (최대 ${MAX_INTERESTS}개)`}
        name="interests"
        items={INTERESTS}
        initial={initial?.interests}
        max={MAX_INTERESTS}
      />
      <ChipGroup title="주로 활동하는 시간" name="active_times" items={ACTIVE_TIMES} initial={initial?.active_times} />
      {state.error && <p className="error">{state.error}</p>}
      <SubmitButton>{next === "/me" ? "저장하기" : "완료"}</SubmitButton>
    </form>
  );
}

function ChipGroup({
  title,
  name,
  items,
  initial,
  max,
}: {
  title: string;
  name: string;
  items: readonly { key: string; label: string }[];
  initial?: string[];
  max?: number;
}) {
  const [selected, setSelected] = useState<string[]>(initial ?? []);
  const toggle = (key: string) =>
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : max && s.length >= max ? s : [...s, key]));
  return (
    <fieldset>
      <legend className="label">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => {
          const on = selected.includes(i.key);
          return (
            <button
              type="button"
              key={i.key}
              onClick={() => toggle(i.key)}
              aria-pressed={on}
              className={`chip ${on ? "chip-on" : ""}`}
            >
              {i.label}
            </button>
          );
        })}
      </div>
      {selected.map((k) => (
        <input key={k} type="hidden" name={name} value={k} />
      ))}
    </fieldset>
  );
}
