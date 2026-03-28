import Link from "next/link";
import { Zap } from "lucide-react";

export const metadata = {
  title: "Datenschutzerklärung — SponsorMatch",
  description: "Datenschutzerklärung von SponsorMatch gemäß DSGVO",
};

export default function DatenschutzPage() {
  return (
    <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", background: "#f8f7f4", color: "#1a1814", minHeight: "100vh" }}>
      {/* NAV */}
      <nav style={{ borderBottom: "1px solid #e8e4dd", background: "#ffffff", padding: "0 1.5rem", display: "flex", alignItems: "center", height: 60 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.55rem", textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, background: "#07929B", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={16} strokeWidth={1.5} color="#fff" />
          </div>
          <span style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#1a1814" }}>SponsorMatch</span>
        </Link>
      </nav>

      {/* CONTENT */}
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "4rem 1.5rem 6rem" }}>
        <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "clamp(1.8rem, 5vw, 2.6rem)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
          Datenschutzerklärung
        </h1>
        <p style={{ color: "#6b6560", fontSize: "0.88rem", marginBottom: "3rem" }}>Stand: März 2025 · Gemäß DSGVO und österreichischem DSG</p>

        <PrivacySection title="1. Verantwortlicher">
          <p>Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:</p>
          <div style={{ background: "#ffffff", border: "1.5px solid #e8e4dd", borderRadius: 12, padding: "1.25rem 1.5rem", marginTop: "0.75rem" }}>
            <strong>00Z Events — Dennis Lichtenwöhrer</strong><br />
            E-Mail: <a href="mailto:zerozeroz.events@gmail.com" style={{ color: "#07929B", textDecoration: "none" }}>zerozeroz.events@gmail.com</a><br />
            Telefon: <a href="tel:+436601679121" style={{ color: "#07929B", textDecoration: "none" }}>+43 660 1679121</a>
          </div>
        </PrivacySection>

        <PrivacySection title="2. Welche Daten werden erhoben">
          <p>Wir erheben und verarbeiten folgende personenbezogene Daten:</p>
          <SubSection title="Bei der Registrierung">
            <ul>
              <li>Name und E-Mail-Adresse</li>
              <li>Passwort (verschlüsselt gespeichert, nicht im Klartext)</li>
              <li>Gewählter Tarif (Free, Pro, Max)</li>
            </ul>
          </SubSection>
          <SubSection title="Bei der Nutzung der Plattform">
            <ul>
              <li>Von Ihnen eingegebene Event-Daten (Name, Datum, Ort, Beschreibung)</li>
              <li>Sponsorenkontakte (Name, Unternehmen, E-Mail, Telefon, Notizen)</li>
              <li>Pipeline-Einträge und Status-Verläufe</li>
              <li>Hochgeladene Bilder und Dateien (Banner, Logos)</li>
            </ul>
          </SubSection>
          <SubSection title="Technische Daten">
            <ul>
              <li>IP-Adresse (für Sicherheitszwecke und Rate-Limiting der KI-Funktionen)</li>
              <li>Browser-Typ und Version</li>
              <li>Datum und Uhrzeit des Zugriffs</li>
              <li>Aufgerufene Seiten (Logfiles)</li>
            </ul>
          </SubSection>
        </PrivacySection>

        <PrivacySection title="3. Zweck der Verarbeitung">
          <p>Wir verarbeiten Ihre Daten zu folgenden Zwecken:</p>
          <ul>
            <li><strong>Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO):</strong> Bereitstellung der SponsorMatch-Plattform und ihrer Funktionen</li>
            <li><strong>Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO):</strong> Sicherheit der Plattform, Missbrauchsprävention, Verbesserung der Dienste</li>
            <li><strong>Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO):</strong> Erfüllung steuerlicher und buchhalterischer Pflichten</li>
            <li><strong>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO):</strong> Versand von Newsletter und Produktneuigkeiten, sofern Sie dieser zugestimmt haben</li>
          </ul>
          <p>Wir verarbeiten Ihre Daten nicht für automatisierte Entscheidungsfindungen im Sinne von Art. 22 DSGVO, die rechtliche Wirkungen entfalten.</p>
        </PrivacySection>

        <PrivacySection title="4. localStorage-Nutzung">
          <p>Die SponsorMatch-Plattform verwendet den localStorage Ihres Browsers zur lokalen Speicherung von Daten. Dabei werden folgende Informationen im localStorage abgelegt:</p>
          <ul>
            <li>Nutzerkontodaten (Name, E-Mail, Einstellungen — in der aktuellen Version vor der Supabase-Integration)</li>
            <li>Event-Daten und Sponsoring-Pakete</li>
            <li>Pipeline-Einträge und Kontaktdaten</li>
          </ul>
          <p>Der localStorage ist ausschließlich in Ihrem Browser gespeichert und wird nicht automatisch an unsere Server übertragen. Der Inhalt des localStorage bleibt erhalten, bis Sie ihn manuell löschen oder Ihren Browser-Cache leeren.</p>
          <p><strong>Hinweis:</strong> Mit der Einführung der Supabase-Backend-Integration (in Planung) werden diese Daten serverseitig verschlüsselt gespeichert. Sie werden über diese Änderung rechtzeitig informiert.</p>
        </PrivacySection>

        <PrivacySection title="5. Weitergabe an Dritte">
          <p>Wir geben Ihre personenbezogenen Daten nur weiter, wenn dies für die Vertragserfüllung notwendig ist oder Sie ausdrücklich eingewilligt haben. Folgende Dienstleister verarbeiten Daten in unserem Auftrag:</p>
          <ul>
            <li><strong>Vercel Inc.</strong> (Hosting und Infrastruktur) — Server in der EU/USA mit EU-US Data Privacy Framework</li>
            <li><strong>Supabase Inc.</strong> (Datenbank und Authentifizierung, in Planung) — Daten in der EU</li>
            <li><strong>Stripe Inc.</strong> (Zahlungsabwicklung, in Planung) — PCI-DSS-zertifiziert</li>
            <li><strong>Anthropic PBC</strong> (KI-Sprachmodell für den KI Sponsor-Finder) — Ihre Anfragen werden verarbeitet, aber nicht zum Training verwendet</li>
          </ul>
          <p>Alle Auftragsverarbeiter sind vertraglich zur Einhaltung der DSGVO verpflichtet.</p>
        </PrivacySection>

        <PrivacySection title="6. Speicherdauer">
          <p>Wir speichern Ihre Daten nur so lange, wie es für den jeweiligen Zweck erforderlich ist:</p>
          <ul>
            <li>Nutzerdaten: Für die Dauer der Vertragsbeziehung, danach 30 Tage</li>
            <li>Buchungsbelege und Rechnungen: 7 Jahre (gesetzliche Aufbewahrungspflicht nach UGB/BAO)</li>
            <li>Technische Logfiles: 90 Tage</li>
          </ul>
        </PrivacySection>

        <PrivacySection title="7. Ihre Rechte als betroffene Person">
          <p>Sie haben gemäß DSGVO folgende Rechte gegenüber uns:</p>
          <ul>
            <li><strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Sie können Auskunft über die von uns verarbeiteten personenbezogenen Daten verlangen.</li>
            <li><strong>Berichtigungsrecht (Art. 16 DSGVO):</strong> Sie können die Berichtigung unrichtiger Daten verlangen.</li>
            <li><strong>Löschungsrecht (Art. 17 DSGVO):</strong> Sie können die Löschung Ihrer Daten verlangen, soweit keine Aufbewahrungspflichten entgegenstehen.</li>
            <li><strong>Einschränkung der Verarbeitung (Art. 18 DSGVO):</strong> Sie können die Einschränkung der Verarbeitung verlangen.</li>
            <li><strong>Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie können Ihre Daten in einem maschinenlesbaren Format erhalten.</li>
            <li><strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können der Verarbeitung Ihrer Daten widersprechen, soweit diese auf berechtigten Interessen beruht.</li>
            <li><strong>Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO):</strong> Sie können eine erteilte Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen.</li>
          </ul>
          <p>Zur Ausübung Ihrer Rechte wenden Sie sich bitte per E-Mail an <a href="mailto:zerozeroz.events@gmail.com" style={{ color: "#07929B", textDecoration: "none" }}>zerozeroz.events@gmail.com</a>. Wir bearbeiten Ihre Anfrage innerhalb von 30 Tagen.</p>
          <p>Sie haben außerdem das Recht, sich bei der zuständigen Datenschutzbehörde zu beschweren. In Österreich ist dies die <strong>Datenschutzbehörde (DSB)</strong>, Barichgasse 40–42, 1030 Wien, <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" style={{ color: "#07929B", textDecoration: "none" }}>www.dsb.gv.at</a>.</p>
        </PrivacySection>

        <PrivacySection title="8. Datensicherheit">
          <p>Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein, um Ihre Daten gegen zufällige oder vorsätzliche Manipulationen, Verlust, Zerstörung oder den Zugriff unberechtigter Personen zu schützen.</p>
          <p>Die Datenübertragung zwischen Ihrem Browser und unseren Servern erfolgt verschlüsselt über HTTPS/TLS. Passwörter werden ausschließlich in gehashter Form gespeichert.</p>
        </PrivacySection>

        <PrivacySection title="9. Kontakt">
          <p>Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte erreichen Sie uns unter:</p>
          <div style={{ background: "#ffffff", border: "1.5px solid #e8e4dd", borderRadius: 12, padding: "1.25rem 1.5rem", marginTop: "0.75rem" }}>
            E-Mail: <a href="mailto:zerozeroz.events@gmail.com" style={{ color: "#07929B", textDecoration: "none", fontWeight: 600 }}>zerozeroz.events@gmail.com</a>
          </div>
        </PrivacySection>

        <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid #e8e4dd", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/" style={{ fontSize: "0.85rem", color: "#6b6560", textDecoration: "none" }}>← Zurück zur Startseite</Link>
          <Link href="/agb" style={{ fontSize: "0.85rem", color: "#07929B", textDecoration: "none", fontWeight: 600 }}>AGB</Link>
        </div>
      </main>
    </div>
  );
}

function PrivacySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <h2 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.9rem", color: "#1a1814" }}>
        {title}
      </h2>
      <div style={{ fontSize: "0.9rem", color: "#3d3a36", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.4rem", color: "#1a1814" }}>{title}</div>
      {children}
    </div>
  );
}
