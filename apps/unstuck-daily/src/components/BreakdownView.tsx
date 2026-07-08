import { Button, Card } from "@unstucklabs/ui";
import type { TaskBreakdown } from "@unstucklabs/sdk";

interface Props {
  title: string;
  breakdown: TaskBreakdown;
  onStart: () => void;
  onBack: () => void;
}

export function BreakdownView({ title, breakdown, onStart, onBack }: Props) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium text-primary">{title}</p>
      <p className="mt-2 text-lg text-foreground">{breakdown.encouragement}</p>

      <p className="mt-6 text-sm text-foreground/60">
        About {breakdown.estimateMinutes} minutes, give or take -- no rush.
      </p>

      <Card className="mt-4">
        <ol className="flex flex-col gap-3">
          {breakdown.subtasks.map((step, i) => (
            <li key={i} className="flex gap-3 text-foreground">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="mt-6 flex gap-3">
        <Button onClick={onStart}>Start with step 1</Button>
        <Button variant="secondary" onClick={onBack}>
          Try again
        </Button>
      </div>
    </div>
  );
}
