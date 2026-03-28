import Link from "next/link";
import { Zap } from "lucide-react";

export const metadata = {
  title: "Allgemeine Geschäftsbedingungen — SponsorMatch",
  description: "AGB von SponsorMatch",
};

export default function AGBPage() {
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
          Allgemeine Geschäftsbedingungen
        </h1>
        <p style={{ color: "#6b6560", fontSize: "0.88rem", marginBottom: "3rem" }}>Stand: März 2025</p>

        <LegalSection number="§1" title="Geltungsbereich">
          <p>Diese Allgemeinen Geschäftsbedingungen (im Folgenden „AGB") gelten für alle Verträge, die zwischen SponsorMatch (im Folgenden „Anbieter") und dem Nutzer (im Folgenden „Kunde") über die Nutzung der SponsorMatch-Plattform geschlossen werden.</p>
          <p>Abweichende, entgegenstehende oder ergänzende Allgemeine Geschäftsbedingungen des Kunden werden, selbst bei Kenntnis, nicht Vertragsbestandteil, es sei denn, ihrer Geltung wird ausdrücklich schriftlich zugestimmt.</p>
          <p>Die Plattform SponsorMatch ist ein webbasiertes Software-as-a-Service-Angebot zur Unterstützung von Eventveranstaltern bei der Sponsoring-Akquise.</p>
        </LegalSection>

        <LegalSection number="§2" title="Leistungsbeschreibung">
          <p>SponsorMatch stellt dem Kunden eine cloudbasierte Software zur Verfügung, die folgende Kernfunktionen umfasst:</p>
          <ul>
            <li>Verwaltung von Events und Sponsoring-Paketen</li>
            <li>Pipeline-Management für Sponsorenkontakte</li>
            <li>Globale Kontaktdatenbank</li>
            <li>KI-gestützte Sponsor-Suche (je nach gewähltem Tarif)</li>
          </ul>
          <p>Der genaue Funktionsumfang richtet sich nach dem vom Kunden gewählten Tarif (Free, Pro, Max). Der Anbieter behält sich vor, Funktionen weiterzuentwickeln, zu ändern oder einzustellen, sofern dies dem Kunden rechtzeitig mitgeteilt wird.</p>
        </LegalSection>

        <LegalSection number="§3" title="Vertragsschluss">
          <p>Die Registrierung auf der Plattform SponsorMatch erfolgt durch das Ausfüllen des Registrierungsformulars und die Bestätigung der AGB. Mit Abschluss der Registrierung kommt ein Nutzungsvertrag zustande.</p>
          <p>Der Kunde muss bei der Registrierung mindestens 18 Jahre alt sein. Juristische Personen können einen Vertrag nur durch bevollmächtigte natürliche Personen abschließen.</p>
          <p>Der Anbieter behält sich das Recht vor, Registrierungen ohne Angabe von Gründen abzulehnen.</p>
        </LegalSection>

        <LegalSection number="§4" title="Preise und Zahlung">
          <p>Die aktuellen Preise sind auf der Website des Anbieters unter dem Abschnitt „Preise" einsehbar. Alle Preise verstehen sich netto zuzüglich der gesetzlichen Mehrwertsteuer.</p>
          <p>Der Free-Tarif ist kostenlos und unbefristet nutzbar, jedoch in seinem Funktionsumfang beschränkt. Für den Pro-Tarif (derzeit €149 pro Monat) sowie den Max-Tarif (Preis auf Anfrage) ist eine monatliche Zahlung im Voraus erforderlich.</p>
          <p>Die Abrechnung erfolgt monatlich per Kreditkarte oder SEPA-Lastschrift über den Zahlungsdienstleister Stripe. Zahlungen sind sofort fällig. Bei Zahlungsverzug behält sich der Anbieter vor, den Zugang zur Plattform vorübergehend zu sperren.</p>
          <p>Preisänderungen werden dem Kunden mindestens 30 Tage vor Inkrafttreten per E-Mail mitgeteilt.</p>
        </LegalSection>

        <LegalSection number="§5" title="Kündigung">
          <p>Der Kunde kann seinen Vertrag jederzeit zum Ende der laufenden Abrechnungsperiode kündigen. Die Kündigung erfolgt über die Accounteinstellungen in der Plattform oder per E-Mail an den Anbieter.</p>
          <p>Der Anbieter kann den Vertrag mit einer Frist von 30 Tagen ordentlich kündigen. Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Ein wichtiger Grund liegt insbesondere vor, wenn der Kunde gegen diese AGB verstößt.</p>
          <p>Nach Vertragsbeendigung werden die Daten des Kunden für 30 Tage aufbewahrt und anschließend unwiderruflich gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>
        </LegalSection>

        <LegalSection number="§6" title="Haftung">
          <p>Der Anbieter haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit sowie für Schäden, die auf Vorsatz oder grober Fahrlässigkeit des Anbieters beruhen.</p>
          <p>Für leicht fahrlässig verursachte Schäden haftet der Anbieter nur, soweit wesentliche Vertragspflichten (Kardinalpflichten) verletzt werden. Die Haftung ist in diesem Fall auf den vorhersehbaren, vertragstypischen Schaden begrenzt.</p>
          <p>Der Anbieter übernimmt keine Haftung für die Verfügbarkeit und Richtigkeit von Daten Dritter, insbesondere im Rahmen der KI-gestützten Sponsor-Suche. Die generierten Ergebnisse sind Empfehlungen ohne Gewähr.</p>
          <p>Die Haftung für Datenverlust ist auf den typischen Wiederherstellungsaufwand beschränkt, der bei regelmäßiger und angemessener Datensicherung entstanden wäre.</p>
        </LegalSection>

        <LegalSection number="§7" title="Datenschutz">
          <p>Der Anbieter verarbeitet personenbezogene Daten des Kunden im Einklang mit den geltenden datenschutzrechtlichen Bestimmungen, insbesondere der Datenschutz-Grundverordnung (DSGVO).</p>
          <p>Einzelheiten zur Datenverarbeitung sind in der <Link href="/datenschutz" style={{ color: "#07929B", textDecoration: "none", fontWeight: 600 }}>Datenschutzerklärung</Link> des Anbieters geregelt, die Bestandteil dieser AGB ist.</p>
        </LegalSection>

        <LegalSection number="§8" title="Schlussbestimmungen">
          <p>Es gilt das Recht der Republik Österreich unter Ausschluss des UN-Kaufrechts. Gerichtsstand für alle Streitigkeiten aus diesem Vertrag ist Wien, sofern der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist.</p>
          <p>Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. An die Stelle der unwirksamen Bestimmung tritt eine wirksame Regelung, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten kommt.</p>
          <p>Änderungen und Ergänzungen dieser AGB bedürfen der Schriftform. Dies gilt auch für die Aufhebung des Schriftformerfordernisses.</p>
          <p>Der Anbieter behält sich vor, diese AGB jederzeit mit Wirkung für die Zukunft zu ändern. Der Kunde wird über Änderungen per E-Mail informiert. Widerspricht der Kunde nicht innerhalb von 14 Tagen nach Zugang der Änderungsmitteilung, gelten die neuen AGB als akzeptiert.</p>
        </LegalSection>

        <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid #e8e4dd", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/" style={{ fontSize: "0.85rem", color: "#6b6560", textDecoration: "none" }}>← Zurück zur Startseite</Link>
          <Link href="/datenschutz" style={{ fontSize: "0.85rem", color: "#07929B", textDecoration: "none", fontWeight: 600 }}>Datenschutzerklärung</Link>
        </div>
      </main>
    </div>
  );
}

function LegalSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <h2 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.9rem", color: "#1a1814", display: "flex", gap: "0.5rem" }}>
        <span style={{ color: "#07929B" }}>{number}</span>
        {title}
      </h2>
      <div style={{ fontSize: "0.9rem", color: "#3d3a36", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {children}
      </div>
    </section>
  );
}
