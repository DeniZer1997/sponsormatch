"use client";
import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function BetaLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/beta-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const from = searchParams.get("from") || "/";
        router.replace(from);
      } else {
        setError("Falsches Passwort. Bitte erneut versuchen.");
        setPassword("");
      }
    } catch {
      setError("Verbindungsfehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8f7f4",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
      padding: "1.5rem",
    }}>
      <div style={{
        background: "#ffffff",
        border: "1px solid #e8e4dd",
        borderRadius: 20,
        padding: "2.5rem 2rem",
        width: "100%",
        maxWidth: 380,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            fontFamily: "Georgia, serif",
            color: "#1a1814",
            marginBottom: "0.4rem",
          }}>
            Sponsor<span style={{ color: "#07929B" }}>Match</span>
          </div>
          <div style={{ fontSize: "0.85rem", color: "#6b6560" }}>
            Private Beta — Zugang erforderlich
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{
              display: "block",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#6b6560",
              letterSpacing: "0.07em",
              marginBottom: "0.5rem",
            }}>
              BETA-PASSWORT
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Passwort eingeben"
              autoFocus
              required
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: `1.5px solid ${error ? "#dc2626" : "#e8e4dd"}`,
                borderRadius: 10,
                background: "#f8f7f4",
                color: "#1a1814",
                fontSize: "0.95rem",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          {error && (
            <div style={{
              fontSize: "0.85rem",
              color: "#dc2626",
              marginBottom: "1rem",
              padding: "0.6rem 0.9rem",
              background: "#fef2f2",
              borderRadius: 8,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: "100%",
              background: loading || !password ? "#d4cfca" : "#07929B",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "0.85rem",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: loading || !password ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {loading ? "Wird geprüft…" : "Zugang erhalten"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BetaLoginPage() {
  return (
    <Suspense>
      <BetaLoginForm />
    </Suspense>
  );
}
