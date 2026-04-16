import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background px-6 text-center">
          <p className="font-heading font-bold text-xl mb-2">Something went wrong</p>
          <p className="text-muted-foreground text-sm mb-6">Please refresh the app to continue.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
