"use client";

import { useEffect, useState } from "react";

interface AgreementData {
  eventName: string;
  eventDate: string;
  eventLocation: string;
  organizer: string;
  organizerAddress?: string;
  organizerEmail?: string;
  organizerLogo?: string;
  sponsorCompany: string;
  sponsorContact: string;
  sponsorEmail: string;
  sponsorAddress?: string;
  packageName: string;
  packagePrice: number;
  benefits: string[];
  packageExtras?: string[];
  customText: string;
  mwst?: string;
}

const FALLBACK: AgreementData = {
  eventName: "Mein Event",
  eventDate: "—",
  eventLocation: "—",
  organizer: "Veranstalter",
  sponsorCompany: "Sponsor GmbH",
  sponsorContact: "Ansprechpartner",
  sponsorEmail: "",
  packageName: "Gold",
  packagePrice: 5000,
  benefits: ["Benefit 1", "Benefit 2"],
  customText: "",
};

export default function VereinbarungPage() {
  const [data, setData] = useState<AgreementData | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("vereinbarung_data");
      if (raw) {
        setData(JSON.parse(raw));
      } else {
        setData(FALLBACK);
      }
    } catch {
      setData(FALLBACK);
    }
  }, []);

  if (!data) {
    return (
      <div style={{ padding: "2rem", fontFamily: "'Helvetica Neue', Helvetica, sans-serif" }}>
        Lade Vereinbarung...
      </div>
    );
  }

  // Tax breakdown
  function calcTax(netto: number, mwst: string | undefined) {
    if (!mwst || mwst === "0") return { lines: [], brutto: netto, noTaxLabel: "exkl. Steuern" };
    if (mwst === "mwst10") {
      const t = Math.round(netto * 0.10);
      return { lines: [{ label: "MwSt. (10 %)", amount: t }], brutto: netto + t, noTaxLabel: "" };
    }
    if (mwst === "mwst20") {
      const t = Math.round(netto * 0.20);
      return { lines: [{ label: "MwSt. (20 %)", amount: t }], brutto: netto + t, noTaxLabel: "" };
    }
    if (mwst === "werbung5") {
      const wa = Math.round(netto * 0.05);
      return { lines: [{ label: "Werbeabgabe (5 %)", amount: wa }], brutto: netto + wa, noTaxLabel: "" };
    }
    if (mwst === "werbung5_mwst20") {
      const wa = Math.round(netto * 0.05);
      const mv = Math.round((netto + wa) * 0.20);
      return { lines: [{ label: "Werbeabgabe (5 %)", amount: wa }, { label: "MwSt. (20 %)", amount: mv }], brutto: netto + wa + mv, noTaxLabel: "" };
    }
    return { lines: [], brutto: netto, noTaxLabel: "exkl. Steuern" };
  }
  const tax = calcTax(data.packagePrice, data.mwst);
  const hasTax = tax.lines.length > 0;

  // Calculate payment deadline: event date - 30 days (simple string fallback if not parseable)
  let paymentDeadline = "30 Tage vor Veranstaltung";
  if (data.eventDate && data.eventDate.match(/\d{4}/)) {
    paymentDeadline = `30 Tage vor ${data.eventDate}`;
  }

  const benefitsList = data.benefits.map((b, i) => `   ${i + 1}. ${b}`).join("\n");

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #f8f7f4; color: #1a1814; }

        .print-button-bar {
          background: #1a1814;
          padding: 0.85rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .print-button-bar span {
          color: rgba(255,255,255,0.7);
          font-size: 0.85rem;
        }
        .print-btn {
          background: #07929B;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 0.65rem 1.5rem;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
        }
        .print-btn:hover { background: #089e8c; }

        .contract-page {
          max-width: 720px;
          margin: 2rem auto;
          background: #fff;
          border: 1px solid #e8e4dd;
          border-radius: 16px;
          padding: 3rem 3.5rem;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
        }

        .contract-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid #1a1814;
        }
        .logo-placeholder {
          width: 52px;
          height: 52px;
          background: #07929B;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 1.4rem;
          font-weight: 800;
          flex-shrink: 0;
        }
        .contract-title {
          text-align: right;
        }
        .contract-title h1 {
          font-family: Georgia, serif;
          font-size: 1.4rem;
          font-weight: 700;
          color: #1a1814;
          margin-bottom: 0.2rem;
        }
        .contract-title p {
          font-size: 0.82rem;
          color: #6b6560;
        }

        .parties-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
          background: #f8f7f4;
          border: 1px solid #e8e4dd;
          border-radius: 10px;
          padding: 1.25rem;
        }
        .party-block label {
          display: block;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #a09b94;
          margin-bottom: 0.4rem;
        }
        .party-block p {
          font-size: 0.92rem;
          font-weight: 600;
          color: #1a1814;
          line-height: 1.5;
        }
        .party-block p small {
          display: block;
          font-size: 0.8rem;
          font-weight: 400;
          color: #6b6560;
        }

        .package-box {
          background: #fff8f5;
          border: 1.5px solid #07929B44;
          border-radius: 10px;
          padding: 1.1rem 1.25rem;
          margin-bottom: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .package-box .pkg-name {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #07929B;
          margin-bottom: 0.2rem;
        }
        .package-box .pkg-price {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1a1814;
          font-family: Georgia, serif;
        }

        .contract-section {
          margin-bottom: 1.75rem;
        }
        .contract-section h2 {
          font-size: 0.85rem;
          font-weight: 700;
          color: #1a1814;
          margin-bottom: 0.6rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .contract-section h2 .section-num {
          width: 22px;
          height: 22px;
          background: #07929B;
          color: #fff;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 800;
          flex-shrink: 0;
        }
        .contract-section p {
          font-size: 0.9rem;
          color: #6b6560;
          line-height: 1.7;
        }
        .benefits-list {
          list-style: none;
          padding: 0;
          margin: 0.5rem 0 0;
        }
        .benefits-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.88rem;
          color: #1a1814;
          line-height: 1.5;
          margin-bottom: 0.35rem;
        }
        .benefit-dot {
          width: 16px;
          height: 16px;
          background: #07929B;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 0.15rem;
        }
        .benefit-dot span { color: #fff; font-size: 0.5rem; font-weight: 700; }

        .custom-text-box {
          background: #f8f7f4;
          border: 1px solid #e8e4dd;
          border-radius: 8px;
          padding: 0.85rem 1rem;
          font-size: 0.88rem;
          color: #1a1814;
          line-height: 1.7;
          white-space: pre-wrap;
          margin-top: 0.5rem;
        }

        .signature-section {
          margin-top: 2.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e8e4dd;
        }
        .signature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem;
          margin-top: 1rem;
        }
        .signature-block {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .signature-block .sig-label {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #a09b94;
        }
        .signature-line {
          border-bottom: 1.5px solid #1a1814;
          height: 48px;
          margin-bottom: 0.3rem;
        }
        .signature-block .sig-name {
          font-size: 0.82rem;
          color: #6b6560;
        }
        .date-line {
          font-size: 0.88rem;
          color: #6b6560;
          margin-top: 1rem;
        }

        @media print {
          .print-button-bar { display: none !important; }
          body { background: #fff; }
          .contract-page {
            margin: 0;
            border: none;
            border-radius: 0;
            box-shadow: none;
            padding: 2cm 2.5cm;
            max-width: 100%;
          }
          @page { margin: 0; }
        }

        @media (max-width: 600px) {
          .contract-page { padding: 1.5rem 1.25rem; margin: 0; border-radius: 0; }
          .parties-grid { grid-template-columns: 1fr; }
          .signature-grid { grid-template-columns: 1fr; }
          .contract-header { flex-direction: column; gap: 1rem; }
          .contract-title { text-align: left; }
        }
      `}</style>

      {/* Print button bar — hidden when printing */}
      <div className="print-button-bar">
        <span>Sponsorenvereinbarung · {data.eventName}</span>
        <button className="print-btn" onClick={() => window.print()}>
          Drucken / Als PDF speichern
        </button>
      </div>

      {/* Contract page */}
      <div className="contract-page">
        {/* Header */}
        <div className="contract-header">
          {data.organizerLogo
            ? <img src={data.organizerLogo} alt="Logo" style={{ width: 52, height: 52, objectFit: "contain", borderRadius: 8, border: "1px solid #e8e4dd" }} />
            : <div className="logo-placeholder">S</div>
          }
          <div className="contract-title">
            <h1>Sponsoringvereinbarung</h1>
            <p>{data.eventDate}{data.eventLocation ? ` · ${data.eventLocation}` : ""}</p>
          </div>
        </div>

        {/* Parties */}
        <div className="parties-grid">
          <div className="party-block">
            <label>VERANSTALTER</label>
            <p>
              {data.organizer}
              {data.organizerAddress && <small style={{ whiteSpace: "pre-line" }}>{data.organizerAddress}</small>}
              {data.organizerEmail && <small>{data.organizerEmail}</small>}
            </p>
          </div>
          <div className="party-block">
            <label>SPONSOR</label>
            <p>
              {data.sponsorCompany}
              {data.sponsorAddress && <small style={{ whiteSpace: "pre-line" }}>{data.sponsorAddress}</small>}
              {data.sponsorContact && <small>{data.sponsorContact}</small>}
              {data.sponsorEmail && <small>{data.sponsorEmail}</small>}
            </p>
          </div>
        </div>

        {/* Package box */}
        <div className="package-box">
          <div>
            <div className="pkg-name">{data.packageName.toUpperCase()}-SPONSORING</div>
            <div style={{ fontSize: "0.82rem", color: "#6b6560" }}>{data.eventName}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            {hasTax ? (
              <table style={{ borderCollapse: "collapse", marginLeft: "auto", fontSize: "0.88rem" }}>
                <tbody>
                  <tr>
                    <td style={{ color: "#6b6560", paddingRight: "1.25rem", paddingBottom: "0.15rem" }}>Nettobetrag</td>
                    <td style={{ fontWeight: 600, color: "#1a1814", textAlign: "right" }}>€{data.packagePrice.toLocaleString("de-AT")}</td>
                  </tr>
                  {tax.lines.map((l, i) => (
                    <tr key={i}>
                      <td style={{ color: "#6b6560", paddingRight: "1.25rem", paddingBottom: "0.15rem" }}>{l.label}</td>
                      <td style={{ fontWeight: 600, color: "#1a1814", textAlign: "right" }}>€{l.amount.toLocaleString("de-AT")}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: "1.5px solid #e8e4dd" }}>
                    <td style={{ color: "#1a1814", fontWeight: 700, paddingRight: "1.25rem", paddingTop: "0.25rem" }}>Gesamtbetrag</td>
                    <td style={{ fontWeight: 800, color: "#07929B", fontSize: "1.1rem", textAlign: "right", paddingTop: "0.25rem" }}>€{tax.brutto.toLocaleString("de-AT")}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <>
                <div className="pkg-price">€{data.packagePrice.toLocaleString("de-AT")}</div>
                <div style={{ fontSize: "0.72rem", color: "#a09b94" }}>{tax.noTaxLabel}</div>
              </>
            )}
          </div>
        </div>

        {/* Section 1 — Vertragsgegenstand */}
        <div className="contract-section">
          <h2>
            <span className="section-num">1</span>
            Vertragsgegenstand
          </h2>
          <p>
            <strong>{data.sponsorCompany}</strong> unterstützt <strong>{data.eventName}</strong> als{" "}
            <strong>{data.packageName}</strong>-Sponsor gegen einen Betrag von{" "}
            <strong>€{data.packagePrice.toLocaleString("de-AT")}</strong> (exkl. Steuern).
            Die Veranstaltung findet am <strong>{data.eventDate}</strong>
            {data.eventLocation ? <> in <strong>{data.eventLocation}</strong></> : null} statt.
          </p>
        </div>

        {/* Section 2 — Leistungen */}
        <div className="contract-section">
          <h2>
            <span className="section-num">2</span>
            Leistungen des Veranstalters
          </h2>
          <p>Der Veranstalter erbringt folgende Leistungen im Rahmen des {data.packageName}-Pakets:</p>
          {(data.benefits.length > 0 || (data.packageExtras||[]).length > 0) ? (
            <ul className="benefits-list">
              {data.benefits.map((b, i) => (
                <li key={i}>
                  <div className="benefit-dot"><span>✓</span></div>
                  <span>{b}</span>
                </li>
              ))}
              {(data.packageExtras||[]).map((e, i) => (
                <li key={"x"+i}>
                  <div className="benefit-dot" style={{ background: "#1a1814" }}><span>✓</span></div>
                  <span>{e} <em style={{ fontSize: "0.78rem", color: "#a09b94" }}>(individuelle Ergänzung)</em></span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ marginTop: "0.5rem", fontStyle: "italic" }}>Keine Leistungen definiert.</p>
          )}
        </div>

        {/* Section 3 — Zahlungsbedingungen */}
        <div className="contract-section">
          <h2>
            <span className="section-num">3</span>
            Zahlungsbedingungen
          </h2>
          <p>
            Der Betrag von <strong>€{tax.brutto.toLocaleString("de-AT")}</strong>{hasTax ? <> (inkl. Steuern; Netto: €{data.packagePrice.toLocaleString("de-AT")})</> : null} ist bis{" "}
            <strong>{paymentDeadline}</strong> auf das vom Veranstalter bekanntgegebene Konto zu überweisen.
            Die Rechnung wird nach Vertragsunterzeichnung übermittelt.
          </p>
        </div>

        {/* Section 4 — Sonstige Vereinbarungen */}
        <div className="contract-section">
          <h2>
            <span className="section-num">4</span>
            Sonstige Vereinbarungen
          </h2>
          {data.customText ? (
            <div className="custom-text-box">{data.customText}</div>
          ) : (
            <p style={{ fontStyle: "italic", color: "#a09b94" }}>
              Keine weiteren Vereinbarungen. Beide Parteien verpflichten sich zur Einhaltung der
              oben genannten Leistungen und Zahlungsbedingungen.
            </p>
          )}
        </div>

        {/* Section 5 — Salvatorische Klausel */}
        <div className="contract-section">
          <h2>
            <span className="section-num">5</span>
            Salvatorische Klausel
          </h2>
          <p>
            Sollten einzelne Bestimmungen dieser Vereinbarung unwirksam sein, bleibt die Wirksamkeit
            der übrigen Bestimmungen unberührt. Die Parteien verpflichten sich, unwirksame Bestimmungen
            durch wirksame Regelungen zu ersetzen, die dem wirtschaftlichen Zweck am nächsten kommen.
          </p>
        </div>

        {/* Signatures */}
        <div className="signature-section">
          <p style={{ fontSize: "0.88rem", color: "#6b6560", marginBottom: "0.5rem" }}>
            Diese Vereinbarung wird in zwei gleichlautenden Exemplaren ausgefertigt, je eines für
            den Veranstalter und den Sponsor.
          </p>
          <div className="date-line">
            Datum: _____________________________ Ort: _____________________________
          </div>
          <div className="signature-grid">
            <div className="signature-block">
              <div className="sig-label">VERANSTALTER</div>
              <div className="signature-line" />
              <div className="sig-name">{data.organizer}</div>
            </div>
            <div className="signature-block">
              <div className="sig-label">SPONSOR</div>
              <div className="signature-line" />
              <div className="sig-name">{data.sponsorCompany}{data.sponsorContact ? ` · ${data.sponsorContact}` : ""}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
