import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { LanguageProvider } from "./LanguageContext";
import { DarkModeProvider } from "./DarkModeContext";

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  componentDidCatch(error) { this.setState({ error: error.toString() }); }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 20, background: "#fef2f2", color: "#dc2626", fontFamily: "monospace", fontSize: 13, minHeight: "100vh", whiteSpace: "pre-wrap" }}>
        <h2>🚨 App Crash</h2>
        <p>{this.state.error}</p>
      </div>
    );
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ErrorBoundary>
    <LanguageProvider>
      <DarkModeProvider>
        <App />
      </DarkModeProvider>
    </LanguageProvider>
  </ErrorBoundary>
);
