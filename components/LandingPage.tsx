"use client";
import { useState } from "react";
import Link from "next/link";
import { Zap, CalendarDays, BarChart2, BookUser, Eye, FileText, Calendar, Check, Package, Settings } from "lucide-react";

const ACCENT = "#07929B";

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div
      style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", background: "#f8f7f4", color: "#1a1814" }}
    >
      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(248,247,244,0.96)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid #e8e4dd",
      }}>
        {/* Haupt-Zeile */}
        <div style={{ padding: "0 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
            <div style={{ width: 32, height: 32, background: ACCENT, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={16} strokeWidth={1.5} color="#fff" />
            </div>
            <span style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#1a1814" }}>SponsorMatch</span>
          </div>

          {/* Desktop Links — bei < 600px ausgeblendet */}
          <div className="sm-nav-desktop" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <a href="#funktionen" style={{ fontSize: "0.85rem", color: "#6b6560", textDecoration: "none", fontWeight: 500 }}>Funktionen</a>
            <a href="#preise" style={{ fontSize: "0.85rem", color: "#6b6560", textDecoration: "none", fontWeight: 500 }}>Preise</a>
            <Link href="/agb" style={{ fontSize: "0.85rem", color: "#6b6560", textDecoration: "none", fontWeight: 500 }}>AGB</Link>
            <Link href="/app" style={{ fontSize: "0.85rem", background: ACCENT, color: "#fff", padding: "0.45rem 1.1rem", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>Anmelden</Link>
          </div>

          {/* Mobile: Anmelden-Button + Hamburger */}
          <div className="sm-nav-mobile" style={{ display: "none", alignItems: "center", gap: "0.65rem" }}>
            <Link href="/app" style={{ fontSize: "0.82rem", background: ACCENT, color: "#fff", padding: "0.4rem 0.9rem", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>Anmelden</Link>
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0.35rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}
            >
              {menuOpen ? (
                // X Icon
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1814" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              ) : (
                // Hamburger Icon
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1814" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown-Menü */}
        {menuOpen && (
          <div style={{ borderTop: "1px solid #e8e4dd", padding: "1rem 1.25rem 1.25rem", display: "flex", flexDirection: "column", gap: "0" }}>
            {[
              { label: "Funktionen", href: "#funktionen" },
              { label: "Preise", href: "#preise" },
              { label: "AGB", href: "/agb" },
              { label: "Impressum", href: "/impressum" },
              { label: "Datenschutz", href: "/datenschutz" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                style={{ display: "block", padding: "0.8rem 0", fontSize: "1rem", fontWeight: 500, color: "#1a1814", textDecoration: "none", borderBottom: "1px solid #f1f0ee" }}
              >
                {label}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "7rem 1.5rem 5rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            background: `${ACCENT}15`,
            border: `1px solid ${ACCENT}44`,
            color: ACCENT,
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            padding: "0.3rem 0.85rem",
            borderRadius: 99,
            marginBottom: "1.75rem",
          }}
        >
          <Zap size={11} strokeWidth={2} />
          FÜR EVENTVERANSTALTER
        </div>
        <h1
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(2.4rem, 6vw, 3.6rem)",
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
            color: "#1a1814",
            marginBottom: "1.25rem",
          }}
        >
          Sponsoring-Akquise.
          <br />
          <span style={{ color: ACCENT }}>Professionell. Effizient.</span>
        </h1>
        <p
          style={{
            fontSize: "1.05rem",
            color: "#6b6560",
            lineHeight: 1.7,
            maxWidth: 540,
            margin: "0 auto 2.5rem",
          }}
        >
          SponsorMatch hilft Eventveranstaltern, Sponsoren systematisch zu finden, anzusprechen und zu gewinnen —
          mit einer intuitiven Pipeline, digitalen Sponsorenvereinbarungen und globaler Kontaktdatenbank.
        </p>
        <div style={{ display: "flex", gap: "0.85rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/app"
            style={{
              background: ACCENT,
              color: "#fff",
              padding: "0.85rem 2rem",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "0.95rem",
              display: "inline-block",
            }}
          >
            Kostenlos starten →
          </Link>
          <a
            href="#features"
            style={{
              background: "#ffffff",
              color: "#1a1814",
              padding: "0.85rem 2rem",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              border: "1.5px solid #e8e4dd",
              display: "inline-block",
            }}
          >
            Mehr erfahren
          </a>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ background: "#ffffff", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
              fontWeight: 700,
              textAlign: "center",
              letterSpacing: "-0.02em",
              marginBottom: "0.75rem",
            }}
          >
            Alles, was du für erfolgreiche Sponsoring-Akquise brauchst
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "#6b6560",
              fontSize: "0.95rem",
              marginBottom: "3.5rem",
              maxWidth: 480,
              margin: "0 auto 3.5rem",
            }}
          >
            Von der ersten Idee bis zum unterschriebenen Vertrag — SponsorMatch begleitet dich durch jeden Schritt.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {[
              {
                Icon: CalendarDays,
                title: "Event-Verwaltung",
                desc: "Mehrere Events gleichzeitig verwalten. Beschreibungen, Banner-Bilder, Mehrwert-Argumente und Vorschau-Seite für Sponsoren — alles an einem Ort.",
              },
              {
                Icon: BarChart2,
                title: "Sponsoren-Pipeline",
                desc: "Von Entwurf bis Bestätigt — verfolge jeden Kontakt mit Status-Tracking, Notizen, Telefonaten und Terminen.",
              },
              {
                Icon: BookUser,
                title: "Kontaktdatenbank",
                desc: "Alle Sponsorenkontakte zentral gespeichert. Mit Event-Historie und Präferenz-Analyse — du weißt immer, wer schon gesponsert hat.",
              },
              {
                Icon: Eye,
                title: "Sponsor-Vorschau",
                desc: "Professionelle Angebotsseite für deine Sponsoren. Pakete interaktiv auswählen und direkt Interesse signalisieren.",
              },
              {
                Icon: Calendar,
                title: "Kalender & Termine",
                desc: "Alle Sponsoring-Termine im Überblick. Monats- und Listenansicht, Terminverwaltung und ICS-Export für Outlook, Apple & Google Kalender.",
              },
              {
                Icon: FileText,
                title: "Sponsorenvereinbarung",
                desc: "Rechtssichere Kooperationsvereinbarungen direkt in der App — mit Steueraufschlüsselung, Leistungscheckliste, PDF-Upload und Foto-Dokumentation.",
                pro: true,
                proLabel: "MAX",
              },
            ].map(({ Icon, title, desc, pro, proLabel }) => (
              <div
                key={title}
                style={{
                  background: "#f8f7f4",
                  border: "1.5px solid #e8e4dd",
                  borderRadius: 16,
                  padding: "1.75rem 1.5rem",
                  position: "relative",
                }}
              >
                {pro && (
                  <span
                    style={{
                      position: "absolute",
                      top: "1rem",
                      right: "1rem",
                      background: ACCENT,
                      color: "#fff",
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      padding: "0.15rem 0.5rem",
                      borderRadius: 99,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {proLabel ?? "PRO"}
                  </span>
                )}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    background: `${ACCENT}15`,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1.1rem",
                  }}
                >
                  <Icon size={22} strokeWidth={1.5} color={ACCENT} />
                </div>
                <div
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontWeight: 700,
                    fontSize: "1rem",
                    marginBottom: "0.5rem",
                    color: "#1a1814",
                  }}
                >
                  {title}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#6b6560", lineHeight: 1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WIE ES FUNKTIONIERT ── */}
      <section style={{ background: "#ffffff", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
              fontWeight: 700,
              textAlign: "center",
              letterSpacing: "-0.02em",
              marginBottom: "0.75rem",
              color: "#1a1814",
            }}
          >
            In 5 Schritten zum Sponsoring-Erfolg
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "#6b6560",
              fontSize: "0.95rem",
              maxWidth: 520,
              margin: "0 auto 4.5rem",
              lineHeight: 1.7,
            }}
          >
            Von der ersten Idee bis zum unterschriebenen Vertrag — so begleitet dich SponsorMatch.
          </p>

          {/* Step 1: Text links, Mockup rechts */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "3rem",
              alignItems: "center",
              marginBottom: "4rem",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: ACCENT,
                  lineHeight: 1,
                  marginBottom: "0.75rem",
                  letterSpacing: "-0.03em",
                }}
              >
                01
              </div>
              <div
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: "#1a1814",
                  marginBottom: "0.75rem",
                }}
              >
                Event anlegen
              </div>
              <p style={{ fontSize: "0.9rem", color: "#6b6560", lineHeight: 1.75, margin: 0 }}>
                Erstelle dein Event mit allen wichtigen Details: Name, Datum, Ort, Zielgruppe und Beschreibung. Lade
                ein Banner-Bild hoch und definiere deine Mehrwert-Argumente. Mit Event-Templates kannst du bewährte
                Strukturen wiederverwenden.
              </p>
            </div>
            {/* Mockup Step 1 */}
            <div
              style={{
                background: "#ffffff",
                border: "1.5px solid #e8e4dd",
                borderRadius: 16,
                padding: "1.25rem",
                boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                overflow: "hidden",
                minWidth: 0,
              }}
            >
              {/* Header */}
              <div style={{ marginBottom: "0.85rem" }}>
                <div
                  style={{
                    display: "inline-block",
                    background: "#f1f0ee",
                    color: "#6b6560",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    padding: "0.2rem 0.6rem",
                    borderRadius: 99,
                    marginBottom: "0.5rem",
                  }}
                >
                  MEIN EVENT
                </div>
                <div
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "#1a1814",
                    marginBottom: "0.2rem",
                  }}
                >
                  Frühlingsball Wien 2025
                </div>
                <div style={{ fontSize: "0.72rem", color: "#6b6560" }}>15. März 2025 · Rathaus Wien</div>
              </div>
              {/* Stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {[
                  { label: "Bestätigt", value: "€12.000", color: "#16a34a" },
                  { label: "Pipeline", value: "€28.500", color: ACCENT },
                  { label: "Aktive Leads", value: "5", color: "#2563eb" },
                  { label: "Conversion", value: "43%", color: "#9333ea" },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    style={{
                      background: "#f8f7f4",
                      borderRadius: 12,
                      padding: "0.75rem",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: color,
                        borderRadius: "12px 12px 0 0",
                      }}
                    />
                    <div style={{ fontSize: "0.62rem", color: "#6b6560", marginBottom: "0.25rem", marginTop: "0.1rem" }}>
                      {label}
                    </div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1a1814" }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2: Mockup links, Text rechts */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "3rem",
              alignItems: "center",
              marginBottom: "4rem",
            }}
          >
            {/* Mockup Step 2 */}
            <div
              style={{
                background: "#ffffff",
                border: "1.5px solid #e8e4dd",
                borderRadius: 16,
                padding: "1.25rem",
                boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                overflow: "hidden",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: "#6b6560",
                  letterSpacing: "0.08em",
                  marginBottom: "0.75rem",
                }}
              >
                SPONSORING-PAKETE
              </div>
              {[
                { name: "Gold-Partner", price: "€8.000", slots: "2 Slots", accent: true },
                { name: "Silber-Partner", price: "€4.500", slots: "3 Slots", accent: false },
                { name: "Bronze-Partner", price: "€2.000", slots: "5 Slots", accent: false },
              ].map(({ name, price, slots, accent }) => (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.65rem 0.85rem",
                    borderRadius: 10,
                    marginBottom: "0.5rem",
                    border: accent ? `1.5px solid ${ACCENT}` : "1.5px solid #e8e4dd",
                    background: accent ? `${ACCENT}08` : "#ffffff",
                    position: "relative",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#1a1814" }}>{name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {accent && (
                      <span
                        style={{
                          background: ACCENT,
                          color: "#fff",
                          fontSize: "0.55rem",
                          fontWeight: 800,
                          padding: "0.15rem 0.45rem",
                          borderRadius: 99,
                          letterSpacing: "0.06em",
                        }}
                      >
                        EMPFOHLEN
                      </span>
                    )}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1a1814" }}>{price}</div>
                      <div style={{ fontSize: "0.62rem", color: "#6b6560" }}>{slots}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: ACCENT,
                  lineHeight: 1,
                  marginBottom: "0.75rem",
                  letterSpacing: "-0.03em",
                }}
              >
                02
              </div>
              <div
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: "#1a1814",
                  marginBottom: "0.75rem",
                }}
              >
                Sponsoring-Pakete definieren
              </div>
              <p style={{ fontSize: "0.9rem", color: "#6b6560", lineHeight: 1.75, margin: 0 }}>
                Erstelle bis zu 3 Pakete (Free) oder unbegrenzt viele (Pro/Max) mit individuellen Preisen, Leistungen
                und verfügbaren Slots. Markiere das attraktivste Paket als "Empfohlen". Jedes Paket kann für einzelne
                Sponsoren individuell angepasst werden.
              </p>
            </div>
          </div>

          {/* Step 3: Text links, Mockup rechts */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "3rem",
              alignItems: "center",
              marginBottom: "4rem",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: ACCENT,
                  lineHeight: 1,
                  marginBottom: "0.75rem",
                  letterSpacing: "-0.03em",
                }}
              >
                03
              </div>
              <div
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: "#1a1814",
                  marginBottom: "0.75rem",
                }}
              >
                Sponsoren in die Pipeline aufnehmen
              </div>
              <p style={{ fontSize: "0.9rem", color: "#6b6560", lineHeight: 1.75, margin: 0 }}>
                Füge potenzielle Sponsoren aus deiner globalen Kontaktdatenbank hinzu oder lege neue Kontakte an.
                Verfolge jeden Kontakt durch den Status-Flow: Entwurf → Angeschrieben → In Verhandlung → Bestätigt.
                Halte Notizen, Telefonate und Termine direkt beim Sponsor fest.
              </p>
            </div>
            {/* Mockup Step 3 */}
            <div
              style={{
                background: "#ffffff",
                border: "1.5px solid #e8e4dd",
                borderRadius: 16,
                padding: "1.25rem",
                boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                overflow: "hidden",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: "#6b6560",
                  letterSpacing: "0.08em",
                  marginBottom: "0.75rem",
                }}
              >
                PIPELINE
              </div>
              {[
                { name: "Red Bull GmbH", paket: "Gold", status: "BESTÄTIGT", bg: "#dcfce7", col: "#16a34a" },
                { name: "Raiffeisen Bank", paket: "Silber", status: "VERHANDLUNG", bg: `${ACCENT}20`, col: ACCENT },
                { name: "ORF", paket: "Gold", status: "ANGESCHRIEBEN", bg: "#dbeafe", col: "#2563eb" },
                { name: "Wien Energie", paket: "Bronze", status: "ENTWURF", bg: "#f1f0ee", col: "#6b6560" },
              ].map(({ name, paket, status, bg, col }) => (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.6rem 0.75rem",
                    borderRadius: 8,
                    marginBottom: "0.4rem",
                    background: "#f8f7f4",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1a1814" }}>{name}</div>
                    <div style={{ fontSize: "0.62rem", color: "#6b6560" }}>{paket}-Paket</div>
                  </div>
                  <span
                    style={{
                      background: bg,
                      color: col,
                      fontSize: "0.58rem",
                      fontWeight: 700,
                      padding: "0.2rem 0.55rem",
                      borderRadius: 99,
                      letterSpacing: "0.05em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Step 4: Mockup links, Text rechts */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "3rem",
              alignItems: "center",
              marginBottom: "4rem",
            }}
          >
            {/* Mockup Step 4 */}
            <div
              style={{
                background: "#ffffff",
                border: "1.5px solid #e8e4dd",
                borderRadius: 16,
                padding: "1.25rem",
                boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                overflow: "hidden",
                minWidth: 0,
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "0.85rem" }}>
                <div
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#1a1814",
                    marginBottom: "0.2rem",
                  }}
                >
                  Frühlingsball Wien 2025
                </div>
                <div style={{ fontSize: "0.65rem", color: "#6b6560" }}>Wähle dein Sponsoring-Paket</div>
              </div>
              <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.85rem" }}>
                {[
                  { name: "Bronze", price: "€2.000", highlight: false },
                  { name: "Gold", price: "€8.000", highlight: true },
                  { name: "Silber", price: "€4.500", highlight: false },
                ].map(({ name, price, highlight }) => (
                  <div
                    key={name}
                    style={{
                      flex: 1,
                      border: highlight ? `2px solid ${ACCENT}` : "1.5px solid #e8e4dd",
                      borderRadius: 10,
                      padding: "0.6rem 0.4rem",
                      textAlign: "center",
                      position: "relative",
                      background: highlight ? `${ACCENT}06` : "#ffffff",
                    }}
                  >
                    {highlight && (
                      <div
                        style={{
                          position: "absolute",
                          top: -8,
                          left: "50%",
                          transform: "translateX(-50%)",
                          background: ACCENT,
                          color: "#fff",
                          fontSize: "0.5rem",
                          fontWeight: 800,
                          padding: "0.1rem 0.4rem",
                          borderRadius: 99,
                          whiteSpace: "nowrap",
                          letterSpacing: "0.05em",
                        }}
                      >
                        EMPFOHLEN
                      </div>
                    )}
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#1a1814", marginBottom: "0.15rem" }}>
                      {name}
                    </div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: highlight ? ACCENT : "#6b6560" }}>
                      {price}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  background: ACCENT,
                  color: "#fff",
                  textAlign: "center",
                  padding: "0.6rem",
                  borderRadius: 8,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                Interesse signalisieren →
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: ACCENT,
                  lineHeight: 1,
                  marginBottom: "0.75rem",
                  letterSpacing: "-0.03em",
                }}
              >
                04
              </div>
              <div
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: "#1a1814",
                  marginBottom: "0.75rem",
                }}
              >
                Angebot präsentieren
              </div>
              <p style={{ fontSize: "0.9rem", color: "#6b6560", lineHeight: 1.75, margin: 0 }}>
                Mit der Sponsor-Vorschau erhält jeder potenzielle Sponsor eine professionelle Angebotsseite mit
                deinen Paketen. Der Sponsor kann interaktiv ein Paket auswählen und sein Interesse direkt per
                E-Mail signalisieren — ohne Login.
              </p>
            </div>
          </div>

          {/* Step 5: Text links, Mockup rechts */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "3rem",
              alignItems: "center",
              marginBottom: "4rem",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: ACCENT,
                  lineHeight: 1,
                  marginBottom: "0.75rem",
                  letterSpacing: "-0.03em",
                }}
              >
                05
              </div>
              <div
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: "#1a1814",
                  marginBottom: "0.75rem",
                }}
              >
                Vereinbarung abschließen
              </div>
              <p style={{ fontSize: "0.9rem", color: "#6b6560", lineHeight: 1.75, margin: 0 }}>
                Sobald sich ein Sponsor für ein Paket entscheidet, erstellt SponsorMatch automatisch eine
                rechtssichere Kooperationsvereinbarung. Mit Steueraufschlüsselung, Leistungscheckliste und der
                Möglichkeit, die unterzeichnete Vereinbarung als PDF hochzuladen.
              </p>
            </div>
            {/* Mockup Step 5 */}
            <div
              style={{
                background: "#ffffff",
                border: "1.5px solid #e8e4dd",
                borderRadius: 16,
                padding: "1.25rem",
                boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                overflow: "hidden",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#1a1814",
                  marginBottom: "0.85rem",
                  paddingBottom: "0.75rem",
                  borderBottom: "1px solid #e8e4dd",
                }}
              >
                Kooperationsvereinbarung
              </div>
              {/* Parteien */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                {["Veranstalter", "Sponsor"].map((party) => (
                  <div
                    key={party}
                    style={{
                      flex: 1,
                      background: "#f8f7f4",
                      borderRadius: 8,
                      padding: "0.55rem 0.65rem",
                    }}
                  >
                    <div style={{ fontSize: "0.58rem", fontWeight: 700, color: ACCENT, marginBottom: "0.25rem" }}>
                      {party.toUpperCase()}
                    </div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "#1a1814", marginBottom: "0.1rem" }}>
                      {party === "Veranstalter" ? "Event GmbH" : "Red Bull GmbH"}
                    </div>
                    <div style={{ fontSize: "0.58rem", color: "#6b6560", lineHeight: 1.4 }}>
                      {party === "Veranstalter" ? "Musterstraße 1, Wien" : "Am Brunnen 1, Salzburg"}
                    </div>
                  </div>
                ))}
              </div>
              {/* Paket-Box */}
              <div
                style={{
                  background: `${ACCENT}0d`,
                  border: `1px solid ${ACCENT}33`,
                  borderRadius: 8,
                  padding: "0.6rem 0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1a1814", marginBottom: "0.4rem" }}>
                  Gold-Partner · €8.000
                </div>
                {["Logo auf allen Materialien", "VIP-Tickets (4 Stk.)", "Redner-Slot 10 Min."].map((item) => (
                  <div
                    key={item}
                    style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: ACCENT,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                        <path d="M1 3.5l1.5 1.5 3-3" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span style={{ fontSize: "0.62rem", color: "#1a1814" }}>{item}</span>
                  </div>
                ))}
              </div>
              {/* Unterschriften */}
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.6rem" }}>
                {["Veranstalter", "Sponsor"].map((party) => (
                  <div key={party} style={{ flex: 1 }}>
                    <div style={{ borderBottom: "1px solid #1a1814", height: 20, marginBottom: "0.25rem" }} />
                    <div style={{ fontSize: "0.58rem", color: "#6b6560", textAlign: "center" }}>{party}</div>
                  </div>
                ))}
              </div>
              {/* PDF-Button */}
              <div
                style={{
                  border: `1px solid ${ACCENT}`,
                  color: ACCENT,
                  textAlign: "center",
                  padding: "0.4rem",
                  borderRadius: 6,
                  fontSize: "0.65rem",
                  fontWeight: 600,
                }}
              >
                PDF hochladen
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE DEEP-DIVE ── */}
      <section id="funktionen" style={{ background: "#f8f7f4", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
              fontWeight: 700,
              textAlign: "center",
              letterSpacing: "-0.02em",
              marginBottom: "0.75rem",
              color: "#1a1814",
            }}
          >
            Alles im Detail erklärt
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "#6b6560",
              fontSize: "0.95rem",
              maxWidth: 480,
              margin: "0 auto 3.5rem",
              lineHeight: 1.7,
            }}
          >
            Die wichtigsten Funktionen auf einen Blick.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {[
              {
                Icon: CalendarDays,
                title: "Event-Verwaltung",
                bullets: [
                  "Name, Datum, Ort, Banner-Bild",
                  "Mehrwert-Argumente für Pitches",
                  "Logo, Akzentfarbe, Steuersatz",
                  "Event-Templates",
                ],
              },
              {
                Icon: Package,
                title: "Sponsoring-Pakete",
                bullets: [
                  "Preis, Slots, Leistungsliste",
                  "\"Empfohlen\"-Badge",
                  "Individuelle Anpassung pro Sponsor",
                  "Individueller Preis pro Sponsor",
                ],
              },
              {
                Icon: BarChart2,
                title: "Sponsoren-Pipeline",
                bullets: [
                  "Status-Flow: Entwurf → Bestätigt",
                  "Notizen, Telefonate, Termine",
                  "Sponsoring-Wert & Paket-Zuweisung",
                  "Lernende Präferenz-Analyse (Max)",
                ],
              },
              {
                Icon: BookUser,
                title: "Kontaktdatenbank",
                bullets: [
                  "Firma, Name, E-Mail, Telefon",
                  "Event-Historie pro Kontakt",
                  "Direkt in Pipeline übernehmen",
                  "Zusagerate & Präferenzen (Max)",
                ],
              },
              {
                Icon: Eye,
                title: "Sponsor-Vorschau",
                bullets: [
                  "Professionelle Angebotsseite",
                  "Pakete interaktiv auswählbar",
                  "Interesse per E-Mail signalisieren",
                  "Kein Login für Sponsoren nötig",
                ],
              },
              {
                Icon: Calendar,
                title: "Kalender & Termine",
                bullets: [
                  "Monats- und Listenansicht",
                  "Termine aus Pipeline automatisch",
                  "ICS-Export (Apple, Google, Outlook)",
                  "Termine als erledigt markieren",
                ],
              },
              {
                Icon: FileText,
                title: "Sponsorenvereinbarung",
                bullets: [
                  "Automatisch befüllt, druckfertig",
                  "Steueraufschlüsselung (MwSt/Werbeabgabe)",
                  "PDF-Upload & Leistungs-Checkliste",
                  "Foto-Dokumentation nach dem Event",
                ],
                badge: "MAX",
              },
              {
                Icon: Settings,
                title: "Branding",
                bullets: [
                  "Logo, Akzentfarbe, Steuersatz",
                  "Veranstalter-Kontaktdaten",
                  "Gilt für App & Vereinbarungen",
                  "",
                ],
              },
            ].map(({ Icon, title, bullets, badge }) => (
              <div
                key={title}
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #e8e4dd",
                  borderRadius: 16,
                  padding: "1.25rem",
                  position: "relative",
                }}
              >
                {badge && (
                  <span
                    style={{
                      position: "absolute",
                      top: "1rem",
                      right: "1rem",
                      background: ACCENT,
                      color: "#fff",
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      padding: "0.15rem 0.5rem",
                      borderRadius: 99,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {badge}
                  </span>
                )}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: `${ACCENT}15`,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "0.75rem",
                  }}
                >
                  <Icon size={18} strokeWidth={1.5} color={ACCENT} />
                </div>
                <div
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontWeight: 700,
                    fontSize: "0.92rem",
                    marginBottom: "0.65rem",
                    color: "#1a1814",
                  }}
                >
                  {title}
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {bullets.map((b) => (
                    b && (
                      <li key={b} style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem" }}>
                        <span
                          style={{
                            flexShrink: 0,
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            background: ACCENT,
                            marginTop: "0.35rem",
                          }}
                        />
                        <span style={{ fontSize: "0.8rem", color: "#1a1814", lineHeight: 1.4 }}>{b}</span>
                      </li>
                    )
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VEREINBARUNG SPOTLIGHT ── */}
      <section id="vereinbarung-workflow" style={{ background: "#ffffff", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: `${ACCENT}15`,
              border: `1px solid ${ACCENT}44`,
              color: ACCENT,
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              padding: "0.3rem 0.75rem",
              borderRadius: 999,
              marginBottom: "1.25rem",
            }}
          >
            MAX FEATURE
          </div>
          <h2
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: "1rem",
              lineHeight: 1.2,
            }}
          >
            Von der Verhandlung zum unterschriebenen Vertrag
          </h2>
          <p style={{ fontSize: "1.05rem", color: "#6b6560", lineHeight: 1.7, maxWidth: 640, margin: "0 auto" }}>
            SponsorMatch führt dich durch den gesamten Vereinbarungsprozess — von der ersten Verhandlung bis zur
            Foto-Dokumentation nach dem Event.
          </p>
        </div>

        {/* 4-Step Workflow */}
        <div
          style={{
            maxWidth: 1080,
            margin: "3rem auto 0",
            position: "relative",
          }}
        >
          {/* Connecting line — desktop */}
          <div
            style={{
              position: "absolute",
              top: 22,
              left: "calc(12.5% + 22px)",
              right: "calc(12.5% + 22px)",
              height: 2,
              background: "#e8e4dd",
              zIndex: 0,
            }}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.5rem",
              position: "relative",
              zIndex: 1,
            }}
          >
            {[
              {
                num: 1,
                title: 'Status "In Verhandlung"',
                desc: 'Sobald du den Pipeline-Status auf "In Verhandlung" setzt, öffnet sich automatisch der Vereinbarungsbereich in der Sponsor-Akte.',
              },
              {
                num: 2,
                title: "Vereinbarung befüllen",
                desc: "Alle Daten werden automatisch aus dem Event und der Sponsor-Akte übernommen. Du ergänzt nur noch Adressen und einen optionalen individuellen Text.",
              },
              {
                num: 3,
                title: "Unterzeichnet & hochgeladen",
                desc: "Drucke die Vereinbarung aus, unterschreibe sie und lade die fertige PDF direkt in SponsorMatch hoch. Der Status springt automatisch auf Bestätigt.",
              },
              {
                num: 4,
                title: "Nach dem Event",
                desc: "Hake die Leistungs-Checkliste ab und lade Fotos der Werbeflächen hoch — als Nachweis für den Sponsor und für deine Unterlagen.",
              },
            ].map((step) => (
              <div key={step.num} style={{ textAlign: "center", padding: "0 0.5rem" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: ACCENT,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem",
                    position: "relative",
                    zIndex: 2,
                    boxShadow: "0 0 0 4px #fff",
                  }}
                >
                  {step.num}
                </div>
                <p style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: "0.5rem", color: "#1a1814" }}>
                  {step.title}
                </p>
                <p style={{ fontSize: "0.83rem", color: "#6b6560", lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 2-Column Detail Layout */}
        <div
          style={{
            maxWidth: 1080,
            margin: "3.5rem auto 0",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "3rem",
            alignItems: "start",
          }}
        >
          {/* Left — Text blocks */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div>
              <p
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  marginBottom: "0.5rem",
                  color: "#1a1814",
                }}
              >
                Automatisch befüllt — kein Copy-Paste nötig
              </p>
              <p style={{ fontSize: "0.9rem", color: "#6b6560", lineHeight: 1.7 }}>
                SponsorMatch zieht alle relevanten Daten automatisch aus dem Event und der Sponsor-Akte: Veranstaltername,
                Datum, Ort, Paketname, Preis mit Steueraufschlüsselung, Leistungsliste und beide Parteien mit
                vollständiger Adresse. Du sparst dir mühsames Ausfüllen von Word-Vorlagen.
              </p>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  marginBottom: "0.5rem",
                  color: "#1a1814",
                }}
              >
                Rechtskonforme Steueraufschlüsselung
              </p>
              <p style={{ fontSize: "0.9rem", color: "#6b6560", lineHeight: 1.7 }}>
                Je nach deinem hinterlegten Steuersatz (MwSt. 10%, MwSt. 20%, Werbeabgabe 5% oder kombiniert) berechnet
                SponsorMatch automatisch Netto-, Steuer- und Bruttobetrag — transparent für beide Vertragsparteien.
              </p>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  marginBottom: "0.5rem",
                  color: "#1a1814",
                }}
              >
                Leistungs-Checkliste &amp; Foto-Nachweis
              </p>
              <p style={{ fontSize: "0.9rem", color: "#6b6560", lineHeight: 1.7 }}>
                Nach der Veranstaltung wird aus den vereinbarten Leistungen automatisch eine Checkliste erstellt. Hake ab,
                was du erfüllt hast, und lade Fotos der Werbeflächen direkt in SponsorMatch hoch — als professioneller
                Nachweis für deinen Sponsor und für deine eigene Dokumentation.
              </p>
            </div>
          </div>

          {/* Right — Vereinbarungs-Mockup */}
          <div
            style={{
              background: "#ffffff",
              border: "1.5px solid #e8e4dd",
              borderRadius: 16,
              padding: "1.5rem",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            }}
          >
            {/* Mockup Header */}
            <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", color: "#9ca3af", marginBottom: "0.35rem" }}>
              KOOPERATIONSVEREINBARUNG
            </p>
            <p style={{ fontWeight: 700, fontSize: "1rem", color: "#1a1814", marginBottom: "1rem" }}>
              Frühlingsball Wien 2025
            </p>

            {/* Parties */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "1rem" }}>
              {[
                { role: "Veranstalter", name: "Event GmbH Wien", addr: "Ringstraße 5, 1010 Wien" },
                { role: "Sponsor", name: "Red Bull GmbH", addr: "Am Brunnen 1, 5020 Salzburg" },
              ].map((p) => (
                <div
                  key={p.role}
                  style={{ background: "#f8f7f4", borderRadius: 8, padding: "0.75rem" }}
                >
                  <p style={{ fontSize: "0.65rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "0.2rem" }}>
                    {p.role.toUpperCase()}
                  </p>
                  <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1a1814", marginBottom: "0.1rem" }}>{p.name}</p>
                  <p style={{ fontSize: "0.75rem", color: "#6b6560" }}>{p.addr}</p>
                </div>
              ))}
            </div>

            {/* Package Box */}
            <div
              style={{
                border: `1.5px solid ${ACCENT}`,
                background: `${ACCENT}08`,
                borderRadius: 8,
                padding: "0.85rem",
                marginBottom: "1rem",
              }}
            >
              <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1a1814", marginBottom: "0.6rem" }}>
                Gold-Partner · €8.000 netto
              </p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                <tbody>
                  {[
                    { label: "Werbeabgabe 5%", value: "€400" },
                    { label: "MwSt. 20%", value: "€1.680" },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td style={{ color: "#6b6560", paddingBottom: "0.2rem" }}>{row.label}</td>
                      <td style={{ textAlign: "right", color: "#6b6560", paddingBottom: "0.2rem" }}>{row.value}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: "1px solid #e8e4dd" }}>
                    <td style={{ fontWeight: 700, color: "#1a1814", paddingTop: "0.3rem" }}>Gesamt</td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "#1a1814", paddingTop: "0.3rem" }}>€10.080</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Leistungs-Checkliste */}
            <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", color: "#9ca3af", marginBottom: "0.5rem" }}>
              VEREINBARTE LEISTUNGEN
            </p>
            <div style={{ marginBottom: "1rem" }}>
              {[
                { done: true, label: "Hauptbühnen-Banner (3×1m)" },
                { done: true, label: "Logo auf allen Drucksorten" },
                { done: false, label: "Social Media Erwähnung (3×)" },
                { done: false, label: "VIP-Tische (2 Personen)" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.3rem 0",
                    borderBottom: "1px solid #f0ede8",
                    fontSize: "0.82rem",
                    color: "#1a1814",
                  }}
                >
                  {item.done ? (
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        background: "#22c55e",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Check size={10} strokeWidth={3} color="#fff" />
                    </span>
                  ) : (
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        border: "1.5px solid #d1d5db",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span style={{ color: item.done ? "#1a1814" : "#9ca3af" }}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Fotos */}
            <div style={{ background: "#f8f7f4", borderRadius: 8, padding: "0.75rem", marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em", color: "#9ca3af", marginBottom: "0.5rem" }}>
                FOTOS WERBEFLÄCHEN
              </p>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 48,
                      background: "#e5e7eb",
                      borderRadius: 6,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Unterschriften */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
              {["Veranstalter", "Sponsor"].map((party) => (
                <div key={party}>
                  <div style={{ borderBottom: "1.5px solid #d1d5db", marginBottom: "0.3rem", height: 24 }} />
                  <p style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{party}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── KONTAKTDATENBANK SPOTLIGHT ── */}
      <section style={{ background: "#f8f7f4", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: "1rem",
              lineHeight: 1.2,
            }}
          >
            Dein zentrales Sponsoren-Adressbuch
          </h2>
          <p style={{ fontSize: "1.05rem", color: "#6b6560", lineHeight: 1.7, maxWidth: 600, margin: "0 auto" }}>
            Einmal einpflegen — immer verfügbar. Die Kontaktdatenbank verbindet sich nahtlos mit deiner Pipeline und
            wächst mit jedem Event.
          </p>
        </div>

        {/* 2-Column Layout */}
        <div
          style={{
            maxWidth: 1080,
            margin: "3.5rem auto 0",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "3rem",
            alignItems: "start",
          }}
        >
          {/* Left — Kontaktdatenbank Mockup */}
          <div
            style={{
              background: "#ffffff",
              border: "1.5px solid #e8e4dd",
              borderRadius: 16,
              padding: "1.25rem",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", color: "#9ca3af" }}>
                KONTAKTDATENBANK
              </p>
              <button
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#fff",
                  background: ACCENT,
                  border: "none",
                  borderRadius: 6,
                  padding: "0.25rem 0.6rem",
                  cursor: "default",
                }}
              >
                + Kontakt
              </button>
            </div>

            {/* Search simulation */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#f8f7f4",
                border: "1px solid #e8e4dd",
                borderRadius: 8,
                padding: "0.45rem 0.75rem",
                marginBottom: "0.85rem",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>Firma oder Name suchen...</span>
            </div>

            {/* Contact entries */}
            {[
              { firm: "Red Bull GmbH", person: "Max Mustermann · max@redbull.com", badge: "3 Events", highlight: true },
              { firm: "Raiffeisen Bank AG", person: "Anna Bauer · a.bauer@raiffeisen.at", badge: "1 Event", highlight: false },
              { firm: "Wien Energie GmbH", person: "Klaus Hofer · k.hofer@wienenergie.at", badge: "2 Events", highlight: false },
              { firm: "ORF", person: "Lea Wagner · l.wagner@orf.at", badge: "Neu", highlight: false },
            ].map((contact) => (
              <div
                key={contact.firm}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.7rem 0.75rem",
                  borderRadius: 8,
                  marginBottom: "0.4rem",
                  background: contact.highlight ? `${ACCENT}10` : "#f8f7f4",
                  border: contact.highlight ? `1px solid ${ACCENT}33` : "1px solid transparent",
                }}
              >
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1a1814", marginBottom: "0.1rem" }}>
                    {contact.firm}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "#6b6560" }}>{contact.person}</p>
                </div>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    background: `${ACCENT}18`,
                    color: ACCENT,
                    padding: "0.2rem 0.55rem",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    marginLeft: "0.75rem",
                  }}
                >
                  {contact.badge}
                </span>
              </div>
            ))}

            {/* Expanded contact history */}
            <div
              style={{
                marginTop: "0.75rem",
                border: `1.5px solid ${ACCENT}`,
                borderRadius: 10,
                padding: "0.85rem",
                background: `${ACCENT}06`,
              }}
            >
              <p style={{ fontSize: "0.72rem", fontWeight: 700, color: ACCENT, marginBottom: "0.6rem", letterSpacing: "0.04em" }}>
                Red Bull GmbH — Event-Historie
              </p>
              {[
                { event: "Frühlingsball Wien 2025", paket: "Gold-Partner", betrag: "€8.000" },
                { event: "Sommerfest 2024", paket: "Silber-Partner", betrag: "€4.500" },
                { event: "Wintergala 2023", paket: "Bronze-Partner", betrag: "€2.000" },
              ].map((entry) => (
                <div
                  key={entry.event}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.35rem 0",
                    borderBottom: "1px solid #f0ede8",
                    fontSize: "0.78rem",
                  }}
                >
                  <div>
                    <span style={{ color: "#1a1814", fontWeight: 500 }}>{entry.event}</span>
                    <span style={{ color: "#9ca3af", marginLeft: "0.4rem" }}>· {entry.paket}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ color: "#1a1814", fontWeight: 600 }}>{entry.betrag}</span>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        background: "#dcfce7",
                        color: "#16a34a",
                        padding: "0.15rem 0.45rem",
                        borderRadius: 999,
                        fontWeight: 700,
                      }}
                    >
                      ✓ Bestätigt
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Text blocks */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div>
              <p
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  marginBottom: "0.5rem",
                  color: "#1a1814",
                }}
              >
                Einmal anlegen — überall verfügbar
              </p>
              <p style={{ fontSize: "0.9rem", color: "#6b6560", lineHeight: 1.7 }}>
                Lege Sponsorenkontakte mit Firmenname, Ansprechpartner, E-Mail und Telefonnummer einmalig in der
                Kontaktdatenbank an. Diese stehen dir dann in allen deinen Events zur Verfügung — du musst dieselben
                Kontaktdaten nie zweimal eingeben.
              </p>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  marginBottom: "0.5rem",
                  color: "#1a1814",
                }}
              >
                Direkt aus der Datenbank in die Pipeline
              </p>
              <p style={{ fontSize: "0.9rem", color: "#6b6560", lineHeight: 1.7 }}>
                Wenn du einen neuen Sponsor zur Pipeline hinzufügst, greifst du direkt auf deine Kontaktdatenbank zu.
                Wähle einen bestehenden Kontakt aus — alle Daten werden automatisch übernommen. So behältst du die volle
                Kontrolle ohne doppelte Datenpflege.
              </p>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  marginBottom: "0.5rem",
                  color: "#1a1814",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                Lernende Datenbank — wer sagt wirklich zu?
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    background: `${ACCENT}18`,
                    color: ACCENT,
                    padding: "0.2rem 0.5rem",
                    borderRadius: 999,
                    letterSpacing: "0.06em",
                  }}
                >
                  MAX
                </span>
              </p>
              <p style={{ fontSize: "0.9rem", color: "#6b6560", lineHeight: 1.7 }}>
                Mit dem Max-Tarif analysiert SponsorMatch automatisch, welche Sponsoren bei welchen Event-Typen und
                Paketgrößen zugesagt haben. Die Zusagerate pro Kontakt hilft dir, deine Prioritäten bei der Akquise
                datenbasiert zu setzen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PREISE ── */}
      <section id="preise" style={{ padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
              fontWeight: 700,
              textAlign: "center",
              letterSpacing: "-0.02em",
              marginBottom: "0.75rem",
            }}
          >
            Transparente Preise
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "#6b6560",
              fontSize: "0.95rem",
              maxWidth: 420,
              margin: "0 auto 3.5rem",
            }}
          >
            Starte kostenlos und skaliere, wenn du bereit bist.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
              alignItems: "start",
            }}
          >
            {/* FREE */}
            <PricingCard
              tier="Free"
              price="Kostenlos"
              desc="Für den Einstieg — kein Kreditkarte nötig."
              features={[
                "1 aktives Event",
                "Max. 3 Sponsoring-Pakete",
                "Basis-Pipeline",
                "Kontaktdatenbank",
                "Sponsor-Vorschau",
              ]}
              missing={["KI Sponsor-Finder", "E-Mail-Vorlagen", "Sponsorenvereinbarung"]}
              cta="Jetzt starten"
              href="/app"
              highlighted={false}
            />

            {/* PRO */}
            <PricingCard
              tier="Pro"
              price="€79"
              priceNote="/Monat"
              desc="Für aktive Veranstalter, die professionell skalieren wollen."
              features={[
                "Unbegrenzte Events & Pakete",
                "KI Sponsor-Finder",
                "E-Mail-Vorlagen & Pitch-Editor",
                "Kalender & ICS-Export",
                "Event-Templates",
                "Alle Free-Features",
              ]}
              cta="Pro starten"
              href="/app"
              highlighted={true}
            />

            {/* MAX */}
            <PricingCard
              tier="Max"
              price="€149"
              priceNote="/Monat"
              desc="Für Agenturen und Teams mit höchsten Ansprüchen."
              features={[
                "Alles aus Pro",
                "Sponsorenvereinbarungen (PDF)",
                "Steueraufschlüsselung",
                "Leistungs-Checkliste",
                "Foto-Dokumentation",
                "Lernende Pipeline-Datenbank",
                "Prioritäts-Support",
              ]}
              cta="Kontakt aufnehmen"
              href="mailto:hallo@sponsormatch.at"
              highlighted={false}
            />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          borderTop: "1px solid #e8e4dd",
          background: "#ffffff",
          padding: "2.5rem 1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
            <div
              style={{
                width: 28,
                height: 28,
                background: ACCENT,
                borderRadius: 7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Zap size={14} strokeWidth={1.5} color="#fff" />
            </div>
            <span style={{ fontSize: "0.95rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#1a1814" }}>
              SponsorMatch
            </span>
          </div>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <Link href="/agb" style={{ fontSize: "0.82rem", color: "#6b6560", textDecoration: "none" }}>
              AGB
            </Link>
            <Link href="/impressum" style={{ fontSize: "0.82rem", color: "#6b6560", textDecoration: "none" }}>
              Impressum
            </Link>
            <Link href="/datenschutz" style={{ fontSize: "0.82rem", color: "#6b6560", textDecoration: "none" }}>
              Datenschutz
            </Link>
            <Link href="/app" style={{ fontSize: "0.82rem", color: "#6b6560", textDecoration: "none" }}>
              App
            </Link>
          </div>
          <div style={{ fontSize: "0.78rem", color: "#a09b94" }}>
            © {new Date().getFullYear()} SponsorMatch. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── PRICING CARD ──────────────────────────────────────────────
function PricingCard({
  tier,
  price,
  priceNote,
  desc,
  features,
  missing,
  cta,
  href,
  highlighted,
}: {
  tier: string;
  price: string;
  priceNote?: string;
  desc: string;
  features: string[];
  missing?: string[];
  cta: string;
  href: string;
  highlighted: boolean;
}) {
  return (
    <div
      style={{
        background: highlighted ? "#1a1814" : "#ffffff",
        border: highlighted ? `2px solid ${ACCENT}` : "1.5px solid #e8e4dd",
        borderRadius: 20,
        padding: "2rem 1.75rem",
        position: "relative",
        boxShadow: highlighted ? "0 12px 40px rgba(10,198,176,0.18)" : "none",
      }}
    >
      {highlighted && (
        <div
          style={{
            position: "absolute",
            top: "-13px",
            left: "50%",
            transform: "translateX(-50%)",
            background: ACCENT,
            color: "#fff",
            fontSize: "0.65rem",
            fontWeight: 800,
            padding: "0.25rem 0.9rem",
            borderRadius: 99,
            letterSpacing: "0.08em",
            whiteSpace: "nowrap",
          }}
        >
          EMPFOHLEN
        </div>
      )}

      <div
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: highlighted ? `${ACCENT}` : "#a09b94",
          marginBottom: "0.5rem",
        }}
      >
        {tier.toUpperCase()}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "0.3rem", marginBottom: "0.5rem" }}>
        <span
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "2rem",
            fontWeight: 700,
            color: highlighted ? "#ffffff" : "#1a1814",
            lineHeight: 1,
          }}
        >
          {price}
        </span>
        {priceNote && (
          <span style={{ fontSize: "0.82rem", color: highlighted ? "#a09b94" : "#6b6560" }}>{priceNote}</span>
        )}
      </div>

      <p
        style={{
          fontSize: "0.82rem",
          color: highlighted ? "#9d9892" : "#6b6560",
          lineHeight: 1.55,
          marginBottom: "1.5rem",
          minHeight: "2.5rem",
        }}
      >
        {desc}
      </p>

      <Link
        href={href}
        style={{
          display: "block",
          textAlign: "center",
          background: highlighted ? ACCENT : "transparent",
          color: highlighted ? "#fff" : ACCENT,
          border: highlighted ? "none" : `1.5px solid ${ACCENT}`,
          padding: "0.75rem 1rem",
          borderRadius: 10,
          textDecoration: "none",
          fontWeight: 700,
          fontSize: "0.88rem",
          marginBottom: "1.75rem",
        }}
      >
        {cta} →
      </Link>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        {features.map((f) => (
          <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.55rem" }}>
            <Check
              size={15}
              strokeWidth={2.5}
              color={highlighted ? ACCENT : "#16a34a"}
              style={{ marginTop: 2, flexShrink: 0 }}
            />
            <span style={{ fontSize: "0.83rem", color: highlighted ? "#d4d0ca" : "#1a1814", lineHeight: 1.45 }}>
              {f}
            </span>
          </div>
        ))}
        {missing &&
          missing.map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.55rem", opacity: 0.45 }}>
              <div
                style={{
                  width: 15,
                  height: 15,
                  borderRadius: "50%",
                  border: "1.5px solid #a09b94",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />
              <span style={{ fontSize: "0.83rem", color: "#6b6560", lineHeight: 1.45 }}>{f}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
