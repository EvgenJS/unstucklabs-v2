import { useState } from "react";
import { Button } from "@unstucklabs/ui";
import type { ForecastResult } from "@unstucklabs/sdk";

interface Props {
  forecast: ForecastResult;
  onLog: (result: "caught" | "nothing") => void;
}

const CONFIDENCE_COLOR: Record<ForecastResult["confidence"], string> = {
  high: "text-emerald-400",
  medium: "text-accent",
  low: "text-destructive",
};

export function ForecastResultCard({ forecast, onLog }: Props) {
  const [logged, setLogged] = useState<"caught" | "nothing" | null>(null);
  const isGo = forecast.verdict === "GO";
  const maxWindowScore = Math.max(...forecast.bestWindows.map((w) => w.score), 1);

  function handleLog(result: "caught" | "nothing") {
    setLogged(result);
    onLog(result);
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-3xl font-bold ${isGo ? "text-emerald-400" : "text-destructive"}`}>
            {isGo ? "🟢 GO" : "🔴 WAIT"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {forecast.weather.city}, {forecast.weather.country} · {forecast.fish}
          </p>
        </div>
        <p className={`text-sm font-semibold uppercase ${CONFIDENCE_COLOR[forecast.confidence]}`}>{forecast.confidence}</p>
      </div>

      <blockquote className="mt-4 border-l-2 border-primary pl-3 text-sm text-foreground">{forecast.oneReason}</blockquote>

      <div className="mt-4">
        <p className="text-sm font-medium text-foreground">Bite score</p>
        <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-background">
          <div
            className={`h-full rounded-full ${forecast.score >= 7 ? "bg-accent" : forecast.score >= 4 ? "bg-primary" : "bg-muted-foreground"}`}
            style={{ width: `${forecast.score * 10}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{forecast.score}/10</p>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
        <div className="rounded-lg bg-background p-2">
          <p className="text-muted-foreground">Temp</p>
          <p className="font-semibold text-foreground">
            {Math.round(forecast.weather.temp)}
            {forecast.weather.tempUnit}
          </p>
        </div>
        <div className="rounded-lg bg-background p-2">
          <p className="text-muted-foreground">Pressure</p>
          <p className="font-semibold text-foreground">{forecast.weather.pressureHpa} hPa</p>
        </div>
        <div className="rounded-lg bg-background p-2">
          <p className="text-muted-foreground">Wind</p>
          <p className="font-semibold text-foreground">
            {Math.round(forecast.weather.windSpeed)} {forecast.weather.windUnit}
          </p>
        </div>
        <div className="rounded-lg bg-background p-2">
          <p className="text-muted-foreground">Clouds</p>
          <p className="font-semibold text-foreground">{forecast.weather.clouds}%</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-foreground">Golden window</p>
        {/* Bars and labels are separate rows -- a percentage `height` on the
            bar only resolves against an ancestor with an explicit (non-auto)
            height, so the bar's flex column needs `h-full` here rather than
            sharing a shrink-to-fit column with the label underneath it. */}
        <div className="mt-2 flex h-20 items-end gap-1">
          {forecast.bestWindows.map((w, i) => {
            const isPeak = w.score >= maxWindowScore * 0.85;
            return (
              <div key={i} className="flex h-full flex-1 items-end">
                <div
                  className={`w-full rounded-t ${isPeak ? "bg-accent" : "bg-primary/40"}`}
                  style={{ height: `${Math.max(8, (w.score / 10) * 100)}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex gap-1">
          {forecast.bestWindows.map((w, i) => (
            <p key={i} className="flex-1 text-center text-[10px] text-muted-foreground">
              {w.time}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-foreground">Analysis</p>
        {forecast.analysis.split("\n").filter(Boolean).map((paragraph, i) => (
          <p key={i} className="mt-2 text-sm text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-foreground">Recommended lures</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          {forecast.lures.map((lure, i) => (
            <li key={i}>{lure}</li>
          ))}
        </ol>
      </div>

      {forecast.personalNote && (
        <p className="mt-5 rounded-lg bg-primary/10 px-3 py-2 text-sm text-foreground">🎣 {forecast.personalNote}</p>
      )}

      <p className="mt-5 text-xs text-muted-foreground">{forecast.disclaimer}</p>

      <div className="mt-5 flex gap-3">
        {logged ? (
          <p className="text-sm font-medium text-foreground">Result logged! {logged === "caught" ? "🎣" : "Better luck next time."}</p>
        ) : (
          <>
            <Button onClick={() => handleLog("caught")} className="flex-1">
              ✓ Caught
            </Button>
            <Button variant="secondary" onClick={() => handleLog("nothing")} className="flex-1">
              ✗ Nothing
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
