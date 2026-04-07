"use client";
import { useEffect, useState, useRef } from "react";
import { Zap, Upload, Check, Plus, Trash2, Loader2, Image as ImageIcon, Film, FileText } from "lucide-react";
import Link from "next/link";

interface LinkData {
  en: string;  // eventName
  ei: string;  // eventId
  si: string;  // sponsorId
  sn: string;  // sponsorName
  sc: string;  // sponsorContact
  pk: string;  // packageName
  be: string[]; // benefits
  oe: string;  // organizerEmail
  on: string;  // organizerName
  uid: string; // userId
}

const ACCENT = "#07929B";

export default function SponsorPage() {
  const [data, setData] = useState<LinkData | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [logoUrls, setLogoUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState<"logo"|"video"|"file"|null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const logoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get("d");
    if (!d) { setInvalid(true); return; }
    try {
      const parsed = JSON.parse(decodeURIComponent(escape(atob(d))));
      setData(parsed);
    } catch {
      setInvalid(true);
    }
  }, []);

  const uploadFiles = async (files: File[], type: "logo" | "video" | "file", setUrls: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (!data || !files.length) return;
    setUploading(type);
    try {
      const results: string[] = [];
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        form.append("uid", data.uid);
        form.append("eventId", data.ei);
        form.append("sponsorId", data.si);
        form.append("type", type);
        const res = await fetch("/api/sponsor/upload", { method: "POST", body: form });
        if (!res.ok) throw new Error("Upload failed");
        const json = await res.json();
        results.push(json.url);
      }
      setUrls(prev => [...prev, ...results]);
    } catch {
      alert("Fehler beim Hochladen. Bitte versuche es erneut.");
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async () => {
    if (!data) return;
    setSubmitting(true);
    try {
      await fetch("/api/sponsor/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizerEmail: data.oe,
          sponsorName: data.sn,
          eventName: data.en,
          uid: data.uid,
          eventId: data.ei,
          sponsorId: data.si,
          logoUrls, videoUrls, fileUrls,
          message,
        }),
      });
      setSubmitted(true);
    } catch {
      alert("Fehler beim Absenden. Bitte versuche es erneut.");
    } finally {
      setSubmitting(false);
    }
  };

  const total = logoUrls.length + videoUrls.length + fileUrls.length;

  if (invalid) return (
    <div style={{ fontFamily: "'Helvetica Neue', sans-serif", background: "#f8f7f4", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔗</div>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "0.5rem" }}>Ungültiger Link</h1>
        <p style={{ color: "#6b6560", fontSize: "0.9rem" }}>Dieser Link ist nicht gültig oder abgelaufen. Bitte wende dich an den Veranstalter.</p>
        <Link href="/" style={{ display: "inline-block", marginTop: "1.5rem", color: ACCENT, fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" }}>Zur Startseite →</Link>
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ fontFamily: "'Helvetica Neue', sans-serif", background: "#f8f7f4", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={28} strokeWidth={1.5} color={ACCENT} style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );

  if (submitted) return (
    <div style={{ fontFamily: "'Helvetica Neue', sans-serif", background: "#f8f7f4", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
          <Check size={32} strokeWidth={2} color="#16a34a" />
        </div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem", fontFamily: "Georgia, serif" }}>Vielen Dank!</h1>
        <p style={{ color: "#6b6560", fontSize: "0.95rem", lineHeight: 1.6 }}>
          Deine Materialien für <strong>{data.en}</strong> wurden erfolgreich übermittelt.
          Der Veranstalter wird benachrichtigt.
        </p>
        <div style={{ marginTop: "1.5rem", background: "#fff", border: "1px solid #e8e4dd", borderRadius: 12, padding: "1rem 1.25rem", textAlign: "left", fontSize: "0.85rem", color: "#6b6560" }}>
          <div style={{ fontWeight: 700, color: "#1a1814", marginBottom: "0.4rem" }}>Übermittelt:</div>
          {logoUrls.length > 0 && <div>✓ {logoUrls.length} Logo{logoUrls.length !== 1 ? "s" : ""}</div>}
          {videoUrls.length > 0 && <div>✓ {videoUrls.length} Video{videoUrls.length !== 1 ? "s" : ""}</div>}
          {fileUrls.length > 0 && <div>✓ {fileUrls.length} weitere Datei{fileUrls.length !== 1 ? "en" : ""}</div>}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Helvetica Neue', sans-serif", background: "#f8f7f4", minHeight: "100vh", color: "#1a1814" }}>
      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e8e4dd", padding: "0 1.5rem", height: 60, display: "flex", alignItems: "center", gap: "0.55rem" }}>
        <div style={{ width: 32, height: 32, background: ACCENT, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Zap size={16} strokeWidth={1.5} color="#fff" />
        </div>
        <span style={{ fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.02em" }}>SponsorMatch</span>
      </nav>

      <main style={{ maxWidth: 580, margin: "0 auto", padding: "2.5rem 1.25rem 5rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: ACCENT, letterSpacing: "0.08em", marginBottom: "0.4rem", textTransform: "uppercase" }}>
            Sponsoring-Materialien
          </div>
          <h1 style={{ fontSize: "clamp(1.6rem, 5vw, 2rem)", fontWeight: 800, fontFamily: "Georgia, serif", margin: "0 0 0.4rem", letterSpacing: "-0.02em" }}>
            Hallo, {data.sn}!
          </h1>
          <p style={{ color: "#6b6560", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
            Bitte lade unten deine Materialien für <strong>{data.en}</strong> hoch.
            {data.pk && ` Paket: ${data.pk}.`}
          </p>
        </div>

        {/* Vereinbarte Leistungen */}
        {data.be.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #e8e4dd", borderRadius: 14, padding: "1.1rem 1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b6560", letterSpacing: "0.07em", marginBottom: "0.7rem" }}>VEREINBARTE LEISTUNGEN</div>
            {data.be.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.55rem", marginBottom: i < data.be.length - 1 ? "0.4rem" : 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT, flexShrink: 0, marginTop: "0.45rem" }} />
                <span style={{ fontSize: "0.88rem", lineHeight: 1.5 }}>{b}</span>
              </div>
            ))}
          </div>
        )}

        {/* Optional message */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b6560", letterSpacing: "0.07em", display: "block", marginBottom: "0.45rem" }}>
            NACHRICHT AN DEN VERANSTALTER (OPTIONAL)
          </label>
          <textarea
            rows={2}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="z.B. Hinweise zur Bildverwendung, Ansprechpartner für Rückfragen…"
            style={{ width: "100%", border: "1.5px solid #e8e4dd", borderRadius: 10, padding: "0.7rem 0.85rem", fontSize: "0.88rem", color: "#1a1814", background: "#fff", resize: "none", boxSizing: "border-box", outline: "none", lineHeight: 1.5 }}
          />
        </div>

        {/* Logo Upload */}
        <UploadSection
          label="LOGO"
          icon={<ImageIcon size={14} strokeWidth={1.5} color={ACCENT} />}
          description="PNG, SVG oder JPG — am besten auf transparentem Hintergrund"
          accept="image/*"
          multiple
          urls={logoUrls}
          uploading={uploading === "logo"}
          inputRef={logoRef}
          onUpload={files => uploadFiles(files, "logo", setLogoUrls)}
          renderPreview={(url, i) => (
            <div key={i} style={{ position: "relative", width: 72, height: 72, borderRadius: 10, overflow: "hidden", border: "1px solid #e8e4dd", background: "#f8f7f4" }}>
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              <button type="button" onClick={() => setLogoUrls(p => p.filter((_, j) => j !== i))}
                style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", padding: 0 }}>×</button>
            </div>
          )}
        />

        {/* Video Upload */}
        <UploadSection
          label="VIDEOS"
          icon={<Film size={14} strokeWidth={1.5} color={ACCENT} />}
          description="MP4, MOV oder andere Videoformate"
          accept="video/*"
          multiple
          urls={videoUrls}
          uploading={uploading === "video"}
          inputRef={videoRef}
          onUpload={files => uploadFiles(files, "video", setVideoUrls)}
          renderPreview={(url, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.65rem", background: "#fff", border: "1px solid #e8e4dd", borderRadius: 9, padding: "0.55rem 0.8rem", marginBottom: "0.35rem" }}>
              <Film size={14} strokeWidth={1.5} color={ACCENT} />
              <span style={{ flex: 1, fontSize: "0.85rem", color: "#1a1814" }}>Video {i + 1}</span>
              <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", color: ACCENT, textDecoration: "none", fontWeight: 600 }}>↗</a>
              <button type="button" onClick={() => setVideoUrls(p => p.filter((_, j) => j !== i))}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#a09b94", padding: 0, display: "flex" }}>
                <Trash2 size={13} strokeWidth={1.5} />
              </button>
            </div>
          )}
        />

        {/* File Upload */}
        <UploadSection
          label="WEITERE DATEIEN"
          icon={<FileText size={14} strokeWidth={1.5} color={ACCENT} />}
          description="PDF, ZIP, AI, EPS oder andere Dateien"
          accept="*/*"
          multiple
          urls={fileUrls}
          uploading={uploading === "file"}
          inputRef={fileRef}
          onUpload={files => uploadFiles(files, "file", setFileUrls)}
          renderPreview={(url, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.65rem", background: "#fff", border: "1px solid #e8e4dd", borderRadius: 9, padding: "0.55rem 0.8rem", marginBottom: "0.35rem" }}>
              <FileText size={14} strokeWidth={1.5} color="#6b6560" />
              <span style={{ flex: 1, fontSize: "0.85rem", color: "#1a1814" }}>Datei {i + 1}</span>
              <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", color: ACCENT, textDecoration: "none", fontWeight: 600 }}>↗</a>
              <button type="button" onClick={() => setFileUrls(p => p.filter((_, j) => j !== i))}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#a09b94", padding: 0, display: "flex" }}>
                <Trash2 size={13} strokeWidth={1.5} />
              </button>
            </div>
          )}
        />

        {/* Submit */}
        <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #e8e4dd" }}>
          {total === 0 && (
            <p style={{ fontSize: "0.82rem", color: "#a09b94", textAlign: "center", marginBottom: "1rem" }}>
              Lade mindestens eine Datei hoch, um abzusenden.
            </p>
          )}
          <button
            type="button"
            disabled={total === 0 || submitting || !!uploading}
            onClick={handleSubmit}
            style={{ width: "100%", background: total > 0 && !submitting ? ACCENT : "#d1d5db", color: "#fff", border: "none", borderRadius: 12, padding: "1rem", fontSize: "1rem", fontWeight: 700, cursor: total > 0 && !submitting ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", transition: "opacity 0.15s" }}
          >
            {submitting ? <><Loader2 size={18} strokeWidth={1.5} />Wird gesendet…</> : <><Check size={18} strokeWidth={2} />Materialien abschicken ({total} Datei{total !== 1 ? "en" : ""})</>}
          </button>
          <p style={{ fontSize: "0.75rem", color: "#a09b94", textAlign: "center", marginTop: "0.75rem", lineHeight: 1.5 }}>
            Nach dem Absenden erhält <strong>{data.on || "der Veranstalter"}</strong> eine Benachrichtigung.
          </p>
        </div>
      </main>
    </div>
  );
}

function UploadSection({ label, icon, description, accept, multiple, urls, uploading, inputRef, onUpload, renderPreview }: {
  label: string; icon: React.ReactNode; description: string; accept: string; multiple: boolean;
  urls: string[]; uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (files: File[]) => void;
  renderPreview: (url: string, i: number) => React.ReactNode;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e8e4dd", borderRadius: 14, padding: "1.1rem 1.25rem", marginBottom: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.25rem" }}>
        {icon}
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b6560", letterSpacing: "0.07em" }}>{label}</span>
      </div>
      <div style={{ fontSize: "0.78rem", color: "#a09b94", marginBottom: "0.85rem" }}>{description}</div>

      {urls.length > 0 && (
        <div style={{ marginBottom: "0.75rem", display: label === "LOGO" ? "flex" : "block", flexWrap: "wrap", gap: "0.4rem" }}>
          {urls.map((url, i) => renderPreview(url, i))}
        </div>
      )}

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", background: "#f8f7f4", border: "1.5px dashed #e8e4dd", borderRadius: 10, padding: "0.65rem", cursor: uploading ? "wait" : "pointer", color: "#6b6560", fontSize: "0.85rem", fontWeight: 600 }}
      >
        {uploading
          ? <><Loader2 size={14} strokeWidth={1.5} style={{ animation: "spin 1s linear infinite" }} />Wird hochgeladen…</>
          : <><Plus size={14} strokeWidth={1.5} />Datei{multiple ? "en" : ""} auswählen</>
        }
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: "none" }}
        onChange={e => { const files = Array.from(e.target.files || []); if (files.length) onUpload(files); e.target.value = ""; }}
      />
    </div>
  );
}
