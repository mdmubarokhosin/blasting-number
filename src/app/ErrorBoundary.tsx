import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div className="bg-background flex min-h-dvh items-center justify-center px-4 py-10">
        <div className="bg-surface w-full max-w-lg rounded-2xl border p-6 text-center shadow-sm">
          <span className="bg-danger/10 text-danger mx-auto inline-flex size-14 items-center justify-center rounded-2xl text-2xl font-bold">
            !
          </span>
          <h1 className="mt-4 text-xl font-bold">কিছু একটা সমস্যা হয়েছে</h1>
          <p className="text-muted mt-2 text-sm">
            অ্যাপটি অপ্রত্যাশিতভাবে বন্ধ হয়ে গেছে। পৃষ্ঠাটি রিফ্রেশ করে আবার চেষ্টা করুন।
          </p>
          <pre className="bg-default text-muted mt-4 max-h-32 overflow-auto rounded-xl p-3 text-left text-xs">
            {this.state.error.message || "Unknown error"}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bg-accent text-accent-foreground mt-4 inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
          >
            পৃষ্ঠা রিফ্রেশ করুন
          </button>
        </div>
      </div>
    );
  }
}
