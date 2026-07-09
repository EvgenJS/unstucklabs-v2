import { useState } from "react";
import { Button, Card } from "@unstucklabs/ui";
import { ACHIEVEMENTS } from "../lib/achievements";
import { generateShareCard, shareCard } from "../lib/shareCard";

interface Props {
  taskTitle: string;
  completedSubtasks: number;
  actualMinutes: number | null;
  newlyUnlocked: string[];
  onStartNew: () => void;
  onViewHistory: () => void;
}

export function CompletionView({
  taskTitle,
  completedSubtasks,
  actualMinutes,
  newlyUnlocked,
  onStartNew,
  onViewHistory,
}: Props) {
  const [sharing, setSharing] = useState(false);
  const achievement = newlyUnlocked.length > 0 ? ACHIEVEMENTS.find((a) => a.id === newlyUnlocked[0]) : undefined;

  async function handleShare() {
    setSharing(true);
    try {
      const blob = await generateShareCard({
        taskTitle,
        completedSubtasks,
        actualMinutes,
        newAchievementId: newlyUnlocked[0],
      });
      await shareCard(blob);
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-5xl">🎉</p>
      <h1 className="mt-4 text-2xl font-bold text-foreground">Done. That's it, that's the whole thing.</h1>
      <p className="mt-2 text-foreground/70">{taskTitle}</p>

      <p className="mt-4 text-sm text-foreground/60">
        {completedSubtasks} step{completedSubtasks === 1 ? "" : "s"}
        {actualMinutes != null ? `, about ${actualMinutes} minutes` : ""}.
      </p>

      {achievement && (
        <Card className="mt-6 w-full">
          <p className="text-sm font-medium text-accent">New badge</p>
          <p className="mt-1 font-semibold text-foreground">{achievement.label}</p>
          <p className="mt-1 text-sm text-foreground/60">{achievement.description}</p>
        </Card>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={onStartNew}>Start another</Button>
        <Button variant="secondary" onClick={handleShare} disabled={sharing}>
          {sharing ? "Preparing…" : "Share this win"}
        </Button>
      </div>
      <button type="button" onClick={onViewHistory} className="mt-6 cursor-pointer text-sm text-foreground/50 hover:text-foreground">
        View history
      </button>
    </div>
  );
}
