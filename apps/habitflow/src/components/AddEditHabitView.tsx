import { useState, type FormEvent } from "react";
import { Button, Input } from "@unstucklabs/ui";
import type { Habit } from "../lib/types";

interface HabitInput {
  name: string;
  emoji: string;
  action: string;
  time: string;
  place: string;
}

interface Props {
  habit?: Habit; // undefined = adding a new habit
  onSave: (input: HabitInput) => void;
  onArchive?: () => void;
  onBack: () => void;
}

const EMOJI_OPTIONS = ["🧘", "💧", "📖", "💪", "😴", "🏃", "🥗", "📝", "🎨", "🧹", "☀️", "🌙", "🚭", "💊", "🎯", "📵"];

// "Atomic Habits"-style structured phrasing (Action/Time/Place) instead of
// a single freeform text field -- helps the user commit to something
// concrete ("I will meditate for 10 minutes right after waking up in the
// bedroom") rather than a vague intention.
export function AddEditHabitView({ habit, onSave, onArchive, onBack }: Props) {
  const [name, setName] = useState(habit?.name ?? "");
  const [emoji, setEmoji] = useState(habit?.emoji ?? EMOJI_OPTIONS[0]!);
  const [action, setAction] = useState(habit?.action ?? "");
  const [time, setTime] = useState(habit?.time ?? "");
  const [place, setPlace] = useState(habit?.place ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !action.trim()) return;
    onSave({ name: name.trim(), emoji, action: action.trim(), time: time.trim(), place: place.trim() });
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 py-8">
      <button type="button" onClick={onBack} className="cursor-pointer self-start text-sm text-foreground/50 hover:text-foreground">
        ← Back
      </button>
      <h1 className="mt-2 text-2xl font-bold text-foreground">{habit ? "Edit habit" : "New habit"}</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Icon</p>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setEmoji(option)}
                aria-pressed={emoji === option}
                className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border text-xl ${
                  emoji === option ? "border-primary bg-primary/10" : "border-border bg-white"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="habit-name" className="mb-1 block text-sm font-medium text-foreground">
            Habit name
          </label>
          <Input id="habit-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Meditation" required />
        </div>

        <p className="text-sm text-foreground/60">I will...</p>

        <div>
          <label htmlFor="habit-action" className="mb-1 block text-sm font-medium text-foreground">
            Action
          </label>
          <Input
            id="habit-action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="meditate for 10 minutes"
            required
          />
        </div>

        <div>
          <label htmlFor="habit-time" className="mb-1 block text-sm font-medium text-foreground">
            Time <span className="font-normal text-foreground/40">(optional)</span>
          </label>
          <Input id="habit-time" value={time} onChange={(e) => setTime(e.target.value)} placeholder="right after waking up" />
        </div>

        <div>
          <label htmlFor="habit-place" className="mb-1 block text-sm font-medium text-foreground">
            Place <span className="font-normal text-foreground/40">(optional)</span>
          </label>
          <Input id="habit-place" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="in the bedroom" />
        </div>

        <Button type="submit">{habit ? "Save changes" : "Add habit"}</Button>

        {habit && onArchive && (
          <button
            type="button"
            onClick={onArchive}
            className="cursor-pointer text-sm text-foreground/40 hover:text-destructive"
          >
            Archive this habit
          </button>
        )}
      </form>
    </div>
  );
}
