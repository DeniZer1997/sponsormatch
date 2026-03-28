"use client";
import Link from "next/link";
import { Zap } from "lucide-react";

const ACCENT = "#07929B";

export default function ImpressumPage() {
  return (
    <div
      style={{
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        background: "#f8f7f4",
        color: "#1a1814",
        minHeight: "100vh",
      }}
    >
      {/* ── NAV ── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(248,247,244,0.92)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #e8e4dd",
          padding: "0 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 60,
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.55rem", textDecoration: "none", color: "inherit" }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: ACCENT,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={16} strokeWidth={1.5} color="#fff" />
          </div>
          <span style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            SponsorMatch
          </span>
        </Link>
        <Link
          href="/app"
          style={{
            fontSize: "0.85rem",
            background: ACCENT,
            color: "#fff",
            padding: "0.45rem 1.1rem",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          Anmelden
        </Link>
      </nav>

      {/* ── CONTENT ── */}
      <section style={{ maxWidth: 840, margin: "0 auto", padding: "4rem 1.5rem" }}>
        <h1
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "2rem",
            color: "#1a1814",
          }}
        >
          Impressum
        </h1>

        <div style={{ lineHeight: 1.8, fontSize: "0.95rem", color: "#3a3530" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: "1.5rem", marginBottom: "0.75rem" }}>
            Anbieter
          </h2>
          <p>
            <strong>00Z Events — Dennis Lichtenwöhrer</strong>
          </p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: "1.5rem", marginBottom: "0.75rem" }}>
            Kontakt
          </h2>
          <p>
            E-Mail: <a href="mailto:zerozeroz.events@gmail.com" style={{ color: ACCENT, textDecoration: "none" }}>zerozeroz.events@gmail.com</a>
            <br />
            Telefon: <a href="tel:+436601679121" style={{ color: ACCENT, textDecoration: "none" }}>+43 660 1679121</a>
          </p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: "1.5rem", marginBottom: "0.75rem" }}>
            Geschäftsführung
          </h2>
          <p>
            Dennis Lichtenwöhrer
          </p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: "1.5rem", marginBottom: "0.75rem" }}>
            UID-Nummer
          </h2>
          <p>
            Nicht vorhanden
          </p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: "1.5rem", marginBottom: "0.75rem" }}>
            Unternehmensregister
          </h2>
          <p>
            WKO Oberösterreich
          </p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: "1.5rem", marginBottom: "0.75rem" }}>
            Berufsrechtliche Regelungen
          </h2>
          <p>
            Österreichisches E-Commerce-Gesetz (ECG)
            <br />
            Bundesgesetz über den Datenschutz (DSG)
          </p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: "1.5rem", marginBottom: "0.75rem" }}>
            Haftungsausschluss
          </h2>
          <p>
            00Z Events — Dennis Lichtenwöhrer bemüht sich, die auf dieser Website enthaltenen Informationen aktuell, vollständig und
            korrekt zu halten. Für etwaige Fehler oder die Aktualität der Inhalte kann jedoch keine Haftung übernommen
            werden. Dies gilt insbesondere für externe Links von Drittanbietern, auf deren Inhalte keine Kontrolle ausgeübt
            werden kann.
          </p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: "1.5rem", marginBottom: "0.75rem" }}>
            Kontakt für Rechtsfragen
          </h2>
          <p>
            Für Fragen zu diesem Impressum oder allgemein zum Datenschutz wenden Sie sich bitte an:{" "}
            <a href="mailto:zerozeroz.events@gmail.com" style={{ color: ACCENT, textDecoration: "none" }}>zerozeroz.events@gmail.com</a>
          </p>
        </div>

      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          borderTop: "1px solid #e8e4dd",
          background: "#ffffff",
          padding: "2.5rem 1.5rem",
          marginTop: "2rem",
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
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.55rem", textDecoration: "none", color: "inherit" }}>
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
            <span style={{ fontSize: "0.95rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
              SponsorMatch
            </span>
          </Link>
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
