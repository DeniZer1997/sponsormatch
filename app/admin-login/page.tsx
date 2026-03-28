"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const ACCENT = "#07929B";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace("/admin");
      } else {
        setError("Falsches Passwort.");
        setPassword("");
      }
    } catch {
      setError("Verbindungsfehler.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Helvetica Neue', Helvetica, sans-serif", padding: "1.5rem" }}>
      <div style={{ background: "#ffffff", border: "1px solid #e8e4dd", borderRadius: 20, padding: "2.5rem 2rem", width: "100%", maxWidth: 380, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 44, height: 44, background: ACCENT, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.85rem" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "Georgia, serif", color: "#1a1814", marginBottom: "0.3rem" }}>Admin-Zugang</div>
          <div style={{ fontSize: "0.82rem", color: "#6b6560" }}>SponsorMatch Dashboard</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#6b6560", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>
              ADMIN-PASSWORT
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Passwort eingeben"
              autoFocus
              required
              style={{ width: "100%", padding: "0.75rem 1rem", border: `1.5px solid ${error ? "#dc2626" : "#e8e4dd"}`, borderRadius: 10, background: "#f8f7f4", color: "#1a1814", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {error && (
            <div style={{ fontSize: "0.85rem", color: "#dc2626", marginBottom: "1rem", padding: "0.6rem 0.9rem", background: "#fef2f2", borderRadius: 8 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{ width: "100%", background: loading || !password ? "#d4cfca" : ACCENT, color: "#fff", border: "none", borderRadius: 10, padding: "0.85rem", fontSize: "0.95rem", fontWeight: 700, cursor: loading || !password ? "not-allowed" : "pointer" }}
          >
            {loading ? "Wird geprüft…" : "Einloggen"}
          </button>
        </form>
      </div>
    </div>
  );
}
