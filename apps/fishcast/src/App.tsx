import { useState } from "react";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { SubscriptionGate } from "./components/SubscriptionGate";
import { AppDataProvider, useAppData } from "./context/AppDataProvider";
import { ForecastView } from "./components/ForecastView";
import { SpotsView } from "./components/SpotsView";
import { CatchLogView } from "./components/CatchLogView";
import { ProfileView } from "./components/ProfileView";
import { ErrorBoundary } from "./components/ErrorBoundary";
import type { LocationValue } from "./components/LocationSearchField";
import type { SavedSpot } from "./lib/types";

type Screen = "forecast" | "spots" | "log" | "profile";

function AppContent() {
  const { user, accessToken, logout } = useAuth();
  const { data, loading, addSpot, removeSpot, logCatch, setUnits } = useAppData();
  const [screen, setScreen] = useState<Screen>("forecast");
  const [prefillLocation, setPrefillLocation] = useState<LocationValue | null>(null);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  function useSpot(spot: SavedSpot) {
    setPrefillLocation({ lat: spot.lat, lng: spot.lng, name: spot.name });
    setScreen("forecast");
  }

  return (
    <>
      <div className="pb-16">
        {screen === "forecast" && (
          <ForecastView
            accessToken={accessToken ?? undefined}
            units={data.units}
            prefillLocation={prefillLocation}
            onPrefillConsumed={() => setPrefillLocation(null)}
            onLogCatch={({ result, verdict, location }) => logCatch({ result, verdict, location })}
          />
        )}

        {screen === "spots" && (
          <SpotsView
            accessToken={accessToken ?? undefined}
            spots={data.savedSpots}
            onAdd={addSpot}
            onRemove={removeSpot}
            onUse={useSpot}
          />
        )}

        {screen === "log" && (
          <CatchLogView accessToken={accessToken ?? undefined} units={data.units} catches={data.catches} onLog={logCatch} />
        )}

        {screen === "profile" && (
          <ProfileView
            email={user?.email ?? ""}
            catches={data.catches}
            units={data.units}
            onSetUnits={setUnits}
            onLogout={logout}
          />
        )}
      </div>

      <BottomNav screen={screen} onNavigate={setScreen} />
    </>
  );
}

const TABS: Array<{ key: Screen; label: string; icon: string }> = [
  { key: "forecast", label: "Forecast", icon: "🎣" },
  { key: "spots", label: "Spots", icon: "📍" },
  { key: "log", label: "Log", icon: "📋" },
  { key: "profile", label: "Profile", icon: "👤" },
];

function BottomNav({ screen, onNavigate }: { screen: Screen; onNavigate: (s: Screen) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-lg justify-around">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onNavigate(tab.key)}
            aria-current={screen === tab.key ? "page" : undefined}
            className={`flex flex-1 cursor-pointer flex-col items-center gap-0.5 py-2 text-xs ${
              screen === tab.key ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SubscriptionGate>
          <AppDataProvider>
            <AppContent />
          </AppDataProvider>
        </SubscriptionGate>
      </AuthProvider>
    </ErrorBoundary>
  );
}
