import { useState } from "react";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { SubscriptionGate } from "./components/SubscriptionGate";
import { AppDataProvider, useAppData } from "./context/AppDataProvider";
import { TodayView } from "./components/TodayView";
import { AddEditHabitView } from "./components/AddEditHabitView";
import { StatsView } from "./components/StatsView";
import { CoachView } from "./components/CoachView";
import { RecoveryDayModal } from "./components/RecoveryDayModal";
import { PushPermissionBanner } from "./components/PushPermissionBanner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import type { Habit } from "./lib/types";

type Screen = "today" | "addHabit" | "editHabit" | "stats" | "coach";

function AppContent() {
  const { accessToken } = useAuth();
  const { data, loading, addHabit, editHabit, archiveHabit, checkOffHabit, applyRecoveryDay } = useAppData();
  const [screen, setScreen] = useState<Screen>("today");
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [recoveringHabit, setRecoveringHabit] = useState<Habit | null>(null);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-foreground/60">Loading…</p>
      </div>
    );
  }

  const showBottomNav = screen !== "addHabit" && screen !== "editHabit";

  return (
    <>
      <PushPermissionBanner />

      <div className={showBottomNav ? "pb-16" : ""}>
        {screen === "today" && (
          <TodayView
            habits={data.habits}
            completions={data.completions}
            onCheckOff={checkOffHabit}
            onAddHabit={() => {
              setEditingHabit(null);
              setScreen("addHabit");
            }}
            onEditHabit={(habit) => {
              setEditingHabit(habit);
              setScreen("editHabit");
            }}
            onRecover={(habit) => setRecoveringHabit(habit)}
          />
        )}

        {(screen === "addHabit" || screen === "editHabit") && (
          <AddEditHabitView
            habit={editingHabit ?? undefined}
            onSave={(input) => {
              if (editingHabit) editHabit(editingHabit.id, input);
              else addHabit(input);
              setScreen("today");
            }}
            onArchive={
              editingHabit
                ? () => {
                    archiveHabit(editingHabit.id);
                    setScreen("today");
                  }
                : undefined
            }
            onBack={() => setScreen("today")}
          />
        )}

        {screen === "stats" && (
          <StatsView
            habits={data.habits}
            completions={data.completions}
            longestStreakEver={data.longestStreakEver}
            onBack={() => setScreen("today")}
          />
        )}

        {screen === "coach" && (
          <CoachView
            habits={data.habits}
            completions={data.completions}
            accessToken={accessToken ?? undefined}
            onBack={() => setScreen("today")}
          />
        )}
      </div>

      {recoveringHabit && (
        <RecoveryDayModal
          habit={recoveringHabit}
          accessToken={accessToken ?? undefined}
          onAccept={() => applyRecoveryDay(recoveringHabit.id)}
          onClose={() => setRecoveringHabit(null)}
        />
      )}

      {showBottomNav && <BottomNav screen={screen} onNavigate={setScreen} />}
    </>
  );
}

const TABS: Array<{ key: Screen; label: string; icon: string }> = [
  { key: "today", label: "Today", icon: "✓" },
  { key: "stats", label: "Stats", icon: "\u{1F4CA}" },
  { key: "coach", label: "Coach", icon: "✨" },
];

function BottomNav({ screen, onNavigate }: { screen: Screen; onNavigate: (s: Screen) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-white">
      <div className="mx-auto flex max-w-lg justify-around">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onNavigate(tab.key)}
            aria-current={screen === tab.key ? "page" : undefined}
            className={`flex flex-1 cursor-pointer flex-col items-center gap-0.5 py-2 text-xs ${
              screen === tab.key ? "text-primary" : "text-foreground/50"
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
