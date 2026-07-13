import { BADGE_META, computeStats } from "../lib/stats";
import { FISH_SPECIES_OPTIONS, type CatchEntry, type Units } from "../lib/types";
import { STORE_URL } from "../lib/api";

interface Props {
  email: string;
  catches: CatchEntry[];
  units: Units;
  onSetUnits: (units: Units) => void;
  onLogout: () => void;
}

export function ProfileView({ email, catches, units, onSetUnits, onLogout }: Props) {
  const stats = computeStats(catches);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground">👤 Profile</h1>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-surface p-4">
        <p className="text-sm text-foreground">{email}</p>
        <button type="button" onClick={onLogout} className="cursor-pointer text-sm text-muted-foreground hover:text-destructive">
          Sign out
        </button>
      </div>

      <a
        href={`${STORE_URL}/account`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 text-center text-sm font-semibold text-primary"
      >
        Manage subscription on the store →
      </a>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-muted-foreground">Total trips</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-muted-foreground">Successful</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.successful}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-muted-foreground">Current streak</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.streak}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-muted-foreground">Forecast accuracy</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.accuracy === null ? "—" : `${stats.accuracy}%`}</p>
        </div>
      </div>

      {stats.topSpecies && (
        <div className="mt-3 rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-muted-foreground">Favorite species</p>
          <p className="mt-1 font-semibold text-foreground">
            {FISH_SPECIES_OPTIONS.find((o) => o.value === stats.topSpecies)?.label}
          </p>
        </div>
      )}

      <div className="mt-6">
        <p className="text-sm font-medium text-foreground">Badges</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {BADGE_META.map((badge) => {
            const earned = stats.badges.has(badge.key);
            return (
              <div
                key={badge.key}
                className={`flex flex-col items-center gap-1 rounded-xl border border-border bg-surface p-3 text-center ${
                  earned ? "" : "opacity-40"
                }`}
              >
                <span className="text-2xl" aria-hidden="true">
                  {badge.icon}
                </span>
                <span className="text-[10px] text-muted-foreground">{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-foreground">Units</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => onSetUnits("imperial")}
            className={`flex-1 cursor-pointer rounded-lg border py-2 text-sm font-semibold ${
              units === "imperial" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            Imperial (°F, lbs)
          </button>
          <button
            type="button"
            onClick={() => onSetUnits("metric")}
            className={`flex-1 cursor-pointer rounded-lg border py-2 text-sm font-semibold ${
              units === "metric" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            Metric (°C, kg)
          </button>
        </div>
      </div>
    </div>
  );
}
