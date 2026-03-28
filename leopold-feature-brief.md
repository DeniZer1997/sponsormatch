# SponsorMatch — Feature-Brief für Leopold

**WICHTIG: Antworte IMMER auf Deutsch.**

Denizer hat eine umfassende Feature-Liste erstellt. Deine Aufgabe: Analysiere alles, priorisiere sinnvoll, zerlege in Arbeitspakete und leg los. Du hast freie Hand bei der technischen Umsetzung — tobt dich aus.

---

## 1. Bugfixes (sofort)

Diese Probleme bestehen aktuell und müssen zuerst gefixt werden:

- **Pipeline Betrag rechts** — Werte stimmen nicht, "Gold/Silver/Platinum" Labels erscheinen noch hartcodiert
- **Notizfeld bei Sponsor bearbeiten** — Funktionalität ist kaputt, Input wird nicht gespeichert
- **Billige Emojis entfernen** — Überall im UI durch sauberes Icon-Design ersetzen (Lucide Icons)

---

## 2. Design-Überarbeitung

Grundlegendes Redesign des gesamten UI:

- **Größere Schrift** — Base Font Size erhöhen, bessere Lesbarkeit
- **Keine Emojis** — Durchgehend Lucide Icons oder eigene SVG-Icons
- **Hintergrund anpassbar** — User kann Hintergrundfarbe/Theme wählen
- **Sponsor-Angebot** — Größere Schrift, Bild etwas kleiner und rechts neben der Überschrift positionieren

---

## 3. Sponsoren-Pakete überarbeiten

- **Paket-Auswahl mit Highlight** — Ausgewähltes Paket wird Orange (#e8500a) hinterlegt (wie aktuell bei Platinum, aber für jedes gewählte Paket)
- **Paket → E-Mail Vorlage** — Wenn Interesse an Partnerschaft: ausgewähltes Paket wird automatisch in die E-Mail-Vorlage eingepflegt
- **Pakete hinzufügen und löschen** — CRUD-Funktionalität für Sponsoring-Pakete
- **Event löschen** — Funktion ergänzen

---

## 4. Sponsoren-Kontaktdatenbank (generell, nicht eventspezifisch)

Eine zentrale Seite für ALLE Sponsorenkontakte, unabhängig von Events:

- **Globale Kontaktliste** — Alle Sponsoren an einem Ort einpflegen und verwalten
- **Pipeline-Datenbank** — Alle Sponsoren bleiben dauerhaft gespeichert, auch nach Event-Ende
- **Lernende Datenbank** — System merkt sich welcher Sponsor welche Event-Genres bevorzugt (regelbasiert, keine KI nötig). Basierend auf: vergangene Zusagen, Absagen, Paket-Präferenzen, Event-Kategorien

---

## 5. Telefonate & Kalender

- **Telefonate erfassen** — In der Sponsorenübersicht: getätigte Anrufe loggen mit Datum, Notizen, Ergebnis
- **Terminvereinbarung** — Kalender-Funktion zum Einpflegen von Follow-up-Terminen
- **Kalender-Schnittstelle** — Integration mit persönlichem Kalender (Google Calendar / Outlook via API)

---

## 6. Event-Templates

- **Neues Event aus Template** — Vergangenes Event als Vorlage wählen (ohne Pipeline & aktive Sponsoren)
- **Template-Felder markieren** — Farblich hervorheben welche Felder angepasst werden müssen vs. welche bestätigt werden können wenn sie gleich bleiben
- **Sponsoren-Historie anzeigen** — Bei Template-Erstellung: alle Sponsorendetails vom Vor-Event einblenden (wer wurde angefragt, wer hat gekauft, wer hat abgelehnt)

---

## 7. Sponsorenvereinbarung & Dokumentation

### Vereinbarung erstellen (wenn Sponsor auf "bestätigt" gesetzt wird)
- **Vorlage** mit: eigenem Logo, Eventdaten, Kundenadresse (anpassbar)
- **Vorgefertigte Texte** mit Preis aus dem gewählten Paket
- **PDF Upload** — Falls der Sponsor eigene Vereinbarungen hat

### Nach Unterzeichnung
- **Dropdown-Menü beim Sponsor** — Wird erstellt wenn Vereinbarung unterzeichnet ist
- **Benefit-Checkliste** — Checkboxen mit allen Benefits aus dem Paket, damit man tracken kann ob alles fürs Event eingeplant ist

### Nach der Veranstaltung
- **Sponsorendokumentation** — Bericht einpflegen (was wurde geliefert, Fotos, Reichweite etc.)
- **Versand an Sponsor** — Dokumentation direkt aus dem Tool an den Sponsor senden

---

## 8. Landing Page & Rechtliches

- **Öffentliche Landing Page** — Beschreibung von SponsorMatch: was es ist, wofür, Einsatzgebiete
- **Preisübersicht** mit Features pro Tier
- **AGB** einpflegen
- **Datenschutzerklärung** einpflegen
- Alles sichtbar BEVOR man sich anmeldet

---

## 9. Abo-System (3 Tiers)

### Free
- Beschränkte Nutzung
- Event-Limit (z.B. 1 aktives Event)
- Paket-Limit (z.B. max 3 Pakete)
- Basis-Pipeline
- Kein Export, keine Vorlagen

### Pro
- Alles aus Free ohne Limits
- **KI Sponsor-Finder** (Matching-Algorithmus)
- Unbegrenzte Events und Pakete
- E-Mail-Vorlagen
- Kalender-Integration

### Max
- Alles aus Pro
- Sponsorenvereinbarungs-Vorlagen
- Benefit-Tracking mit Checklisten
- Sponsoren-Dokumentation nach Event
- Lernende Pipeline-Datenbank
- PDF Upload und Export
- Prioritäts-Support

---

## Empfohlene Reihenfolge für Leopold

1. **Bugfixes** — Pipeline-Betrag, Notizfeld, Emojis (→ Hansi + Friedl)
2. **Design-Überarbeitung** — Schrift, Icons, Layout (→ Friedl)
3. **Sponsoren-Pakete CRUD** — Hinzufügen, Löschen, Highlight (→ Leopold + Friedl)
4. **Globale Kontaktdatenbank** — Zentrale Sponsor-Verwaltung (→ Leopold)
5. **Event-Templates** — Template-System mit Historie (→ Leopold)
6. **Landing Page + AGB** — Öffentliche Seiten (→ Friedl + Hansi)
7. **Telefonate & Kalender** — Logging + Kalender-API (→ Leopold)
8. **Sponsorenvereinbarung** — Vorlagen, Checklisten, Doku (→ Leopold + Friedl)
9. **Abo-System** — Stripe, Feature-Gating, 3 Tiers (→ Leopold)
10. **Lernende Datenbank** — Genre-Präferenzen tracken (→ Leopold)

---

**Leopold, du hast freie Hand. Analysiere den aktuellen Codestand, erstelle einen detaillierten Plan und fang an. Delegiere an Friedl, Franziska und Hansi wo es Sinn macht. Viel Erfolg!**
