"use client";
import { useEffect, useState } from "react";

const ACCENT = "#07929B";

type ActiveUser = {
  user_id: string;
  email: string;
  current_page: string;
  current_event: string | null;
  last_seen: string;
  logged_in_at: string;
};

type LoginEvent = {
  id: string;
  email: string;
  created_at: string;
};

type Stats = {
  activeNow: ActiveUser[];
  allUsers: ActiveUser[];
  loginsToday: number;
  loginsWeek: number;
  recentLogins: LoginEvent[];
};

const PAGE_LABELS: Record<string, string> = {
  dashboard: "Übersicht",
  pipeline: "Pipeline",
  packages: "Pakete",
  contacts: "Kontakte",
  calendar: "Kalender",
  ki: "KI-Suche",
  preview: "Vorschau",
  settings: "Einstellungen",
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `vor ${diff}s`;
  if (diff < 3600) return `vor ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)}h`;
  return new Date(iso).toLocaleDateString("de-AT");
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    try {
      const res = await fetch("/api/admin-stats");
      if (res.status === 403) { setError("Kein Zugriff."); return; }
      if (!res.ok) { setError("Fehler beim Laden."); return; }
      setStats(await res.json());
      setLastRefresh(new Date());
      setError("");
    } catch {
      setError("Verbindungsfehler.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f8f7f4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Helvetica Neue', sans-serif" }}>
      <div style={{ color: "#6b6560", fontSize: "0.95rem" }}>Lade Dashboard…</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: "#f8f7f4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Helvetica Neue', sans-serif" }}>
      <div style={{ color: "#dc2626", fontSize: "0.95rem" }}>{error}</div>
    </div>
  );

  if (!stats) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f4", fontFamily: "'Helvetica Neue', Helvetica, sans-serif", color: "#1a1814" }}>
      {/* Header */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #e8e4dd", padding: "0 1.5rem", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 32, height: 32, background: ACCENT, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.02em" }}>SponsorMatch <span style={{ color: ACCENT }}>Admin</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.78rem", color: "#a09b94" }}>Aktualisiert {formatTime(lastRefresh.toISOString())} · Auto-Refresh 30s</span>
          <button onClick={load} style={{ background: ACCENT, color: "#fff", border: "none", borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>↻ Neu laden</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* Stat-Karten */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Aktiv jetzt", value: stats.activeNow.length, sub: "in den letzten 10 Min.", color: "#16a34a", bg: "#dcfce7" },
            { label: "Logins heute", value: stats.loginsToday, sub: "Anmeldungen", color: ACCENT, bg: `${ACCENT}18` },
            { label: "Logins diese Woche", value: stats.loginsWeek, sub: "Anmeldungen", color: "#2563eb", bg: "#dbeafe" },
            { label: "Nutzer gesamt", value: stats.allUsers.length, sub: "registriert", color: "#9333ea", bg: "#f3e8ff" },
          ].map(({ label, value, sub, color, bg }) => (
            <div key={label} style={{ background: "#ffffff", border: "1.5px solid #e8e4dd", borderRadius: 14, padding: "1.25rem 1.5rem" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", color: "#a09b94", marginBottom: "0.5rem" }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color, fontFamily: "Georgia, serif", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: "0.75rem", color: "#6b6560", marginTop: "0.35rem" }}>{sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>

          {/* Aktive Nutzer */}
          <div style={{ background: "#ffffff", border: "1.5px solid #e8e4dd", borderRadius: 16, padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", boxShadow: "0 0 0 3px #dcfce7" }} />
              <span style={{ fontWeight: 700, fontSize: "0.92rem" }}>Aktiv jetzt</span>
              <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#a09b94" }}>{stats.activeNow.length} online</span>
            </div>
            {stats.activeNow.length === 0 ? (
              <div style={{ color: "#a09b94", fontSize: "0.85rem", textAlign: "center", padding: "1.5rem 0" }}>Niemand aktiv</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {stats.activeNow.map(u => (
                  <div key={u.user_id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.7rem", background: "#f8f7f4", borderRadius: 10 }}>
                    <div style={{ width: 34, height: 34, background: `${ACCENT}18`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: ACCENT }}>{u.email[0].toUpperCase()}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                      <div style={{ fontSize: "0.75rem", color: "#6b6560", marginTop: "0.1rem" }}>
                        {PAGE_LABELS[u.current_page] || u.current_page}
                        {u.current_event && <span style={{ color: "#a09b94" }}> · {u.current_event}</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#a09b94", flexShrink: 0 }}>{timeAgo(u.last_seen)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Letzte Logins */}
          <div style={{ background: "#ffffff", border: "1.5px solid #e8e4dd", borderRadius: 16, padding: "1.5rem" }}>
            <div style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: "1.25rem" }}>Letzte Anmeldungen</div>
            {stats.recentLogins.length === 0 ? (
              <div style={{ color: "#a09b94", fontSize: "0.85rem", textAlign: "center", padding: "1.5rem 0" }}>Keine Logins</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {stats.recentLogins.map(e => (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", borderRadius: 8, background: "#f8f7f4" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: ACCENT, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.83rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.email}</span>
                    <span style={{ fontSize: "0.72rem", color: "#a09b94", flexShrink: 0 }}>{formatDate(e.created_at)} {formatTime(e.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alle Nutzer */}
        <div style={{ background: "#ffffff", border: "1.5px solid #e8e4dd", borderRadius: 16, padding: "1.5rem" }}>
          <div style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: "1.25rem" }}>Alle Nutzer ({stats.allUsers.length})</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid #e8e4dd" }}>
                  {["E-Mail", "Aktuelle Seite", "Event", "Zuletzt aktiv", "Eingeloggt seit"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "#a09b94", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.allUsers.map((u, i) => {
                  const isActive = (Date.now() - new Date(u.last_seen).getTime()) < 10 * 60 * 1000;
                  return (
                    <tr key={u.user_id} style={{ borderBottom: i < stats.allUsers.length - 1 ? "1px solid #f1f0ee" : "none" }}>
                      <td style={{ padding: "0.65rem 0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {isActive && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />}
                        <span style={{ fontWeight: 500 }}>{u.email}</span>
                      </td>
                      <td style={{ padding: "0.65rem 0.75rem" }}>
                        <span style={{ background: `${ACCENT}15`, color: ACCENT, borderRadius: 6, padding: "0.2rem 0.55rem", fontWeight: 600, fontSize: "0.78rem" }}>
                          {PAGE_LABELS[u.current_page] || u.current_page}
                        </span>
                      </td>
                      <td style={{ padding: "0.65rem 0.75rem", color: "#6b6560" }}>{u.current_event || "—"}</td>
                      <td style={{ padding: "0.65rem 0.75rem", color: "#6b6560", whiteSpace: "nowrap" }}>{timeAgo(u.last_seen)}</td>
                      <td style={{ padding: "0.65rem 0.75rem", color: "#6b6560", whiteSpace: "nowrap" }}>{formatDate(u.logged_in_at)} {formatTime(u.logged_in_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
