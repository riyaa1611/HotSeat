import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh", display: "grid", placeItems: "center",
          background: "var(--bg-primary)", color: "var(--text-primary)",
        }}>
          <div style={{ textAlign: "center", maxWidth: 480, padding: "0 24px" }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent-red)", marginBottom: 16 }}>
              Unexpected Error
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Something went wrong.</h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28, lineHeight: 1.6 }}>
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button className="btn btn-primary" onClick={() => window.location.href = "/"}>
              Go Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
