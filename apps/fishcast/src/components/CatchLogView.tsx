import { useRef, useState } from "react";
import { Button, Input } from "@unstucklabs/ui";
import { getApiClient, API_URL } from "../lib/api";
import { FISH_SPECIES_OPTIONS, type CatchEntry, type FishSpecies, type Units } from "../lib/types";
import { LocationSearchField, type LocationValue } from "./LocationSearchField";

interface Props {
  accessToken: string | undefined;
  units: Units;
  catches: CatchEntry[];
  onLog: (input: {
    result: "caught" | "nothing";
    verdict: null;
    location: LocationValue;
    fishSpecies?: FishSpecies;
    weightLbs?: number;
    notes?: string;
    photoUrl?: string | null;
  }) => void;
}

function weightToLbs(value: number, units: Units): number {
  return units === "metric" ? value * 2.20462 : value;
}

function lbsToDisplay(lbs: number, units: Units): string {
  const value = units === "metric" ? lbs / 2.20462 : lbs;
  return value.toFixed(1);
}

export function CatchLogView({ accessToken, units, catches, onLog }: Props) {
  const [adding, setAdding] = useState(false);
  const [result, setResult] = useState<"caught" | "nothing">("caught");
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [species, setSpecies] = useState<FishSpecies>("bass");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const sorted = [...catches].sort((a, b) => b.date.localeCompare(a.date));
  const weightUnit = units === "metric" ? "kg" : "lbs";

  async function handlePhoto(file: File) {
    setUploading(true);
    try {
      const { url } = await getApiClient(accessToken).fishcast.uploadCatchPhoto(file);
      setPhotoUrl(url);
    } finally {
      setUploading(false);
    }
  }

  function resetForm() {
    setAdding(false);
    setResult("caught");
    setLocation(null);
    setSpecies("bass");
    setWeight("");
    setNotes("");
    setPhotoUrl(null);
  }

  function handleSubmit() {
    if (!location) return;
    onLog({
      result,
      verdict: null,
      location,
      fishSpecies: result === "caught" ? species : undefined,
      weightLbs: result === "caught" && weight ? weightToLbs(Number(weight), units) : undefined,
      notes: notes.trim() || undefined,
      photoUrl,
    });
    resetForm();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">📋 Catch Log</h1>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="cursor-pointer text-sm font-semibold text-primary">
            + Log Trip
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setResult("caught")}
              className={`flex-1 cursor-pointer rounded-lg border py-2 text-sm font-semibold ${
                result === "caught" ? "border-accent bg-accent text-on-primary" : "border-border text-muted-foreground"
              }`}
            >
              ✓ Caught
            </button>
            <button
              type="button"
              onClick={() => setResult("nothing")}
              className={`flex-1 cursor-pointer rounded-lg border py-2 text-sm font-semibold ${
                result === "nothing" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              ✗ Nothing
            </button>
          </div>

          <LocationSearchField accessToken={accessToken} value={location} onChange={setLocation} placeholder="Where did you fish?" />

          {result === "caught" && (
            <>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value as FishSpecies)}
                className="rounded-lg border border-border bg-background px-3 py-3 text-foreground"
              >
                {FISH_SPECIES_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={`Weight (${weightUnit}, optional)`}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </>
          )}

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={3}
            className="rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground"
          />

          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="cursor-pointer rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground disabled:opacity-50"
          >
            {uploading ? "Uploading…" : photoUrl ? "📷 Photo added -- tap to replace" : "📷 Add a photo (optional)"}
          </button>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={!location} className="flex-1">
              Save trip
            </Button>
            <Button variant="secondary" onClick={resetForm} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {sorted.length === 0 && !adding && <p className="text-sm text-muted-foreground">No trips logged yet.</p>}
        {sorted.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-foreground">
                  {c.result === "caught" ? "✅" : "❌"}{" "}
                  {c.result === "caught"
                    ? `${FISH_SPECIES_OPTIONS.find((o) => o.value === c.fishSpecies)?.label ?? "Fish"}${
                        c.weightLbs ? ` · ${lbsToDisplay(c.weightLbs, units)} ${weightUnit}` : ""
                      }`
                    : "Nothing caught"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.location.name}</p>
                {c.notes && <p className="mt-1 text-sm text-muted-foreground">{c.notes}</p>}
              </div>
              {c.verdict && (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    c.verdict === "GO" ? "bg-emerald-400/20 text-emerald-400" : "bg-destructive/20 text-destructive"
                  }`}
                >
                  {c.verdict}
                </span>
              )}
            </div>
            {c.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`${API_URL}${c.photoUrl}`} alt="Catch photo" className="mt-3 h-40 w-full rounded-lg object-cover" />
            )}
            <p className="mt-2 text-xs text-muted-foreground">{new Date(c.date).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
