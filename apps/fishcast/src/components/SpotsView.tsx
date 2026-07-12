import { useState } from "react";
import { Button, Input } from "@unstucklabs/ui";
import { WATER_TYPE_OPTIONS, type WaterType } from "../lib/types";
import type { SavedSpot } from "../lib/types";
import { LocationSearchField, type LocationValue } from "./LocationSearchField";

interface Props {
  accessToken: string | undefined;
  spots: SavedSpot[];
  onAdd: (input: { name: string; lat: number; lng: number; waterType: WaterType }) => void;
  onRemove: (spotId: string) => void;
  onUse: (spot: SavedSpot) => void;
}

// Not in v1 -- one of the client-approved new features (a reusable list of
// favorite locations so anglers don't re-search the same lake every time).
export function SpotsView({ accessToken, spots, onAdd, onRemove, onUse }: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [waterType, setWaterType] = useState<WaterType>("lake");

  function handleAdd() {
    if (!location) return;
    onAdd({ name: name.trim() || location.name, lat: location.lat, lng: location.lng, waterType });
    setAdding(false);
    setName("");
    setLocation(null);
    setWaterType("lake");
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">📍 Saved Spots</h1>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="cursor-pointer text-sm font-semibold text-primary">
            + Add
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Spot name (optional)"
            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
          <LocationSearchField accessToken={accessToken} value={location} onChange={setLocation} />
          <select
            value={waterType}
            onChange={(e) => setWaterType(e.target.value as WaterType)}
            className="rounded-lg border border-border bg-background px-3 py-3 text-foreground"
          >
            {WATER_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={!location} className="flex-1">
              Save spot
            </Button>
            <Button variant="secondary" onClick={() => setAdding(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {spots.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground">No saved spots yet -- add one to skip the search next time.</p>
        )}
        {spots.map((spot) => (
          <div key={spot.id} className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
            <div>
              <p className="font-semibold text-foreground">{spot.name}</p>
              <p className="text-xs text-muted-foreground">
                {WATER_TYPE_OPTIONS.find((o) => o.value === spot.waterType)?.label}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onUse(spot)}
                className="cursor-pointer rounded-lg border border-primary px-3 py-1.5 text-sm text-primary"
              >
                Use
              </button>
              <button
                type="button"
                onClick={() => onRemove(spot.id)}
                className="cursor-pointer rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-destructive"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
