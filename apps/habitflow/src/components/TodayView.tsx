import { motion } from "framer-motion";
import { Button } from "@unstucklabs/ui";
import type { CompletionsByDate, Habit } from "../lib/types";
import { computeStreak, currentWeekDates, dateKey, isRecoveryEligible } from "../lib/streaks";

interface Props {
  habits: Habit[];
  completions: CompletionsByDate;
  onCheckOff: (habitId: string) => void;
  onAddHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onRecover: (habit: Habit) => void;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TodayView({ habits, completions, onCheckOff, onAddHabit, onEditHabit, onRecover }: Props) {
  const activeHabits = habits.filter((h) => !h.archivedAt);
  const week = currentWeekDates();
  const todayKey = dateKey(new Date());

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Today</h1>
        <button
          type="button"
          onClick={onAddHabit}
          className="cursor-pointer text-sm font-medium text-primary hover:opacity-80"
        >
          + Add habit
        </button>
      </div>

      {activeHabits.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <p className="text-4xl">🌱</p>
          <p className="text-muted-foreground">No habits yet -- add your first one to get started.</p>
          <Button onClick={onAddHabit}>Add your first habit</Button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {activeHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              completions={completions}
              week={week}
              todayKey={todayKey}
              onCheckOff={() => onCheckOff(habit.id)}
              onEdit={() => onEditHabit(habit)}
              onRecover={() => onRecover(habit)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HabitCard({
  habit,
  completions,
  week,
  todayKey,
  onCheckOff,
  onEdit,
  onRecover,
}: {
  habit: Habit;
  completions: CompletionsByDate;
  week: Date[];
  todayKey: string;
  onCheckOff: () => void;
  onEdit: () => void;
  onRecover: () => void;
}) {
  const streak = computeStreak(habit.id, completions);
  const isDoneToday = (completions[todayKey] ?? []).includes(habit.id);
  const recoveryEligible = isRecoveryEligible(habit.id, completions);
  const badge = streak >= 21 ? "🔥🔥" : streak >= 7 ? "🔥" : null;

  function handleTap() {
    if (navigator.vibrate) navigator.vibrate(15);
    onCheckOff();
  }

  return (
    <div
      className="rounded-xl border border-border bg-white p-4 transition-shadow duration-200"
      style={streak >= 21 ? { boxShadow: `0 0 16px -2px ${habit.color}` } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onEdit} className="flex-1 cursor-pointer text-left">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: habit.color }} />
            {habit.emoji} {habit.name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {streak > 0 ? `${streak}-day streak` : "No streak yet"} {badge}
          </p>
        </button>

        <motion.button
          type="button"
          onClick={handleTap}
          whileTap={{ scale: 0.9 }}
          aria-pressed={isDoneToday}
          aria-label={isDoneToday ? `Mark ${habit.name} as not done today` : `Mark ${habit.name} as done today`}
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 text-xl text-white transition-colors duration-200"
          style={
            isDoneToday
              ? { borderColor: habit.color, backgroundColor: habit.color }
              : { borderColor: "var(--color-border)", backgroundColor: "white", color: "var(--color-muted-foreground)" }
          }
        >
          {isDoneToday ? "✓" : ""}
        </motion.button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {week.map((day) => {
          const key = dateKey(day);
          const done = (completions[key] ?? []).includes(habit.id);
          const isToday = key === todayKey;
          const isFuture = key > todayKey;
          return (
            <div key={key} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-muted-foreground">{WEEKDAY_LABELS[day.getDay()]}</span>
              <div
                className="h-6 w-6 rounded-md border-2"
                style={
                  done
                    ? { borderColor: habit.color, backgroundColor: habit.color }
                    : isToday
                      ? { borderColor: habit.color, borderStyle: "dashed", backgroundColor: "transparent" }
                      : isFuture
                        ? { borderColor: "var(--color-border)", backgroundColor: "transparent", opacity: 0.5 }
                        : { borderColor: "var(--color-border)", backgroundColor: "var(--color-muted)" }
                }
              />
            </div>
          );
        })}
      </div>

      {recoveryEligible && (
        <button
          type="button"
          onClick={onRecover}
          className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80"
        >
          <span aria-hidden="true">✨</span> Recover your streak
        </button>
      )}
    </div>
  );
}
