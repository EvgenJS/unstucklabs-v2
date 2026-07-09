import { Component, type ReactNode } from "react";
import { Button } from "@unstucklabs/ui";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("HabitFlow crashed:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-xl font-semibold text-foreground">Something hiccuped on our end.</p>
          <p className="text-sm text-foreground/60">
            Your progress up to a moment ago is saved -- reloading should bring you right back.
          </p>
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
