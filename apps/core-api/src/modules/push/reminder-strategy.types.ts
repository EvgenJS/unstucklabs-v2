// Shared type only -- kept in its own file so push.scheduler.ts and each
// app's own reminder-strategy.ts can both import it without a circular
// module dependency (the scheduler imports the strategies; the strategies
// only need the type, not the scheduler itself).

export interface ReminderResult {
  title: string;
  body: string;
  url?: string;
}

export interface ReminderStrategy {
  productSlug: string;
  // `appData` is the raw AppUserData.data blob for one user -- opaque JSON
  // as far as core-api's generic modules are concerned, so each strategy
  // defines its own minimal local shape for the fields it actually reads.
  shouldRemind(appData: unknown, now: Date): ReminderResult | null;
}
