"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, BarChart2, Package, Bot, Eye, Pencil, Mail, Check, Camera, Building2, Calendar, MapPin, Users, CheckCircle, FileText, Handshake, Inbox, Settings, Globe, ImageIcon, Target, AlertCircle, User, Plus, BookUser, Phone, Search, Trash2, History, Copy, ChevronDown, ChevronUp, PhoneCall, CalendarDays, Download, Loader2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { TIER_CONFIG, hasFeature, canCreateEvent, canCreatePackage, canAddPipelineContact } from "@/lib/tier-config";
import { loadAllUserData, getUserOrgId, getUserProfile, upsertEvent, deleteEvent, replacePackages, replaceMehrwert, upsertPipelineEntry, upsertCall, upsertAppointment, upsertContact, deletePipelineEntry, deleteContact as deleteContactDb } from "@/lib/db";
import { assembleProjects, assembleContacts, mapProjectToEventInsert, mapPackageToInsert, mapMehrwertToInsert, mapPipelineToInsert, mapCallToInsert, mapAppointmentToInsert, mapContactToInsert } from "@/lib/data-mappers";
import { migrateLocalStorageToSupabase } from "@/lib/migrate-to-supabase";
import { uploadEventBanner, uploadGalleryImage, uploadAgreementPdf, uploadAgreementPhoto, uploadSponsorMaterial } from "@/lib/storage";

// ── THEME (overridable per account) ───────────────────────────
const makeColors = (accent="#07929B") => ({
  bg:"#f8f7f4", surface:"#ffffff", border:"#e8e4dd",
  text:"#1a1814", textMid:"#6b6560", textLight:"#a09b94",
  accent, accentSoft:`${accent}18`, accentBorder:`${accent}44`,
  green:"#16a34a", greenSoft:"#f0fdf4",
  blue:"#2563eb", blueSoft:"#eff6ff",
  amber:"#d97706", amberSoft:"#fffbeb",
});

const DEFAULT_PACKAGES = () => [
  { id:"p1", name:"Platinum", price:25000, color:"#e8500a", slots:1, taken:0, benefits:["Naming Right & Hauptbühne","5 VIP Tickets + Lounge","Logo auf allen Materialien","30min Speaking Slot","Branded Networking Area"] },
  { id:"p2", name:"Gold",     price:12000, color:"#d97706", slots:2, taken:1, benefits:["Co-Branding Hauptbühne","3 Tickets","Logo auf Website & App","Social Media Erwähnung","Standpräsenz 4m²"] },
  { id:"p3", name:"Silver",   price:5000,  color:"#64748b", slots:4, taken:2, benefits:["Logo im Programm","2 Tickets","Erwähnung auf Bühne","Website-Eintrag"] },
];
const DEFAULT_PIPELINE = () => [
  { id:"s1", company:"TechVentures GmbH",  contact:"Maria Huber",    email:"m.huber@techventures.at", package:"Platinum", status:"negotiating", value:25000, opened:"vor 2 Std",   notes:"Sehr interessiert, will Vertrag bis Fr.", pitchSent:false },
  { id:"s2", company:"Erste Bank AG",      contact:"Thomas Berger",  email:"t.berger@erstebank.at",   package:"Gold",     status:"sent",        value:12000, opened:"vor 1 Tag",   notes:"Pitch gesendet, noch keine Antwort",     pitchSent:true  },
  { id:"s3", company:"A1 Telekom Austria", contact:"Sandra Koch",    email:"s.koch@a1.at",            package:"Gold",     status:"confirmed",   value:12000, opened:"vor 3 Tagen", notes:"Vertrag unterschrieben",                 pitchSent:true  },
  { id:"s4", company:"Raiffeisen Bank",    contact:"Klaus Mayer",    email:"k.mayer@rbint.com",       package:"Silver",   status:"draft",       value:5000,  opened:"—",           notes:"Paket noch nicht gesendet",              pitchSent:false },
  { id:"s5", company:"ÖBB",               contact:"Eva Steiner",    email:"e.steiner@oebb.at",       package:"Silver",   status:"sent",        value:5000,  opened:"vor 5 Std",   notes:"Jetzt guter Zeitpunkt zum Anrufen!",     pitchSent:true  },
];
// TODO: Mehrwert-Icons mittelfristig auf Icon-Picker umstellen (Friedl)
const DEFAULT_MEHRWERT = () => [
  { id:"m1", icon:"Ziel", title:"400+ Entscheider",    text:"Direkter Zugang zu Top-Managern aus Tech, Finance & Corporate Austria" },
  { id:"m2", icon:"Social", title:"12.000 Social Reach", text:"Live-Coverage auf LinkedIn, Instagram & X während des Events" },
  { id:"m3", icon:"Award", title:"Exklusive Sichtbarkeit", text:"Ihr Logo prominent auf Bühne, Screens und allen Print-Materialien" },
];

const newId = () => (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const INITIAL_PROJECTS = (uid) => [
  { id: newId(), uid, name:"Beispiel-Event (bitte ersetzen)", date:"15. Oktober 2025", location:"Marx Halle, Wien", audience:400, reach:"12.000", email:"office@meinevent.at", description:"<b>Das ist ein Beispiel-Event</b> — bearbeite es oder lege ein neues Event an, um loszulegen.", banner:null, gallery:[], mehrwert:DEFAULT_MEHRWERT(), packages:DEFAULT_PACKAGES(), pipeline:DEFAULT_PIPELINE(), category:"Business" },
];

const STATUS_CONFIG = {
  draft:       { label:"Entwurf",     color:"#a09b94", bg:"#f1f0ee" },
  sent:        { label:"Gesendet",    color:"#2563eb", bg:"#eff6ff" },
  negotiating: { label:"Verhandlung", color:"#d97706", bg:"#fffbeb" },
  confirmed:   { label:"Bestätigt",   color:"#16a34a", bg:"#f0fdf4" },
  rejected:    { label:"Abgelehnt",   color:"#dc2626", bg:"#fef2f2" },
};
const EVENT_CATEGORIES = ["Technologie","Business","Musik","Sport","Kultur","Networking","Sonstiges"];

// ── HELPERS ───────────────────────────────────────────────────
const mkInp = (C, extra={}) => ({ width:"100%", padding:"0.75rem 1rem", border:`1.5px solid ${C.border}`, borderRadius:10, background:C.bg, color:C.text, fontSize:"0.95rem", outline:"none", boxSizing:"border-box", fontFamily:"inherit", ...extra });
const Badge = ({status,C}) => { const s=STATUS_CONFIG[status]||STATUS_CONFIG.draft; return <span style={{fontSize:"0.7rem",fontWeight:700,padding:"0.25rem 0.65rem",borderRadius:99,background:s.bg,color:s.color,whiteSpace:"nowrap"}}>{s.label}</span>; };
const Label = ({C,children}) => <div style={{fontSize:"0.7rem",fontWeight:700,color:C.textMid,marginBottom:"0.4rem",letterSpacing:"0.07em"}}>{children}</div>;

const Sheet = ({onClose,C,children}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={onClose}>
    <div className="sm-sheet-inner" style={{background:C.surface,borderRadius:"20px 20px 0 0",padding:"1.5rem",maxHeight:"92vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
      <div style={{width:40,height:4,background:C.border,borderRadius:99,margin:"0 auto 1.25rem"}}/>
      {children}
    </div>
  </div>
);

// WYSIWYG Rich Text Editor
const RichEditor = ({value, onChange, C}) => {
  const ref = useRef(null);
  const focused = useRef(false);

  // Inline useEffect via ref callback
  const setRef = (el) => {
    if (el && !ref.current) {
      ref.current = el;
      el.innerHTML = value || "";
    }
  };

  const applyFormat = (e, cmd) => {
    e.preventDefault();
    const sel = window.getSelection();
    if (!sel || !ref.current) return;
    ref.current.focus();
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    document.execCommand(cmd, false, null);
    onChange(ref.current.innerHTML);
  };

  return (
    <div style={{border:`1.5px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
      <div style={{display:"flex",gap:"0.25rem",padding:"0.4rem 0.6rem",background:C.bg,borderBottom:`1px solid ${C.border}`}}>
        <button onMouseDown={e=>applyFormat(e,"bold")} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,padding:"0.25rem 0.65rem",fontSize:"0.9rem",cursor:"pointer",fontWeight:700,lineHeight:1}}>B</button>
        <button onMouseDown={e=>applyFormat(e,"italic")} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,padding:"0.25rem 0.65rem",fontSize:"0.9rem",cursor:"pointer",fontStyle:"italic",lineHeight:1}}>I</button>
        <button onMouseDown={e=>applyFormat(e,"underline")} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,padding:"0.25rem 0.65rem",fontSize:"0.9rem",cursor:"pointer",textDecoration:"underline",lineHeight:1}}>U</button>
      </div>
      <div
        ref={setRef}
        contentEditable="true"
        suppressContentEditableWarning
        onFocus={()=>focused.current=true}
        onBlur={()=>{ focused.current=false; onChange(ref.current.innerHTML); }}
        style={{padding:"0.7rem 0.9rem",minHeight:90,outline:"none",fontSize:"0.9rem",lineHeight:1.6,color:C.text,background:C.surface,direction:"ltr",textAlign:"left",wordBreak:"break-word"}}
      />
    </div>
  );
};

// Description is stored as HTML from contentEditable
const renderDescription = (html) => html || "";

// Safe HTML renderer for description
const SafeHtml = ({html, style}) => (
  <div
    style={{wordBreak:"break-word",overflowWrap:"break-word",whiteSpace:"normal",maxWidth:"100%",...style}}
    dangerouslySetInnerHTML={{__html: (html||"").replace(/<(?!\/?(b|i|u|strong|em|ul|ol|li|br|p|div)[ >])[^>]*>/gi,"")}}
  />
);

const TABS = [
  {id:"dashboard", Icon:Zap,          label:"Übersicht"},
  {id:"pipeline",  Icon:BarChart2,    label:"Pipeline"},
  {id:"packages",  Icon:Package,      label:"Pakete"},
  {id:"contacts",  Icon:BookUser,     label:"Kontakte"},
  {id:"calendar",  Icon:CalendarDays, label:"Kalender"},
  {id:"preview",   Icon:Eye,          label:"Vorschau"},
];

// ── CALL RESULT CONFIG ─────────────────────────────────────────
const CALL_RESULT_CONFIG = {
  interested:  { label:"Interessiert",          color:"#d97706", bg:"#fffbeb" },
  callback:    { label:"Rückruf vereinbart",    color:"#2563eb", bg:"#eff6ff" },
  rejected:    { label:"Kein Interesse",        color:"#dc2626", bg:"#fef2f2" },
  confirmed:   { label:"Bestätigt",             color:"#16a34a", bg:"#f0fdf4" },
  no_answer:   { label:"Nicht erreicht",        color:"#6b6560", bg:"#f1f0ee" },
};

// ── ICS GENERATOR ─────────────────────────────────────────────
const generateICS = (apt, sponsorName, eventName) => {
  const toICSDate = (dateStr, timeStr) => {
    const d = new Date(`${dateStr}T${timeStr||"00:00"}:00`);
    const pad = n => String(n).padStart(2,"0");
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };
  const dtstart = toICSDate(apt.date, apt.time);
  const dtend   = toICSDate(apt.date, apt.time ? `${String(parseInt(apt.time.split(":")[0])+1).padStart(2,"0")}:${apt.time.split(":")[1]}` : "01:00");
  const uid     = `${apt.id}@sponsormatch`;
  const summary = apt.title || `Termin – ${sponsorName}`;
  const desc    = [apt.notes, `Sponsor: ${sponsorName}`, `Event: ${eventName}`].filter(Boolean).join("\\n");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SponsorMatch//DE",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(new Date().toISOString().slice(0,10), new Date().toTimeString().slice(0,5))}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${desc}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type:"text/calendar;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${summary.replace(/[^a-zA-Z0-9äöüÄÖÜß ]/g,"_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── CONTACTS HELPERS ──────────────────────────────────────────
const CONTACTS_KEY = (uid) => `contacts_v1_${uid}`;

const loadContacts = (uid) => {
  try { return JSON.parse(localStorage.getItem(CONTACTS_KEY(uid)) || "[]"); }
  catch { return []; }
};

const saveContactsToStorage = (uid, contacts) => {
  try { localStorage.setItem(CONTACTS_KEY(uid), JSON.stringify(contacts)); }
  catch(e) { console.warn("localStorage voll (contacts)."); }
};

// Merge pipeline sponsors into contacts list (email as unique key)
const mergeContactsFromProjects = (uid, projects, existingContacts) => {
  const contactMap = {};
  // seed with existing contacts
  existingContacts.forEach(c => { if (c.email) contactMap[c.email.toLowerCase()] = c; });

  projects.forEach(proj => {
    (proj.pipeline || []).forEach(sponsor => {
      if (!sponsor.email) return;
      const key = sponsor.email.toLowerCase();
      const histEntry = { eventName: proj.name, package: sponsor.package, status: sponsor.status, year: proj.date ? (/\d{4}/.exec(proj.date)?.[0] || "") : "", category: proj.category || "" };
      if (contactMap[key]) {
        // update existing: merge eventHistory
        const existing = contactMap[key];
        const alreadyHas = (existing.eventHistory || []).some(h => h.eventName === proj.name);
        if (!alreadyHas) {
          contactMap[key] = { ...existing, eventHistory: [...(existing.eventHistory || []), histEntry] };
        } else {
          // update existing entry status
          contactMap[key] = {
            ...existing,
            eventHistory: (existing.eventHistory || []).map(h =>
              h.eventName === proj.name ? { ...h, status: sponsor.status, package: sponsor.package, category: proj.category || "" } : h
            )
          };
        }
      } else {
        // create new contact from pipeline entry
        contactMap[key] = {
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "c" + Date.now() + Math.random().toString(36).slice(2),
          company: sponsor.company,
          contactName: sponsor.contact || "",
          email: sponsor.email,
          phone: "",
          notes: sponsor.notes || "",
          eventHistory: [histEntry],
        };
      }
    });
  });

  return Object.values(contactMap);
};

const getContactPreferences = (contact) => {
  const history = contact.eventHistory || [];
  if (history.length === 0) return null;
  const confirmed = history.filter(h => h.status === "confirmed");
  const conversionRate = Math.round((confirmed.length / history.length) * 100);
  const genreCount = {};
  confirmed.forEach(h => { if (h.category) genreCount[h.category] = (genreCount[h.category]||0)+1; });
  if (Object.keys(genreCount).length === 0) history.forEach(h => { if (h.category) genreCount[h.category] = (genreCount[h.category]||0)+1; });
  const topGenre = Object.entries(genreCount).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;
  const pkgCount = {};
  confirmed.forEach(h => { if (h.package) pkgCount[h.package] = (pkgCount[h.package]||0)+1; });
  if (Object.keys(pkgCount).length === 0) history.forEach(h => { if (h.package) pkgCount[h.package] = (pkgCount[h.package]||0)+1; });
  const topPackage = Object.entries(pkgCount).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;
  return { topGenre, topPackage, conversionRate, confirmedCount: confirmed.length, totalCount: history.length };
};

// ── Supabase Auth Error Translation ──────────────────────────
const translateAuthError = (msg) => {
  if (!msg) return "Unbekannter Fehler";
  if (msg.includes("Invalid login credentials")) return "E-Mail oder Passwort falsch.";
  if (msg.includes("User already registered")) return "Diese E-Mail ist bereits registriert.";
  if (msg.includes("Email not confirmed")) return "Bitte bestätige zuerst deine E-Mail.";
  if (msg.includes("Password should be at least")) return "Passwort muss mind. 6 Zeichen haben.";
  return "Fehler: " + msg;
};

// ── AUTH SCREENS ──────────────────────────────────────────────
function AuthScreen({ supabase, onAuthDone }) {
  const [mode, setMode] = useState("login"); // "login" | "register" | "reset" | "confirm"
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(""); // shown after signup
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async () => {
    if (!email || !pw) { setErr("Bitte alle Felder ausfüllen."); return; }
    setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) { setErr(translateAuthError(error.message)); return; }
    // user will be set via onAuthStateChange
  };

  const handleRegister = async () => {
    if (!orgName.trim()) { setErr("Bitte Organisationsname eingeben"); return; }
    if (!name || !email || !pw) { setErr("Bitte alle Felder ausfüllen."); return; }
    if (pw.length < 6) { setErr("Passwort muss mind. 6 Zeichen haben."); return; }
    setBusy(true); setErr("");
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pw,
      options: { data: { name, orgName } }
    });
    setBusy(false);
    if (error) { setErr(translateAuthError(error.message)); return; }
    // If email confirmation is required, show confirmation screen
    if (data?.user && !data.session) {
      setConfirmEmail(email);
      setMode("confirm");
    }
    // If session exists immediately (email confirmation disabled), onAuthStateChange handles it
  };

  const handleResetPassword = async () => {
    if (!email) { setErr("Bitte gib deine E-Mail-Adresse ein."); return; }
    setBusy(true); setErr("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`
    });
    setBusy(false);
    if (error) { setErr(translateAuthError(error.message)); return; }
    setResetSent(true);
  };

  const C = makeColors();
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",fontFamily:"'Helvetica Neue',Helvetica,sans-serif"}}>
      <div style={{width:"100%",maxWidth:360}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.6rem",marginBottom:"2.5rem",justifyContent:"center"}}>
          <div style={{width:36,height:36,background:C.accent,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center"}}><Zap size={18} strokeWidth={1.5} color="#fff"/></div>
          <span style={{fontSize:"1.2rem",fontWeight:800,letterSpacing:"-0.02em",color:C.text}}>SponsorMatch</span>
        </div>
        <div style={{background:C.surface,borderRadius:20,padding:"2rem",border:`1px solid ${C.border}`,boxShadow:"0 4px 24px rgba(0,0,0,0.06)"}}>

          {/* ── E-Mail-Bestätigung ── */}
          {mode==="confirm" && <>
            <div style={{fontSize:"1.1rem",fontWeight:800,marginBottom:"0.3rem",fontFamily:"Georgia,serif",color:C.text}}>E-Mail bestätigen</div>
            <div style={{fontSize:"0.82rem",color:C.textMid,lineHeight:1.5,marginBottom:"1.25rem"}}>
              Bitte bestätige deine E-Mail-Adresse. Wir haben dir eine E-Mail an <strong>{confirmEmail}</strong> geschickt.
            </div>
            <div style={{fontSize:"0.78rem",color:C.textMid,marginBottom:"1rem",textAlign:"center"}}>Schon bestätigt?</div>
            <button onClick={()=>{setMode("login");setErr("");}} style={{width:"100%",background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontSize:"0.9rem",fontWeight:700,cursor:"pointer"}}>
              Zum Login
            </button>
          </>}

          {/* ── Passwort vergessen ── */}
          {mode==="reset" && <>
            <div style={{fontSize:"1.1rem",fontWeight:800,marginBottom:"0.3rem",fontFamily:"Georgia,serif",color:C.text}}>Passwort zurücksetzen</div>
            <div style={{fontSize:"0.78rem",color:C.textMid,marginBottom:"1.5rem"}}>Gib deine E-Mail ein, um einen Reset-Link zu erhalten.</div>
            {resetSent ? (
              <>
                <div style={{fontSize:"0.82rem",color:C.green,marginBottom:"1rem",lineHeight:1.5}}>
                  Wir haben dir einen Link zum Zurücksetzen deines Passworts geschickt. Bitte prüfe dein Postfach.
                </div>
                <button onClick={()=>{setMode("login");setErr("");setResetSent(false);}} style={{width:"100%",background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontSize:"0.9rem",fontWeight:700,cursor:"pointer"}}>
                  Zurück zum Login
                </button>
              </>
            ) : (
              <>
                <Label C={C}>E-MAIL</Label>
                <input type="email" placeholder="name@firma.at" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleResetPassword()} style={{...mkInp(C),marginBottom:"0.75rem"}}/>
                {err && <div style={{fontSize:"0.75rem",color:"#dc2626",marginBottom:"0.75rem",display:"flex",alignItems:"center",gap:"0.35rem"}}><AlertCircle size={13} strokeWidth={1.5}/>{err}</div>}
                <button onClick={handleResetPassword} disabled={busy} style={{width:"100%",background:busy?C.textLight:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontSize:"0.9rem",fontWeight:700,cursor:busy?"not-allowed":"pointer",marginBottom:"1rem"}}>
                  {busy ? "Wird gesendet..." : "Reset-Link senden"}
                </button>
                <div style={{textAlign:"center",fontSize:"0.78rem",color:C.textMid}}>
                  <button onClick={()=>{setMode("login");setErr("");}} style={{background:"none",border:"none",color:C.accent,fontWeight:700,cursor:"pointer"}}>
                    Zurück zum Login
                  </button>
                </div>
              </>
            )}
          </>}

          {/* ── Login / Register ── */}
          {(mode==="login" || mode==="register") && <>
            <div style={{fontSize:"1.1rem",fontWeight:800,marginBottom:"0.3rem",fontFamily:"Georgia,serif",color:C.text}}>{mode==="login"?"Inhaber-Login":"Konto erstellen"}</div>
            <div style={{fontSize:"0.78rem",color:C.textMid,marginBottom:"1.5rem"}}>{mode==="login"?"Willkommen zurück!":"Starte deinen kostenlosen Account."}</div>
            {mode==="register" && <>
              <div style={{marginBottom:"0.85rem"}}>
                <div style={{fontSize:"0.7rem",fontWeight:700,color:C.textMid,letterSpacing:"0.08em",marginBottom:"0.35rem"}}>ORGANISATIONSNAME *</div>
                <input type="text" value={orgName} onChange={e=>setOrgName(e.target.value)} placeholder="z.B. Musterfirma GmbH" style={mkInp(C)} required/>
              </div>
              <Label C={C}>IHR NAME</Label>
              <input type="text" placeholder="Max Mustermann" value={name} onChange={e=>setName(e.target.value)} style={{...mkInp(C),marginBottom:"0.75rem"}}/>
            </>}
            <Label C={C}>E-MAIL</Label>
            <input type="email" placeholder="name@firma.at" value={email} onChange={e=>setEmail(e.target.value)} style={{...mkInp(C),marginBottom:"0.75rem"}}/>
            <Label C={C}>PASSWORT</Label>
            <input type="password" placeholder="Mind. 6 Zeichen" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(mode==="login"?handleLogin():handleRegister())} style={{...mkInp(C),marginBottom:"0.75rem"}}/>
            {err && <div style={{fontSize:"0.75rem",color:"#dc2626",marginBottom:"0.75rem",display:"flex",alignItems:"center",gap:"0.35rem"}}><AlertCircle size={13} strokeWidth={1.5}/>{err}</div>}
            <button onClick={mode==="login"?handleLogin:handleRegister} disabled={busy} style={{width:"100%",background:busy?C.textLight:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontSize:"0.9rem",fontWeight:700,cursor:busy?"not-allowed":"pointer",marginBottom:"0.75rem"}}>
              {busy ? "Bitte warten..." : (mode==="login"?"Einloggen \u2192":"Konto erstellen \u2192")}
            </button>
            {mode==="login" && (
              <div style={{textAlign:"center",marginBottom:"0.75rem"}}>
                <button onClick={()=>{setMode("reset");setErr("");}} style={{background:"none",border:"none",color:C.textLight,fontSize:"0.75rem",cursor:"pointer"}}>
                  Passwort vergessen?
                </button>
              </div>
            )}
            <div style={{textAlign:"center",fontSize:"0.78rem",color:C.textMid}}>
              {mode==="login"?"Noch kein Konto?":"Bereits registriert?"}
              <button onClick={()=>{setMode(mode==="login"?"register":"login");setErr("");if(mode==="register")setOrgName("");}} style={{background:"none",border:"none",color:C.accent,fontWeight:700,cursor:"pointer",marginLeft:"0.3rem"}}>
                {mode==="login"?"Jetzt registrieren":"Einloggen"}
              </button>
            </div>
          </>}

        </div>
      </div>
    </div>
  );
}


// ── KI SPONSOR SUCHE ─────────────────────────────────────────
function AISponsorSearch({ proj, C, onAdd }) {
  const [form, setForm] = useState({
    eventType: proj?.name || "",
    location: proj?.location || "",
    audience: proj?.audience || "",
    budget: "5000",
    industry: "",
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = async () => {
    setLoading(true); setError(null); setResults(null);
    try {
      const prompt = `Du bist ein Sponsoring-Experte für Veranstaltungen im deutschsprachigen Raum (Österreich, Deutschland, Schweiz).

Für folgende Veranstaltung sollen passende Sponsoren gefunden werden:
- Event: ${form.eventType}
- Standort: ${form.location}
- Erwartete Gäste: ${form.audience}
- Budget-Ziel pro Sponsor: ab €${form.budget}
- Branchen-Fokus: ${form.industry || "offen"}

Schlage genau 6 konkrete, reale Unternehmen vor, die als Sponsor gut passen würden. Bevorzuge regionale/nationale Unternehmen aus Österreich wenn der Standort österreichisch ist.

Antworte NUR mit einem JSON-Array ohne Markdown oder Erklärungen:
[
  {
    "company": "Firmenname",
    "industry": "Branche",
    "reason": "Kurze Begründung warum dieser Sponsor passt (1 Satz)",
    "contact": "Vorschlag für Ansprechpartner-Rolle (z.B. Marketing Manager)",
    "website": "website.at oder .com"
  }
]`;

      const res = await fetch("/api/ai/sponsors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, max_tokens: 1000 })
      });
      if (!res.ok) throw new Error("API Fehler");
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      const clean = text.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      setResults(parsed);
    } catch(e) {
      setError("Fehler beim Laden. Bitte nochmal versuchen.");
    }
    setLoading(false);
  };

  const mkI = (extra={}) => ({width:"100%",padding:"0.7rem 0.9rem",border:`1.5px solid ${C.border}`,borderRadius:10,background:C.bg,color:C.text,fontSize:"0.9rem",outline:"none",boxSizing:"border-box",fontFamily:"inherit",...extra});

  return (
    <div>
      <div style={{marginBottom:"1.25rem"}}>
        <h2 style={{fontSize:"1.3rem",fontWeight:800,margin:"0 0 0.2rem",fontFamily:"Georgia,serif"}}>KI Sponsor-Suche</h2>
        <div style={{fontSize:"0.75rem",color:C.textMid}}>Finde passende Unternehmen für dein Event</div>
      </div>

      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"1.25rem",marginBottom:"1.25rem"}}>
        <div style={{marginBottom:"0.85rem"}}>
          <div style={{fontSize:"0.65rem",fontWeight:600,color:C.textMid,marginBottom:"0.3rem",letterSpacing:"0.06em"}}>ART DER VERANSTALTUNG</div>
          <input type="text" value={form.eventType} onChange={e=>setForm(f=>({...f,eventType:e.target.value}))} placeholder="z.B. Business Konferenz, Musik Festival, Sportturnier" style={mkI()}/>
        </div>
        <div style={{marginBottom:"0.85rem"}}>
          <div style={{fontSize:"0.65rem",fontWeight:600,color:C.textMid,marginBottom:"0.3rem",letterSpacing:"0.06em"}}>STANDORT</div>
          <input type="text" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="z.B. Wien, Graz, Salzburg" style={mkI()}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem",marginBottom:"0.85rem"}}>
          <div>
            <div style={{fontSize:"0.65rem",fontWeight:600,color:C.textMid,marginBottom:"0.3rem",letterSpacing:"0.06em"}}>ERWARTETE GÄSTE</div>
            <input type="number" value={form.audience} onChange={e=>setForm(f=>({...f,audience:e.target.value}))} placeholder="500" style={mkI()}/>
          </div>
          <div>
            <div style={{fontSize:"0.65rem",fontWeight:600,color:C.textMid,marginBottom:"0.3rem",letterSpacing:"0.06em"}}>BUDGET AB (€)</div>
            <input type="number" value={form.budget} onChange={e=>setForm(f=>({...f,budget:e.target.value}))} placeholder="5000" style={mkI()}/>
          </div>
        </div>
        <div style={{marginBottom:"1rem"}}>
          <div style={{fontSize:"0.65rem",fontWeight:600,color:C.textMid,marginBottom:"0.3rem",letterSpacing:"0.06em"}}>BRANCHEN-FOKUS (optional)</div>
          <input type="text" value={form.industry} onChange={e=>setForm(f=>({...f,industry:e.target.value}))} placeholder="z.B. Technologie, Finanzen, Handel, offen für alle" style={mkI()}/>
        </div>
        <button onClick={search} disabled={loading||!form.eventType||!form.location} style={{width:"100%",background:loading?C.textLight:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.95rem",fontSize:"0.9rem",fontWeight:700,cursor:loading?"not-allowed":"pointer",transition:"background 0.2s"}}>
          {loading ? "KI sucht passende Sponsoren..." : "Sponsoren finden"}
        </button>
      </div>

      {error && <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:12,padding:"1rem",color:"#dc2626",fontSize:"0.82rem",marginBottom:"1.25rem"}}>{error}</div>}

      {results && <div>
        <div style={{fontSize:"0.75rem",fontWeight:600,color:C.textMid,marginBottom:"0.75rem",display:"flex",alignItems:"center",gap:"0.4rem"}}><Target size={13} strokeWidth={1.5}/>{results.length} passende Sponsoren gefunden</div>
        {results.map((r,i)=>(
          <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"1.1rem",marginBottom:"0.75rem"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.5rem"}}>
              <div>
                <div style={{fontSize:"0.95rem",fontWeight:800}}>{r.company}</div>
                <div style={{fontSize:"0.72rem",color:C.accent,fontWeight:600}}>{r.industry}</div>
              </div>
              <button onClick={()=>onAdd({company:r.company,contact:r.contact,email:"",notes:r.website ? `Website: ${r.website}` : ""})} style={{background:C.accentSoft,color:C.accent,border:`1px solid ${C.accentBorder}`,borderRadius:9,padding:"0.35rem 0.75rem",fontSize:"0.72rem",fontWeight:700,cursor:"pointer",flexShrink:0}}>+ Pipeline</button>
            </div>
            <div style={{fontSize:"0.8rem",color:C.textMid,lineHeight:1.5,marginBottom:"0.5rem"}}>{r.reason}</div>
            <div style={{display:"flex",gap:"0.75rem",fontSize:"0.7rem",color:C.textLight}}>
              <span style={{display:"flex",alignItems:"center",gap:"0.3rem"}}><User size={11} strokeWidth={1.5}/>{r.contact}</span>
              {r.website && <span style={{display:"flex",alignItems:"center",gap:"0.3rem"}}><Globe size={11} strokeWidth={1.5}/>{r.website}</span>}
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────


// Lazy init — verhindert Crash beim SSR-Prerendering ohne Env-Vars
let _supabaseInstance = null;
const supabase = new Proxy({}, {
  get(_, prop) {
    if (!_supabaseInstance) _supabaseInstance = createClient();
    const val = _supabaseInstance[prop];
    return typeof val === 'function' ? val.bind(_supabaseInstance) : val;
  }
});

export default function SponsorMatch() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [notif, setNotif] = useState(null);
  const [dashFilter, setDashFilter] = useState(null); // null | "confirmed" | "pipeline" | "active" | "conversion"
  const [confirmDeleteSponsor, setConfirmDeleteSponsor] = useState(null); // sponsor id oder null
  const [sendingEmail, setSendingEmail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showNewProj, setShowNewProj] = useState(false);
  const [showEditProj, setShowEditProj] = useState(false);
  const [confirmDeleteProj, setConfirmDeleteProj] = useState(false);
  const [deleteProjSource, setDeleteProjSource] = useState('edit'); // 'edit' | 'list'
  const [showEditMehrwert, setShowEditMehrwert] = useState(false);
  const [showBranding, setShowBranding] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [showPitchEditor, setShowPitchEditor] = useState(null); // sponsor object
  const [editPkg, setEditPkg] = useState(null);
  const [showAddPkg, setShowAddPkg] = useState(false);
  const [newPkg, setNewPkg] = useState({ name:"", price:5000, slots:2, color:"#e8500a", benefits:[""] });
  const [confirmDeletePkg, setConfirmDeletePkg] = useState(null); // pkg-Objekt oder null
  const [selectedPkgId, setSelectedPkgId] = useState(null);
  const [editSponsor, setEditSponsor] = useState(null);
  const [editSponsorTab, setEditSponsorTab] = useState("details"); // "details" | "calls" | "appointments"
  const [newPackageExtra, setNewPackageExtra] = useState("");
  const [newAgrBenefit, setNewAgrBenefit] = useState("");
  const [showAddCall, setShowAddCall] = useState(false);
  const [newCall, setNewCall] = useState({ date: new Date().toISOString().slice(0,10), duration:"", result:"interested", notes:"" });
  const [showAddApt, setShowAddApt] = useState(false);
  const [newApt, setNewApt] = useState({ date: new Date().toISOString().slice(0,10), time:"10:00", title:"", notes:"" });
  const [newSponsor, setNewSponsor] = useState({ company:"", contact:"", email:"", phone:"", package:"Gold", notes:"", contactId:null });
  const [addSponsorMode, setAddSponsorMode] = useState("contacts"); // "contacts" | "manual"
  const [sponsorContactSearch, setSponsorContactSearch] = useState("");
  const [newProj, setNewProj] = useState({ name:"", date:"", location:"", audience:"", reach:"", email:"", description:"", banner:null, category:"" });
  const [editProjData, setEditProjData] = useState(null);
  const [editMehrwertData, setEditMehrwertData] = useState(null);
  const [pitchText, setPitchText] = useState("");
  const bannerInputRef = useRef(null);
  const editBannerInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const notifTimerRef = useRef(null);
  const pdfInputRef = useRef(null);
  const agreementPhotoInputRef = useRef(null);
  const matLogoInputRef = useRef(null);
  const matVideoInputRef = useRef(null);
  const matFileInputRef = useRef(null);

  const notify = useCallback((msg) => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    setNotif(msg);
    notifTimerRef.current = setTimeout(() => setNotif(null), 3000);
  }, []);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  // ── TIER / UPGRADE STATE ─────────────────────────────────────
  const [showUpgrade, setShowUpgrade] = useState(null); // null | { feature: string, requiredTier: 'pro'|'max' }

  // ── CONTACTS STATE ──────────────────────────────────────────
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);
  const [editContact, setEditContact] = useState(null); // contact object or null
  const [confirmDeleteContact, setConfirmDeleteContact] = useState(null); // contact or null
  const [newContact, setNewContact] = useState({ company:"", contactName:"", email:"", phone:"", notes:"" });

  // ── CALENDAR STATE ───────────────────────────────────────────
  const [calendarView, setCalendarView] = useState("list"); // "month" | "list"
  const [calendarMonth, setCalendarMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [calendarDaySelected, setCalendarDaySelected] = useState(null); // "YYYY-MM-DD" or null
  const [previewPkgId, setPreviewPkgId] = useState(null); // selected package in preview

  // ── TEMPLATE SYSTEM STATE ────────────────────────────────────
  const [showTemplateSelect, setShowTemplateSelect] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateSource, setTemplateSource] = useState(null); // source project
  const [templateData, setTemplateData] = useState(null); // form data
  const [templateHistoryOpen, setTemplateHistoryOpen] = useState(false);
  const [showRechnungsOverview, setShowRechnungsOverview] = useState(true);

  const loadBranding = useCallback((uid) => {
    try {
      const raw = localStorage.getItem(`sm_branding_${uid}`);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return null;
  }, []);

  // TODO (Leopold): Tier aus Supabase profiles-Tabelle laden sobald Stripe-Webhook aktiv ist.
  // localStorage ist als Übergangs-Lösung bis zur Supabase-Integration akzeptiert.
  const loadTier = useCallback((uid) => {
    try {
      const raw = localStorage.getItem(`sm_tier_${uid}`);
      if (raw === 'pro' || raw === 'max') return raw;
    } catch { /* ignore */ }
    return 'free';
  }, []);

  const initUserData = useCallback(async (uid) => {
    try {
      const data = await loadAllUserData(uid);

      if (data.events.length > 0 || data.contacts.length > 0) {
        // Supabase ist Source of Truth
        const projs = assembleProjects(data);
        const contactsList = assembleContacts(data);
        const finalProjs = projs.length > 0 ? projs : INITIAL_PROJECTS(uid);
        setProjects(finalProjs);
        setActiveId(finalProjs[0]?.id || null);
        setContacts(contactsList);
      } else {
        // Kein Supabase-Daten — localStorage laden
        const stored = localStorage.getItem(`sm_projects_${uid}`);
        const projs = stored ? JSON.parse(stored) : INITIAL_PROJECTS(uid);
        setProjects(projs);
        setActiveId(projs[0]?.id || null);
        const existing = loadContacts(uid);
        const merged = mergeContactsFromProjects(uid, projs, existing);
        saveContactsToStorage(uid, merged);
        setContacts(merged);
        // Einmalige Migration anstoßen (fire-and-forget)
        if (stored) {
          migrateLocalStorageToSupabase(uid).catch(err =>
            console.warn('Migration fehlgeschlagen:', err)
          );
        }
      }
    } catch (err) {
      console.warn('Supabase load failed, fallback to localStorage:', err);
      const stored = localStorage.getItem(`sm_projects_${uid}`);
      const projs = stored ? JSON.parse(stored) : INITIAL_PROJECTS(uid);
      setProjects(projs);
      setActiveId(projs[0]?.id || null);
      const existing = loadContacts(uid);
      const merged = mergeContactsFromProjects(uid, projs, existing);
      saveContactsToStorage(uid, merged);
      setContacts(merged);
    }

    // Branding + Tier immer aus localStorage (bis Stripe aktiv ist)
    const branding = loadBranding(uid);
    if (branding) setUser(prev => prev ? { ...prev, ...branding } : prev);
    const tier = loadTier(uid);
    setUser(prev => prev ? { ...prev, tier } : prev);

    // Rolle aus Supabase-Profil laden (admin/member)
    try {
      const profile = await getUserProfile(uid);
      setUser(prev => prev ? { ...prev, role: profile.role } : prev);
    } catch (e) {
      console.warn('getUserProfile failed, defaulting to admin:', e);
      setUser(prev => prev ? { ...prev, role: 'admin' } : prev);
    }

    // Dev-Tier-Override via URL-Parameter (?devtier=pro|max|free)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const devTier = params.get('devtier');
      if (devTier === 'pro' || devTier === 'max' || devTier === 'free') {
        localStorage.setItem(`sm_tier_${uid}`, devTier);
        setUser(prev => prev ? { ...prev, tier: devTier } : prev);
        // URL-Parameter entfernen ohne Page-Reload
        const url = new URL(window.location.href);
        url.searchParams.delete('devtier');
        window.history.replaceState({}, '', url.toString());
      }
    }

    // Pending Invite annehmen (eingeloggter User kam via Invite-Link)
    if (typeof window !== 'undefined') {
      const pendingToken = sessionStorage.getItem('pendingInvite');
      if (pendingToken) {
        sessionStorage.removeItem('pendingInvite');
        try {
          const res = await fetch('/api/team/invite/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: pendingToken }),
          });
          const data = await res.json();
          if (res.ok && data.ok) {
            notify('Einladung angenommen — willkommen im Team!');
            // Rolle + Team neu laden
            try {
              const profile = await getUserProfile(uid);
              setUser(prev => prev ? { ...prev, role: profile.role, organization_id: profile.organization_id } : prev);
            } catch { /* already handled above */ }
            loadTeam();
          } else if (data.error) {
            notify('Einladung fehlgeschlagen: ' + data.error);
          }
        } catch {
          notify('Einladung konnte nicht verarbeitet werden');
        }
        // invite-Parameter aus URL entfernen
        const url = new URL(window.location.href);
        if (url.searchParams.has('invite')) {
          url.searchParams.delete('invite');
          window.history.replaceState({}, '', url.toString());
        }
      }
    }
  }, [loadBranding, loadTier]);

  // ── Supabase Auth State Management ────────────────────────────
  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        setUser({
          id: u.id,
          name: u.user_metadata?.name || u.email?.split("@")[0] || "",
          email: u.email || "",
          accent: "#07929B",
          logo: null,
          bio: "",
          facebook: "",
          instagram: "",
          linkedin: "",
          website: "",
          mwst: "0",
        });
        initUserData(u.id);
      }
      setAuthLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        setUser(prev => {
          // Preserve branding settings if user was already loaded
          const base = prev && prev.id === u.id ? prev : {
            accent: "#07929B",
            logo: null,
            bio: "",
            facebook: "",
            instagram: "",
            linkedin: "",
            website: "",
            mwst: "0",
          };
          return {
            ...base,
            id: u.id,
            name: u.user_metadata?.name || prev?.name || u.email?.split("@")[0] || "",
            email: u.email || "",
          };
        });
        initUserData(u.id);
        if (_event === 'SIGNED_IN') {
          fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: 'dashboard', type: 'login' }) }).catch(()=>{});
        }
      } else {
        setUser(null);
        setProjects([]);
        setContacts([]);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [initUserData]);

  // Track page changes
  useEffect(() => {
    if (!user?.id) return;
    const proj = projects.find(p => p.id === activeId);
    fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page, eventName: proj?.name || null }) }).catch(()=>{});
  }, [page, user?.id]);

  const saveProjects = (ps, uid) => {
    // 1. React State sofort setzen (optimistic)
    setProjects(ps);
    // 2. Re-merge contacts
    const merged = mergeContactsFromProjects(uid, ps, contacts);
    saveContactsToStorage(uid, merged);
    setContacts(merged);
    // 3. localStorage Fallback (Bilder weglassen wegen 5MB Limit)
    const stripped = ps.map(p => ({ ...p, banner: null, gallery: [] }));
    try { localStorage.setItem(`sm_projects_${uid}`, JSON.stringify(stripped)); }
    catch(e) { console.warn("localStorage voll."); }
    // 4. Supabase Dual-Write (fire-and-forget)
    (async () => {
      try {
        const orgId = await getUserOrgId(uid);
        let idChanged = false;
        const updated = await Promise.all(ps.map(async (proj, i) => {
          const event = await upsertEvent(mapProjectToEventInsert(proj, uid, i, orgId));
          const eventId = event.id;
          // If Supabase assigned a new UUID (local id was not a valid UUID), patch project
          const patchedProj = eventId !== proj.id ? { ...proj, id: eventId } : proj;
          if (eventId !== proj.id) idChanged = true;
          await Promise.all([
            replacePackages(eventId, (patchedProj.packages || []).map((pkg, i) => mapPackageToInsert(pkg, eventId, i))),
            replaceMehrwert(eventId, (patchedProj.mehrwert || []).map((m, i) => mapMehrwertToInsert(m, eventId, i))),
          ]);
          await Promise.all(
            (patchedProj.pipeline || []).map(async entry => {
              const savedEntry = await upsertPipelineEntry(mapPipelineToInsert(entry, eventId));
              // Calls & Appointments für diesen Pipeline-Eintrag schreiben
              if (entry.calls?.length) {
                await Promise.all(entry.calls.map(call => upsertCall(mapCallToInsert(call, savedEntry.id))));
              }
              if (entry.appointments?.length) {
                await Promise.all(entry.appointments.map(apt => upsertAppointment(mapAppointmentToInsert(apt, savedEntry.id))));
              }
            })
          );
          return patchedProj;
        }));
        // If any project got a new UUID from Supabase, sync state + localStorage
        if (idChanged) {
          setProjects(updated);
          setActiveId(prev => {
            const match = updated.find((p, i) => ps[i]?.id === prev);
            return match ? match.id : (updated[0]?.id || prev);
          });
          try { localStorage.setItem(`sm_projects_${uid}`, JSON.stringify(updated.map(p => ({ ...p, banner: null, gallery: [] })))); }
          catch(e) { /* ignore */ }
        }
      } catch (err) {
        console.warn('Supabase dual-write (projects) failed:', err);
      }
    })();
  };

  const saveContacts = (cs) => {
    setContacts(cs);
    saveContactsToStorage(user.id, cs);
    // Supabase Dual-Write (fire-and-forget)
    (async () => {
      try {
        const orgId = await getUserOrgId(user.id);
        await Promise.all(cs.map(c => upsertContact(mapContactToInsert(c, user.id, orgId))));
      } catch(err) { console.warn('Supabase dual-write (contacts) failed:', err); }
    })();
  };

  const addContact = () => {
    if (!newContact.company) return;
    const c = { ...newContact, id: newId(), eventHistory: [] };
    const updated = [...contacts, c];
    saveContacts(updated);
    setNewContact({ company:"", contactName:"", email:"", phone:"", notes:"" });
    setShowAddContact(false);
    notify("Kontakt hinzugefügt");
  };

  const saveEditContact = () => {
    const updated = contacts.map(c => c.id === editContact.id ? editContact : c);
    saveContacts(updated);
    setEditContact(null);
    notify("Kontakt gespeichert");
  };

  const deleteContact = (c) => {
    const updated = contacts.filter(x => x.id !== c.id);
    saveContacts(updated);
    setConfirmDeleteContact(null);
    setEditContact(null);
    deleteContactDb(c.id); // Fire-and-forget
    notify("Kontakt gelöscht");
  };

  const deleteSponsor = (id) => {
    updProj(p => ({ ...p, pipeline: p.pipeline.filter(s => s.id !== id) }));
    setConfirmDeleteSponsor(null);
    if (selected?.id === id) setSelected(null);
    deletePipelineEntry(id); // Fire-and-forget
    notify("Sponsor gelöscht");
  };

  // Loading state while checking session
  if (authLoading) {
    const LC = makeColors();
    return (
      <div style={{minHeight:"100vh",background:LC.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Helvetica Neue',Helvetica,sans-serif"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem"}}>
          <Loader2 size={32} strokeWidth={1.5} color={LC.accent} style={{animation:"spin 1s linear infinite"}}/>
          <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
          <span style={{fontSize:"0.85rem",color:LC.textMid}}>Wird geladen...</span>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen supabase={supabase} />;

  const C = makeColors(user.accent||"#07929B");
  const proj = projects.find(p=>p.id===activeId);
  if (!proj) return <div style={{padding:"2rem",textAlign:"center"}}>Kein Event gefunden.</div>;

  const updProj = fn => { const ps = projects.map(p=>p.id===activeId?fn(p):p); saveProjects(ps, user.id); };
  const updAnyProj = (projId, fn) => { const ps = projects.map(p=>p.id===projId?fn(p):p); saveProjects(ps, user.id); };
  const confirmed = proj.pipeline.filter(s=>s.status==="confirmed").reduce((a,s)=>a+s.value,0);
  const pTotal = proj.pipeline.reduce((a,s)=>a+s.value,0);


  const emailTemplate = (eventName, bodyHtml) => `<!DOCTYPE html><html><body style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;"><div style="border-bottom:3px solid #e8500a;padding-bottom:16px;margin-bottom:24px;"><h1 style="font-family:Georgia,serif;color:#e8500a;margin:0;">${eventName}</h1><p style="margin:4px 0 0;color:#666;">Sponsoring-Anfrage</p></div>${bodyHtml}<div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999;">Gesendet via SponsorMatch &middot; sponsormatch-iota.vercel.app</div></body></html>`;

  const sendEmail = async ({ to, subject, body, onSuccess, onError }) => {
    setSendingEmail(true);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          html: body.replace(/\n/g, '<br>'),
          replyTo: user?.email,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify("E-Mail erfolgreich gesendet");
      onSuccess?.();
    } catch (err) {
      notify("Fehler: " + err.message);
      onError?.();
    } finally {
      setSendingEmail(false);
    }
  };

  const handleImgUpload = (e, setter, isEdit = false) => {
    const file = e.target.files[0]; if (!file) return;
    // Sofort-Vorschau via FileReader
    const r = new FileReader();
    r.onload = ev => setter(s => ({ ...s, banner: ev.target.result }));
    r.readAsDataURL(file);
    // Supabase Upload nur beim Edit-Modus (Projekt existiert bereits)
    if (isEdit && user?.id && activeId) {
      setBannerUploading(true);
      uploadEventBanner(user.id, activeId, file)
        .then(url => {
          updProj(p => ({ ...p, banner: url }));
          setter(s => ({ ...s, banner: url }));
        })
        .catch(err => {
          console.warn('Banner upload failed:', err);
          notify("Banner-Upload fehlgeschlagen: " + err.message);
        })
        .finally(() => setBannerUploading(false));
    }
  };
  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !user?.id || !activeId) return;
    setGalleryUploading(true);
    try {
      await Promise.all(files.map(async (file) => {
        try {
          const url = await uploadGalleryImage(user.id, activeId, file);
          updProj(p => ({ ...p, gallery: [...(p.gallery || []), { id: "g" + Date.now() + Math.random(), url: url }] }));
        } catch (err) {
          console.warn('Gallery upload failed:', err);
          notify("Upload fehlgeschlagen: " + err.message);
        }
      }));
      notify("Fotos hochgeladen");
    } finally {
      setGalleryUploading(false);
      e.target.value = "";
    }
  };
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/logo.${fileExt}`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    if (error) { notify('Fehler beim Hochladen: ' + error.message); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const logoUrl = data.publicUrl;
    const u2 = { ...user, logo: logoUrl };
    setUser(u2);
    try { localStorage.setItem(`sm_branding_${user.id}`, JSON.stringify({ accent:u2.accent, logo:u2.logo, bio:u2.bio, facebook:u2.facebook, instagram:u2.instagram, linkedin:u2.linkedin, website:u2.website, mwst:u2.mwst, name:u2.name })); }
    catch(e2) { console.warn("localStorage write error (logo)."); }
    supabase.from('profiles').update({ logo_url: logoUrl }).eq('id', user.id);
  };

  const addSponsor = () => {
    if (!canAddPipelineContact(user?.tier||'free', proj.pipeline.length)) {
      setShowUpgrade({feature:'maxPipelineContacts',label:'Unbegrenzte Pipeline-Kontakte',requiredTier:'pro'});
      return;
    }
    const pkg = proj.packages.find(p=>p.name===newSponsor.package);
    updProj(p=>({...p,pipeline:[...p.pipeline,{...newSponsor,id:newId(),status:"draft",value:pkg?.price||5000,opened:"—",pitchSent:false}]}));
    setNewSponsor({company:"",contact:"",email:"",phone:"",package:proj.packages[0]?.name||"",notes:"",contactId:null});
    setSponsorContactSearch("");
    setAddSponsorMode("contacts");
    setShowAdd(false);
    notify("Sponsor hinzugefügt");
  };

  const saveEditSponsor = () => {
    const updated = {...editSponsor};
    updProj(p=>({...p,pipeline:p.pipeline.map(s=>s.id===updated.id?updated:s)}));
    setEditSponsor(null); setEditSponsorTab("details"); setShowAddCall(false); setShowAddApt(false);
    setSelected(updated); notify("Sponsor aktualisiert");
  };

  const sendPitch = (sponsor, text) => {
    const subject = `Sponsoring-Anfrage: ${proj.name}`;
    const plainBody = text || `Hallo ${sponsor.contact},\n\nvielen Dank für dein Interesse an ${proj.name}!\n\nWir würden uns freuen, dich als Sponsor begrüßen zu dürfen.\n\nMit freundlichen Grüßen\n${user.name}`;
    const htmlBody = emailTemplate(proj.name, plainBody.replace(/\n/g, '<br>'));
    sendEmail({
      to: sponsor.email,
      subject,
      body: htmlBody,
      onSuccess: () => {
        updProj(p=>({...p,pipeline:p.pipeline.map(s=>s.id===sponsor.id?{...s,status:"sent",opened:"gerade eben",pitchSent:true}:s)}));
        setShowPitchEditor(null); setSelected(null);
      },
    });
  };

  const updStatus = (id,status) => {
    updProj(p=>({...p,pipeline:p.pipeline.map(s=>{
      if(s.id!==id) return s;
      const updated = {...s,status};
      const pkg = p.packages.find(pk=>pk.name===s.package);
      const benefits = pkg?.benefits||[];
      const today = new Date().toISOString().slice(0,10);
      // Init agreement when entering negotiation (if not already there)
      if(status==="negotiating" && !updated.agreement) {
        updated.agreement = {
          signed: false,
          signedDate: "",
          customText: "",
          benefitChecklist: benefits.map(b=>({benefit:b,done:false})),
        };
        updated.postEventDoc = { report:"", reach:"", sentToSponsor:false, sentDate:"" };
      }
      // Auto-confirm agreement when status set to confirmed
      if(status==="confirmed") {
        if(!updated.agreement) {
          updated.agreement = {
            signed: true,
            signedDate: today,
            customText: "",
            benefitChecklist: benefits.map(b=>({benefit:b,done:false})),
          };
          updated.postEventDoc = { report:"", reach:"", sentToSponsor:false, sentDate:"" };
        } else {
          updated.agreement = { ...updated.agreement, signed: true, signedDate: updated.agreement.signedDate || today };
        }
      }
      return updated;
    })}));
    if(selected?.id===id) setSelected(s=>({...s,status}));
    notify(`Status → ${STATUS_CONFIG[status].label}`);
  };

  const createProj = () => {
    const id = newId();
    const ps = [...projects, {...newProj,id,uid:user.id,audience:parseInt(newProj.audience)||0,category:EVENT_CATEGORIES.includes(newProj.category)?newProj.category:"",packages:DEFAULT_PACKAGES(),pipeline:[],gallery:[],mehrwert:DEFAULT_MEHRWERT()}];
    saveProjects(ps, user.id); setActiveId(id);
    setNewProj({name:"",date:"",location:"",audience:"",reach:"",email:"",description:"",banner:null,category:""});
    setShowNewProj(false); setShowProjects(false); setPage("dashboard"); notify("Event erstellt");
  };

  const openTemplateSelect = () => {
    setShowNewProj(false);
    setShowProjects(false);
    setShowTemplateSelect(true);
  };

  const selectTemplate = (sourceProj) => {
    setTemplateSource(sourceProj);
    setTemplateData({
      name: sourceProj.name,
      date: sourceProj.date,
      location: sourceProj.location,
      audience: String(sourceProj.audience || ""),
      reach: sourceProj.reach || "",
      email: sourceProj.email || "",
      description: sourceProj.description || "",
      banner: null,
      category: sourceProj.category || "",
    });
    setTemplateHistoryOpen(false);
    setShowTemplateSelect(false);
    setShowTemplateForm(true);
  };

  const createFromTemplate = () => {
    if (!templateData || !templateData.name) return;
    const id = newId();
    // Copy packages but reset taken counts; pipeline is empty
    const packages = (templateSource.packages || DEFAULT_PACKAGES()).map(pkg => ({ ...pkg, id:newId(), taken:0 }));
    const ps = [...projects, {
      ...templateData,
      id,
      uid: user.id,
      audience: parseInt(templateData.audience) || 0,
      packages,
      pipeline: [],
      gallery: [],
      mehrwert: templateSource.mehrwert ? [...templateSource.mehrwert] : DEFAULT_MEHRWERT(),
    }];
    saveProjects(ps, user.id);
    setActiveId(id);
    setTemplateData(null);
    setTemplateSource(null);
    setShowTemplateForm(false);
    setShowProjects(false);
    setPage("dashboard");
    notify("Event aus Template erstellt");
  };

  const saveEditProj = () => {
    const ps = projects.map(p=>p.id===activeId?{...p,...editProjData,audience:parseInt(editProjData.audience)||p.audience,category:EVENT_CATEGORIES.includes(editProjData.category)?editProjData.category:p.category||""}:p);
    saveProjects(ps, user.id); setShowEditProj(false); notify("Event gespeichert");
  };

  const deleteProj = () => {
    const idToDelete = activeId;
    const remaining = projects.filter(p=>p.id!==idToDelete);
    if (remaining.length === 0) {
      // Letztes Event: neues Beispiel-Event anlegen statt leer zu lassen
      const fallback = INITIAL_PROJECTS(user.id);
      saveProjects(fallback, user.id);
      setActiveId(fallback[0].id);
    } else {
      saveProjects(remaining, user.id);
      setActiveId(remaining[0].id);
    }
    // Supabase: Event wirklich löschen (fire-and-forget)
    deleteEvent(idToDelete).catch(err => console.warn('deleteEvent failed:', err));
    setConfirmDeleteProj(false);
    setShowEditProj(false);
    setPage("dashboard");
    notify("Event gelöscht");
  };

  const savePkg = () => {
    if (!editPkg.name || editPkg.price <= 0 || editPkg.slots < 1) return;
    updProj(p=>({...p,packages:p.packages.map(pk=>pk.id===editPkg.id?editPkg:pk)})); setEditPkg(null); notify("Paket gespeichert");
  };

  const addPkg = () => {
    if (!newPkg.name || newPkg.price <= 0) return;
    const pkg = { ...newPkg, id:newId(), taken:0, benefits:newPkg.benefits.filter(b=>b.trim()) };
    updProj(p=>({...p, packages:[...p.packages, pkg]}));
    setNewPkg({ name:"", price:5000, slots:2, color:"#e8500a", benefits:[""] });
    setShowAddPkg(false);
    notify("Paket hinzugefügt");
  };

  // TODO (Leopold): Pipeline auf packageId-Referenzen umstellen sobald Supabase-Schema definiert ist.
  // Aktuell: Bereinigung via pkg.name — funktioniert solange Paketnamen nicht vor dem Löschen geändert werden.
  const deletePkg = (pkg) => {
    const remainingPackages = proj.packages.filter(pk=>pk.id!==pkg.id);
    updProj(p=>({
      ...p,
      packages: remainingPackages,
      pipeline: p.pipeline.map(s=>s.package===pkg.name ? {...s, package:""} : s)
    }));
    setConfirmDeletePkg(null);
    setEditPkg(null);
    setSelectedPkgId(null); // Fix 3: selectedPkgId nach Löschen zurücksetzen
    notify("Paket gelöscht");
  };

  const saveMehrwert = () => { updProj(p=>({...p,mehrwert:editMehrwertData})); setShowEditMehrwert(false); notify("Mehrwert gespeichert"); };

  const saveBranding = () => {
    const u2 = {...user};
    setUser(u2);
    try { localStorage.setItem(`sm_branding_${user.id}`, JSON.stringify({ accent:u2.accent, logo:u2.logo, bio:u2.bio, facebook:u2.facebook, instagram:u2.instagram, linkedin:u2.linkedin, website:u2.website, mwst:u2.mwst, name:u2.name })); }
    catch(e) { console.warn("localStorage voll (branding)."); }
    // Sync branding to profiles table (fire-and-forget)
    if (user?.id) {
      supabase.from('profiles').update({
        name: u2.name, accent: u2.accent, logo_url: u2.logo,
        bio: u2.bio, website: u2.website, facebook: u2.facebook,
        instagram: u2.instagram, linkedin: u2.linkedin, mwst: u2.mwst
      }).eq('id', user.id);
    }
    setShowBranding(false); notify("Branding gespeichert");
  };

  const loadTeam = async () => {
    if (!user?.id) return;
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch('/api/team/members'),
        fetch('/api/team/invites'),
      ]);
      if (membersRes.ok) setTeamMembers(await membersRes.json());
      if (invitesRes.ok) setPendingInvites(await invitesRes.json());
    } catch(e) { console.warn('loadTeam failed:', e); }
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return;
    setSendingInvite(true);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInviteEmail("");
      await loadTeam();
      notify("Einladung gesendet");
    } catch(e) { notify("Fehler: " + e.message); }
    finally { setSendingInvite(false); }
  };

  const removeTeamMember = async (memberId) => {
    try {
      const res = await fetch(`/api/team/members?id=${memberId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadTeam();
      notify("Mitglied entfernt");
    } catch(e) { notify("Fehler: " + e.message); }
  };

  const cancelInvite = async (inviteId) => {
    try {
      const res = await fetch(`/api/team/invites?id=${inviteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadTeam();
      notify("Einladung zurückgezogen");
    } catch(e) { notify("Fehler: " + e.message); }
  };

  return (
    <div style={{width:"100%",minHeight:"100vh",background:C.bg,fontFamily:"'Helvetica Neue',Helvetica,sans-serif",color:C.text,paddingBottom:"calc(80px + env(safe-area-inset-bottom, 0px))"}}>
      <style>{`* { box-sizing:border-box } button,input,select,textarea,div[contenteditable] { font-family:inherit }`}</style>

      {/* Toast — immer im DOM, Inhalt wechselt */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sm-toast"
        style={{
          position:"fixed", top:24, left:"50%", transform:"translateX(-50%)",
          background: notif ? C.surface : "transparent",
          border: notif ? `1px solid ${C.border}` : "none",
          borderRadius: 12,
          padding: notif ? "0.65rem 1.1rem" : "0",
          boxShadow: notif ? "0 2px 12px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)" : "none",
          display:"flex", alignItems:"center", gap:"0.5rem",
          fontSize:"0.85rem", fontWeight:600, color: C.text,
          zIndex:9999,
          pointerEvents: notif ? "auto" : "none",
          transition: "opacity 0.18s ease",
          opacity: notif ? 1 : 0,
        }}
      >
        {notif && <CheckCircle size={14} strokeWidth={2} style={{color: C.accent, flexShrink:0}} />}
        {notif || ""}
      </div>

      {/* PROJECT SWITCHER */}
      {showProjects && <Sheet onClose={()=>setShowProjects(false)} C={C}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem"}}>
          <div style={{fontSize:"1.1rem",fontWeight:800}}>Meine Events</div>
          <button onClick={()=>{setShowProjects(false);setShowBranding(true);loadTeam();}} style={{fontSize:"0.8rem",color:C.accent,background:C.accentSoft,border:`1px solid ${C.accentBorder}`,borderRadius:8,padding:"0.35rem 0.75rem",cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",gap:"0.35rem"}}><Settings size={13} strokeWidth={1.5}/>Branding</button>
        </div>
        {/* Prominenter "Neues Event" Button ganz oben */}
        <button onClick={()=>{
            if(!canCreateEvent(user?.tier||'free', projects.length)){
              setShowProjects(false);
              setShowUpgrade({feature:'maxEvents',label:'Unbegrenzte Events',requiredTier:'pro'});
              return;
            }
            setShowProjects(false);setShowNewProj(true);
          }}
          style={{width:"100%",background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.95rem",fontSize:"0.95rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",boxShadow:`0 2px 10px ${C.accent}44`,marginBottom:"1rem",transition:"opacity 0.15s"}}
          onMouseEnter={e=>e.currentTarget.style.opacity="0.88"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
          <Plus size={16} strokeWidth={2}/>Neues Event anlegen
          {!canCreateEvent(user?.tier||'free', projects.length) && <span style={{fontSize:"0.65rem",background:"rgba(255,255,255,0.25)",borderRadius:99,padding:"0.15rem 0.45rem",marginLeft:"auto"}}>Upgrade</span>}
        </button>
        {projects.map(p=>(
          <div key={p.id} onClick={()=>{setActiveId(p.id);setShowProjects(false);setPage("dashboard");}}
            style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"1rem 1.1rem",borderRadius:12,border:`2px solid ${p.id===activeId?C.accent:C.border}`,background:p.id===activeId?C.accentSoft:C.surface,marginBottom:"0.7rem",cursor:"pointer",transition:"box-shadow 0.12s"}}
            onMouseEnter={e=>{ if(p.id!==activeId) e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.07)"; }} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:"0.95rem",fontWeight:700,marginBottom:"0.15rem"}}>{p.name}</div>
              <div style={{fontSize:"0.78rem",color:C.textMid}}>{p.date}{p.location?` · ${p.location}`:""}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"0.75rem",flexShrink:0}}>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:"0.82rem",fontWeight:700,color:C.green}}>€{p.pipeline.filter(s=>s.status==="confirmed").reduce((a,s)=>a+s.value,0).toLocaleString("de-DE")}</div>
                <div style={{fontSize:"0.72rem",color:C.textLight}}>{p.pipeline.length} Kontakte</div>
              </div>
              <button onClick={e=>{ e.stopPropagation(); setActiveId(p.id); setShowProjects(false); setDeleteProjSource('list'); setConfirmDeleteProj(true); }}
                style={{background:"none",border:"none",cursor:"pointer",padding:"0.35rem",borderRadius:8,color:C.textLight,display:"flex",alignItems:"center",flexShrink:0}}
                onMouseEnter={e=>{ e.currentTarget.style.color="#dc2626"; e.currentTarget.style.background="#fef2f2"; }}
                onMouseLeave={e=>{ e.currentTarget.style.color=C.textLight; e.currentTarget.style.background="none"; }}
                title="Event löschen">
                <Trash2 size={15} strokeWidth={1.7}/>
              </button>
            </div>
          </div>
        ))}
        <div style={{display:"flex",gap:"0.65rem",marginTop:"0.5rem"}}>
          <button onClick={()=>{ if(!hasFeature(user?.tier||'free','event-templates')){ setShowProjects(false); setShowUpgrade({feature:'event-templates',label:'Event-Templates',requiredTier:'pro'}); return; } openTemplateSelect(); }} style={{flex:1,background:C.bg,color:C.accent,border:`1.5px solid ${C.accentBorder}`,borderRadius:12,padding:"0.85rem",fontSize:"0.88rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem"}}><Copy size={14} strokeWidth={1.5}/>Aus Template</button>
        </div>
        <button onClick={async ()=>{setShowProjects(false);await supabase.auth.signOut();router.push('/');}} style={{width:"100%",marginTop:"0.65rem",background:"none",color:C.textLight,border:`1px solid ${C.border}`,borderRadius:12,padding:"0.8rem",fontSize:"0.85rem",cursor:"pointer"}}>Ausloggen</button>
      </Sheet>}

      {/* UPGRADE SHEET */}
      {showUpgrade && <Sheet onClose={()=>setShowUpgrade(null)} C={C}>
        <div style={{textAlign:"center",padding:"0.5rem 0 1.25rem"}}>
          <div style={{width:56,height:56,background:C.accentSoft,border:`2px solid ${C.accentBorder}`,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1rem"}}>
            <Zap size={24} strokeWidth={1.5} color={C.accent}/>
          </div>
          <div style={{fontSize:"1.1rem",fontWeight:800,marginBottom:"0.4rem"}}>
            {showUpgrade.requiredTier === 'pro' ? 'Pro' : 'Max'}-Feature
          </div>
          <div style={{fontSize:"0.88rem",color:C.textMid,lineHeight:1.6,maxWidth:280,margin:"0 auto 1.5rem"}}>
            <strong>{showUpgrade.label}</strong> ist im{" "}
            <strong style={{color:C.accent}}>{showUpgrade.requiredTier === 'pro' ? 'Pro' : 'Max'}-Tarif</strong>{" "}
            verfügbar. Dein aktueller Tarif: <strong>{(user?.tier||'free').toUpperCase()}</strong>.
          </div>
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,padding:"1rem",marginBottom:"1.5rem",textAlign:"left"}}>
            {showUpgrade.requiredTier === 'pro' ? (
              <>
                <div style={{fontSize:"0.75rem",fontWeight:700,color:C.textMid,letterSpacing:"0.07em",marginBottom:"0.5rem"}}>PRO — €79/Monat</div>
                {["Unbegrenzte Events","Unbegrenzte Pakete","KI Sponsor-Finder","E-Mail-Vorlagen","Kalender-Integration","Event-Templates"].map(f=>(
                  <div key={f} style={{display:"flex",alignItems:"center",gap:"0.5rem",fontSize:"0.83rem",marginBottom:"0.3rem"}}>
                    <Check size={13} strokeWidth={2.5} color={C.green}/>{f}
                  </div>
                ))}
              </>
            ) : (
              <>
                <div style={{fontSize:"0.75rem",fontWeight:700,color:C.textMid,letterSpacing:"0.07em",marginBottom:"0.5rem"}}>MAX — €149/Monat</div>
                {["Alles aus Pro","Sponsorenvereinbarungen","Benefit-Tracking","Post-Event Dokumentation","Lernende Pipeline-Datenbank","PDF Upload & Export"].map(f=>(
                  <div key={f} style={{display:"flex",alignItems:"center",gap:"0.5rem",fontSize:"0.83rem",marginBottom:"0.3rem"}}>
                    <Check size={13} strokeWidth={2.5} color={C.accent}/>{f}
                  </div>
                ))}
              </>
            )}
          </div>
          <a href="/#preise" target="_blank" rel="noopener noreferrer"
            style={{display:"block",width:"100%",background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontSize:"0.95rem",fontWeight:700,cursor:"pointer",textDecoration:"none",textAlign:"center",boxSizing:"border-box"}}
          >Upgrade ansehen →</a>
          <button onClick={()=>setShowUpgrade(null)} style={{marginTop:"0.65rem",width:"100%",background:"none",border:`1px solid ${C.border}`,borderRadius:12,padding:"0.75rem",fontSize:"0.88rem",cursor:"pointer",color:C.textMid}}>Schließen</button>
        </div>
      </Sheet>}

      {/* BRANDING */}
      {showBranding && <Sheet onClose={()=>setShowBranding(false)} C={C}>
        <div style={{fontSize:"1rem",fontWeight:800,marginBottom:"0.3rem"}}>Mein Branding</div>
        <div style={{fontSize:"0.75rem",color:C.textMid,marginBottom:"1.25rem"}}>Passe SponsorMatch an deinen Stil an</div>
        <Label C={C}>LOGO</Label>
        <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{display:"none"}}/>
        <div style={{marginBottom:"1rem"}}>
          {user.logo
            ? <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
                <img src={user.logo} alt="Logo" style={{width:64,height:64,objectFit:"contain",borderRadius:10,border:`1px solid ${C.border}`,background:C.bg}}/>
                <button onClick={()=>logoInputRef.current.click()} style={{fontSize:"0.78rem",color:C.accent,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Ändern</button>
              </div>
            : <div onClick={()=>logoInputRef.current.click()} style={{border:`2px dashed ${C.border}`,borderRadius:12,padding:"1rem",textAlign:"center",cursor:"pointer",background:C.bg}}>
                <div style={{display:"flex",justifyContent:"center",marginBottom:"0.3rem"}}><Building2 size={28} strokeWidth={1.5} color={C.textLight}/></div>
                <div style={{fontSize:"0.78rem",color:C.textMid}}>Logo hochladen</div>
              </div>
          }
        </div>
        <Label C={C}>AKZENTFARBE</Label>
        <div style={{display:"flex",gap:"0.6rem",flexWrap:"wrap",marginBottom:"1.5rem"}}>
          {["#e8500a","#2563eb","#16a34a","#7c3aed","#d97706","#dc2626","#0891b2","#db2777"].map(col=>(
            <div key={col} onClick={()=>setUser(u=>({...u,accent:col}))} style={{width:32,height:32,borderRadius:"50%",background:col,border:`3px solid ${user.accent===col?C.text:"transparent"}`,cursor:"pointer"}}/>
          ))}
        </div>
        <Label C={C}>NAME</Label>
        <input type="text" value={user.name} onChange={e=>setUser(u=>({...u,name:e.target.value}))} style={{...mkInp(C),marginBottom:"0.75rem"}}/>
        <Label C={C}>KURZE BIO</Label>
        <textarea rows={2} value={user.bio||""} onChange={e=>setUser(u=>({...u,bio:e.target.value}))} style={{...mkInp(C),resize:"none",marginBottom:"0.75rem"}} placeholder="z.B. Wir organisieren Österreichs führende Business-Events..."/>
        <Label C={C}>WEBSITE</Label>
        <input type="url" value={user.website||""} onChange={e=>setUser(u=>({...u,website:e.target.value}))} style={{...mkInp(C),marginBottom:"0.75rem"}} placeholder="https://meinewebsite.at"/>
        <Label C={C}>FACEBOOK</Label>
        <input type="url" value={user.facebook||""} onChange={e=>setUser(u=>({...u,facebook:e.target.value}))} style={{...mkInp(C),marginBottom:"0.75rem"}} placeholder="https://facebook.com/..."/>
        <Label C={C}>INSTAGRAM</Label>
        <input type="url" value={user.instagram||""} onChange={e=>setUser(u=>({...u,instagram:e.target.value}))} style={{...mkInp(C),marginBottom:"0.75rem"}} placeholder="https://instagram.com/..."/>
        <Label C={C}>LINKEDIN</Label>
        <input type="url" value={user.linkedin||""} onChange={e=>setUser(u=>({...u,linkedin:e.target.value}))} style={{...mkInp(C),marginBottom:"0.75rem"}} placeholder="https://linkedin.com/in/..."/>
        <Label C={C}>MEHRWERTSTEUER / WERBEABGABE</Label>
        <select value={user.mwst||"0"} onChange={e=>setUser(u=>({...u,mwst:e.target.value}))} style={{...mkInp(C),marginBottom:"1.25rem"}}>
          <option value="0">Keine (exkl. Steuern)</option>
          <option value="werbung5">+ 5% Werbeabgabe</option>
          <option value="mwst10">+ 10% MwSt</option>
          <option value="mwst20">+ 20% MwSt</option>
          <option value="werbung5_mwst20">+ 5% Werbeabgabe + 20% MwSt</option>
        </select>
        {/* TEAM */}
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:"1.25rem",marginBottom:"1.25rem"}}>
          <div style={{fontSize:"0.88rem",fontWeight:800,marginBottom:"0.85rem",display:"flex",alignItems:"center",gap:"0.4rem"}}>
            <Users size={14} strokeWidth={1.5} color={C.accent}/>
            Team
          </div>

          {/* Mitgliederliste */}
          {teamMembers.map(m => (
            <div key={m.id} style={{display:"flex",alignItems:"center",gap:"0.6rem",padding:"0.55rem 0.75rem",background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,marginBottom:"0.4rem"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:C.accentSoft,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:"0.72rem",fontWeight:700,color:C.accent}}>{(m.display_name||m.name||"?")[0].toUpperCase()}</span>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:"0.82rem",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.display_name||m.name||"—"}</div>
                <div style={{fontSize:"0.72rem",color:C.textLight}}>{m.role==="admin"?"Admin":"Mitglied"}</div>
              </div>
              {m.id !== user?.id && user?.role==="admin" && (
                <button onClick={()=>removeTeamMember(m.id)}
                  style={{background:"none",border:"none",cursor:"pointer",color:C.textLight,padding:"0.2rem",display:"flex",alignItems:"center"}}
                  onMouseEnter={e=>e.currentTarget.style.color="#dc2626"}
                  onMouseLeave={e=>e.currentTarget.style.color=C.textLight}>
                  <Trash2 size={13} strokeWidth={1.5}/>
                </button>
              )}
            </div>
          ))}

          {/* Pending Invites */}
          {pendingInvites.map(inv => (
            <div key={inv.id} style={{display:"flex",alignItems:"center",gap:"0.6rem",padding:"0.55rem 0.75rem",background:C.bg,border:`1px dashed ${C.border}`,borderRadius:9,marginBottom:"0.4rem",opacity:0.7}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:C.bg,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Mail size={12} strokeWidth={1.5} color={C.textLight}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:"0.82rem",color:C.textMid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{inv.email}</div>
                <div style={{fontSize:"0.72rem",color:C.textLight}}>Einladung ausstehend</div>
              </div>
              {user?.role==="admin" && (
                <button onClick={()=>cancelInvite(inv.id)}
                  style={{background:"none",border:"none",cursor:"pointer",color:C.textLight,padding:"0.2rem",display:"flex",alignItems:"center"}}
                  onMouseEnter={e=>e.currentTarget.style.color="#dc2626"}
                  onMouseLeave={e=>e.currentTarget.style.color=C.textLight}>
                  <Trash2 size={13} strokeWidth={1.5}/>
                </button>
              )}
            </div>
          ))}

          {/* Einladen-Formular (nur Admin) */}
          {user?.role==="admin" && (
            <div style={{display:"flex",gap:"0.5rem",marginTop:"0.5rem"}}>
              <input
                type="email"
                value={inviteEmail}
                onChange={e=>setInviteEmail(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter") sendInvite(); }}
                placeholder="E-Mail einladen…"
                style={{...mkInp(C),flex:1,fontSize:"0.85rem"}}
              />
              <button
                onClick={sendInvite}
                disabled={!inviteEmail.trim()||sendingInvite}
                style={{background:inviteEmail.trim()?C.accent:"#d4cfca",color:"#fff",border:"none",borderRadius:9,padding:"0 0.9rem",cursor:inviteEmail.trim()?"pointer":"not-allowed",fontWeight:700,fontSize:"0.85rem",flexShrink:0,display:"flex",alignItems:"center",gap:"0.35rem"}}>
                {sendingInvite ? <Loader2 size={13} strokeWidth={2} style={{animation:"spin 1s linear infinite"}}/> : <Plus size={13} strokeWidth={2}/>}
                Einladen
              </button>
            </div>
          )}
        </div>

        <div style={{display:"flex",gap:"0.65rem"}}>
          <button onClick={()=>saveBranding()} style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontWeight:700,cursor:"pointer"}}>Speichern</button>
          <button onClick={()=>setShowBranding(false)} style={{flex:1,background:C.bg,color:C.textMid,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"0.9rem",cursor:"pointer"}}>Abbrechen</button>
        </div>
      </Sheet>}

      {/* NEW PROJECT */}
      {showNewProj && <Sheet onClose={()=>setShowNewProj(false)} C={C}>
        <div style={{fontSize:"1rem",fontWeight:800,marginBottom:"1.25rem"}}>Neues Event anlegen</div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>EVENTNAME *</Label><input type="text" placeholder="z.B. Vienna Tech Summit" value={newProj.name} onChange={e=>setNewProj(p=>({...p,name:e.target.value}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>DATUM</Label><input type="text" placeholder="z.B. 12. Mai 2026" value={newProj.date} onChange={e=>setNewProj(p=>({...p,date:e.target.value}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>LOCATION</Label><input type="text" placeholder="z.B. Rathaus Wien" value={newProj.location} onChange={e=>setNewProj(p=>({...p,location:e.target.value}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>KONTAKT E-MAIL</Label><input type="email" placeholder="office@meinevent.at" value={newProj.email} onChange={e=>setNewProj(p=>({...p,email:e.target.value}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>ERWARTETE GÄSTE</Label><input type="number" placeholder="500" value={newProj.audience} onChange={e=>setNewProj(p=>({...p,audience:e.target.value}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>SOCIAL REACH</Label><input type="text" placeholder="15.000" value={newProj.reach} onChange={e=>setNewProj(p=>({...p,reach:e.target.value}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}>
          <Label C={C}>KATEGORIE</Label>
          <select value={newProj.category} onChange={e=>setNewProj(p=>({...p,category:e.target.value}))} style={{...mkInp(C)}}>
            <option value="">Kategorie wählen...</option>
            {EVENT_CATEGORIES.map(cat=><option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div style={{marginBottom:"0.9rem"}}>
          <Label C={C}>BANNER (Facebook-Titelbild Format)</Label>
          <input ref={bannerInputRef} type="file" accept="image/*" onChange={e=>handleImgUpload(e,setNewProj)} style={{display:"none"}}/>
          {newProj.banner
            ? <div style={{position:"relative",borderRadius:12,overflow:"hidden",aspectRatio:"2.63/1",cursor:"pointer"}} onClick={()=>bannerInputRef.current.click()}>
                <img src={newProj.banner} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem",color:"#fff",fontWeight:600}}>Bild ändern</div>
              </div>
            : <div onClick={()=>bannerInputRef.current.click()} style={{border:`2px dashed ${C.border}`,borderRadius:12,padding:"1.5rem",textAlign:"center",cursor:"pointer",background:C.bg,aspectRatio:"2.63/1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <ImageIcon size={28} strokeWidth={1.5} color={C.textLight} style={{marginBottom:"0.4rem"}}/>
                <div style={{fontSize:"0.8rem",color:C.textMid}}>Banner hochladen</div>
                <div style={{fontSize:"0.68rem",color:C.textLight}}>820×312px empfohlen</div>
              </div>
          }
        </div>
        <div style={{marginBottom:"1.25rem"}}>
          <Label C={C}>BESCHREIBUNG</Label>
          <RichEditor key="new_proj_desc" value={newProj.description} onChange={v=>setNewProj(p=>({...p,description:v}))} C={C}/>
        </div>
        <div style={{display:"flex",gap:"0.65rem"}}>
          <button onClick={createProj} disabled={!newProj.name} style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontWeight:700,cursor:"pointer",opacity:newProj.name?1:0.5}}>Erstellen</button>
          <button onClick={()=>setShowNewProj(false)} style={{flex:1,background:C.bg,color:C.textMid,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"0.9rem",cursor:"pointer"}}>Abbrechen</button>
        </div>
      </Sheet>}

      {/* TEMPLATE AUSWAHL */}
      {showTemplateSelect && <Sheet onClose={()=>setShowTemplateSelect(false)} C={C}>
        <div style={{fontSize:"1rem",fontWeight:800,marginBottom:"0.3rem",display:"flex",alignItems:"center",gap:"0.5rem"}}>
          <Copy size={16} strokeWidth={1.5} color={C.accent}/>Aus Template erstellen
        </div>
        <div style={{fontSize:"0.78rem",color:C.textMid,marginBottom:"1.25rem"}}>Wähle ein bestehendes Event als Vorlage. Pakete werden übernommen, Pipeline wird geleert.</div>
        {projects.length === 0
          ? <div style={{textAlign:"center",padding:"2rem 1rem",color:C.textLight,fontSize:"0.9rem"}}>Noch keine Events als Vorlage verfügbar.</div>
          : projects.map(p => {
              const confirmedCount = (p.pipeline||[]).filter(s=>s.status==="confirmed").length;
              const totalCount = (p.pipeline||[]).length;
              return (
                <div key={p.id} onClick={()=>selectTemplate(p)} style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"1rem 1.1rem",marginBottom:"0.65rem",cursor:"pointer"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.4rem"}}>
                    <div style={{fontWeight:700,fontSize:"0.98rem",lineHeight:1.3}}>{p.name}</div>
                    <div style={{background:C.accentSoft,color:C.accent,fontSize:"0.68rem",fontWeight:700,padding:"0.2rem 0.6rem",borderRadius:99,whiteSpace:"nowrap",marginLeft:"0.5rem",flexShrink:0}}>Als Template</div>
                  </div>
                  <div style={{fontSize:"0.8rem",color:C.textMid,marginBottom:"0.5rem"}}>{p.date}{p.location?` · ${p.location}`:""}</div>
                  <div style={{display:"flex",gap:"1rem",flexWrap:"wrap"}}>
                    <span style={{fontSize:"0.75rem",color:C.textLight,display:"flex",alignItems:"center",gap:"0.3rem"}}><Package size={11} strokeWidth={1.5}/>{(p.packages||[]).length} Paket{(p.packages||[]).length!==1?"e":""}</span>
                    <span style={{fontSize:"0.75rem",color:C.textLight,display:"flex",alignItems:"center",gap:"0.3rem"}}><Users size={11} strokeWidth={1.5}/>{totalCount} Sponsor{totalCount!==1?"en":""} in Historie</span>
                    {confirmedCount > 0 && <span style={{fontSize:"0.75rem",color:C.green,display:"flex",alignItems:"center",gap:"0.3rem"}}><CheckCircle size={11} strokeWidth={1.5}/>{confirmedCount} bestätigt</span>}
                  </div>
                </div>
              );
            })
        }
        <button onClick={()=>setShowTemplateSelect(false)} style={{width:"100%",marginTop:"0.5rem",background:"none",color:C.textLight,border:`1px solid ${C.border}`,borderRadius:12,padding:"0.75rem",fontSize:"0.82rem",cursor:"pointer"}}>Abbrechen</button>
      </Sheet>}

      {/* TEMPLATE FORMULAR */}
      {showTemplateForm && templateData && templateSource && <Sheet onClose={()=>{setShowTemplateForm(false);setTemplateData(null);setTemplateSource(null);}} C={C}>
        <div style={{fontSize:"1rem",fontWeight:800,marginBottom:"0.2rem",display:"flex",alignItems:"center",gap:"0.5rem"}}>
          <Copy size={16} strokeWidth={1.5} color={C.accent}/>Aus Template: {templateSource.name}
        </div>
        <div style={{fontSize:"0.75rem",color:C.textMid,marginBottom:"1.25rem"}}>Passe die Felder für dein neues Event an</div>

        {/* Legende */}
        <div style={{display:"flex",gap:"0.75rem",marginBottom:"1.25rem",flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.4rem",fontSize:"0.72rem",color:"#dc2626",fontWeight:600}}>
            <AlertCircle size={12} strokeWidth={2} color="#dc2626"/>Muss angepasst werden
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"0.4rem",fontSize:"0.72rem",color:"#16a34a",fontWeight:600}}>
            <CheckCircle size={12} strokeWidth={2} color="#16a34a"/>Kann übernommen werden
          </div>
        </div>

        {/* EVENTNAME — muss angepasst werden */}
        <div style={{marginBottom:"0.9rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.3rem"}}>
            <AlertCircle size={12} strokeWidth={2} color="#dc2626"/>
            <Label C={C}>EVENTNAME *</Label>
          </div>
          <input
            type="text"
            placeholder="z.B. Vienna Tech Summit 2026"
            value={templateData.name}
            onChange={e=>setTemplateData(d=>({...d,name:e.target.value}))}
            style={{...mkInp(C),border:`2px solid #e8500a`,background:"#fff8f5"}}
          />
          <div style={{fontSize:"0.68rem",color:C.accent,marginTop:"0.25rem",fontWeight:600}}>Tipp: Passe den Namen für das neue Event an (z.B. neues Jahr)</div>
        </div>

        {/* DATUM — muss angepasst werden */}
        <div style={{marginBottom:"0.9rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.3rem"}}>
            <AlertCircle size={12} strokeWidth={2} color="#dc2626"/>
            <Label C={C}>DATUM</Label>
          </div>
          <input
            type="text"
            placeholder="z.B. 15. Oktober 2026"
            value={templateData.date}
            onChange={e=>setTemplateData(d=>({...d,date:e.target.value}))}
            style={{...mkInp(C),border:`2px solid #e8500a`,background:"#fff8f5"}}
          />
        </div>

        {/* LOCATION — muss angepasst werden */}
        <div style={{marginBottom:"0.9rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.3rem"}}>
            <AlertCircle size={12} strokeWidth={2} color="#dc2626"/>
            <Label C={C}>LOCATION</Label>
          </div>
          <input
            type="text"
            placeholder="z.B. Marx Halle, Wien"
            value={templateData.location}
            onChange={e=>setTemplateData(d=>({...d,location:e.target.value}))}
            style={{...mkInp(C),border:`2px solid #e8500a`,background:"#fff8f5"}}
          />
        </div>

        {/* KONTAKT E-MAIL — kann bestätigt werden */}
        <div style={{marginBottom:"0.9rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.3rem"}}>
            <CheckCircle size={12} strokeWidth={2} color="#16a34a"/>
            <Label C={C}>KONTAKT E-MAIL</Label>
          </div>
          <input
            type="email"
            placeholder="office@meinevent.at"
            value={templateData.email}
            onChange={e=>setTemplateData(d=>({...d,email:e.target.value}))}
            style={{...mkInp(C),border:`2px solid #16a34a`,background:"#f0fdf4"}}
          />
        </div>

        {/* GÄSTE & REACH — kann bestätigt werden */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem",rowGap:"0.65rem",marginBottom:"0.9rem"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.3rem"}}>
              <CheckCircle size={12} strokeWidth={2} color="#16a34a"/>
              <Label C={C}>ERWARTETE GÄSTE</Label>
            </div>
            <input
              type="number"
              placeholder="500"
              value={templateData.audience}
              onChange={e=>setTemplateData(d=>({...d,audience:e.target.value}))}
              style={{...mkInp(C),border:`2px solid #16a34a`,background:"#f0fdf4"}}
            />
          </div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.3rem"}}>
              <CheckCircle size={12} strokeWidth={2} color="#16a34a"/>
              <Label C={C}>SOCIAL REACH</Label>
            </div>
            <input
              type="text"
              placeholder="15.000"
              value={templateData.reach}
              onChange={e=>setTemplateData(d=>({...d,reach:e.target.value}))}
              style={{...mkInp(C),border:`2px solid #16a34a`,background:"#f0fdf4"}}
            />
          </div>
        </div>

        {/* KATEGORIE — kann bestätigt werden */}
        <div style={{marginBottom:"0.9rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.3rem"}}>
            <CheckCircle size={12} strokeWidth={2} color="#16a34a"/>
            <Label C={C}>KATEGORIE</Label>
          </div>
          <select value={templateData.category||""} onChange={e=>setTemplateData(d=>({...d,category:e.target.value}))} style={{...mkInp(C),border:`2px solid #16a34a`,background:"#f0fdf4"}}>
            <option value="">Kategorie wählen...</option>
            {EVENT_CATEGORIES.map(cat=><option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {/* BESCHREIBUNG — kann bestätigt werden */}
        <div style={{marginBottom:"1.25rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.3rem"}}>
            <CheckCircle size={12} strokeWidth={2} color="#16a34a"/>
            <Label C={C}>BESCHREIBUNG / PITCH-TEXT</Label>
          </div>
          <RichEditor key={"tpl_"+templateSource.id+"_desc"} value={templateData.description} onChange={v=>setTemplateData(d=>({...d,description:v}))} C={C}/>
          <div style={{fontSize:"0.68rem",color:"#16a34a",marginTop:"0.25rem",fontWeight:600}}>Pitch-Text aus Vor-Event übernommen — prüfe ob er noch aktuell ist</div>
        </div>

        {/* PAKETE INFO */}
        <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"0.85rem 1rem",marginBottom:"1.25rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.5rem"}}>
            <CheckCircle size={12} strokeWidth={2} color="#16a34a"/>
            <span style={{fontSize:"0.72rem",fontWeight:700,color:"#16a34a",letterSpacing:"0.06em"}}>PAKETE ({(templateSource.packages||[]).length} STÜCK WERDEN ÜBERNOMMEN)</span>
          </div>
          {(templateSource.packages||[]).map(pkg=>(
            <div key={pkg.id} style={{display:"flex",justifyContent:"space-between",fontSize:"0.85rem",marginBottom:"0.25rem"}}>
              <span style={{color:pkg.color,fontWeight:600}}>{pkg.name}</span>
              <span style={{color:C.textMid}}>€{pkg.price.toLocaleString("de-DE")} · {pkg.slots} Slot{pkg.slots!==1?"s":""}</span>
            </div>
          ))}
          <div style={{fontSize:"0.7rem",color:C.textLight,marginTop:"0.5rem"}}>Pipeline wird leer gestartet — Pakete bleiben mit gleichen Preisen &amp; Benefits</div>
        </div>

        {/* SPONSOREN-HISTORIE */}
        {(templateSource.pipeline||[]).length > 0 && (
          <div style={{marginBottom:"1.25rem"}}>
            <button
              onClick={()=>setTemplateHistoryOpen(o=>!o)}
              style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"0.85rem 1rem",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom: templateHistoryOpen ? "0.5rem" : 0}}
            >
              <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                <History size={14} strokeWidth={1.5} color={C.textMid}/>
                <span style={{fontSize:"0.85rem",fontWeight:700,color:C.text}}>Sponsoren-Historie aus „{templateSource.name}"</span>
                <span style={{fontSize:"0.72rem",background:C.border,color:C.textMid,borderRadius:99,padding:"0.1rem 0.45rem",fontWeight:700}}>{(templateSource.pipeline||[]).length}</span>
              </div>
              {templateHistoryOpen ? <ChevronUp size={15} strokeWidth={1.5} color={C.textMid}/> : <ChevronDown size={15} strokeWidth={1.5} color={C.textMid}/>}
            </button>
            {templateHistoryOpen && (
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
                <div style={{padding:"0.6rem 1rem",background:C.bg,borderBottom:`1px solid ${C.border}`,display:"grid",gridTemplateColumns:"2fr 1fr",gap:"0.5rem"}}>
                  {["FIRMA","PAKET","STATUS","KONTAKT"].map(h=>(
                    <div key={h} style={{fontSize:"0.62rem",fontWeight:700,color:C.textLight,letterSpacing:"0.06em"}}>{h}</div>
                  ))}
                </div>
                {(templateSource.pipeline||[]).map((s,i)=>{
                  const cfg = STATUS_CONFIG[s.status]||STATUS_CONFIG.draft;
                  return (
                    <div key={s.id} style={{padding:"0.65rem 1rem",borderBottom:i<(templateSource.pipeline||[]).length-1?`1px solid ${C.border}`:"none",display:"grid",gridTemplateColumns:"2fr 1fr",gap:"0.5rem",alignItems:"center"}}>
                      <div>
                        <div style={{fontSize:"0.88rem",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.company}</div>
                        <div style={{fontSize:"0.72rem",color:C.textLight}}>€{s.value.toLocaleString("de-DE")}</div>
                      </div>
                      <div style={{fontSize:"0.78rem",color:C.textMid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.package}</div>
                      <div><span style={{fontSize:"0.63rem",fontWeight:700,padding:"0.18rem 0.5rem",borderRadius:99,background:cfg.bg,color:cfg.color,whiteSpace:"nowrap"}}>{cfg.label}</span></div>
                      <div style={{fontSize:"0.75rem",color:C.textLight,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.contact||"—"}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div style={{display:"flex",gap:"0.65rem"}}>
          <button
            onClick={createFromTemplate}
            disabled={!templateData.name}
            style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontWeight:700,cursor:templateData.name?"pointer":"not-allowed",opacity:templateData.name?1:0.5,display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"}}
          >
            <Copy size={14} strokeWidth={1.5}/>Event erstellen
          </button>
          <button onClick={()=>{setShowTemplateForm(false);setTemplateData(null);setTemplateSource(null);}} style={{flex:1,background:C.bg,color:C.textMid,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"0.9rem",cursor:"pointer"}}>Abbrechen</button>
        </div>
      </Sheet>}

      {/* EDIT PROJECT */}
      {showEditProj && editProjData && <Sheet onClose={()=>setShowEditProj(false)} C={C}>
        <div style={{fontSize:"1rem",fontWeight:800,marginBottom:"1.25rem"}}>Event bearbeiten</div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>EVENTNAME</Label><input type="text" value={editProjData.name} onChange={e=>setEditProjData(p=>({...p,name:e.target.value}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>DATUM</Label><input type="text" value={editProjData.date} onChange={e=>setEditProjData(p=>({...p,date:e.target.value}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>LOCATION</Label><input type="text" value={editProjData.location} onChange={e=>setEditProjData(p=>({...p,location:e.target.value}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>KONTAKT E-MAIL</Label><input type="email" value={editProjData.email||""} onChange={e=>setEditProjData(p=>({...p,email:e.target.value}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>ERWARTETE GÄSTE</Label><input type="number" value={editProjData.audience} onChange={e=>setEditProjData(p=>({...p,audience:e.target.value}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>SOCIAL REACH</Label><input type="text" value={editProjData.reach} onChange={e=>setEditProjData(p=>({...p,reach:e.target.value}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}>
          <Label C={C}>KATEGORIE</Label>
          <select value={editProjData.category||""} onChange={e=>setEditProjData(p=>({...p,category:e.target.value}))} style={{...mkInp(C)}}>
            <option value="">Kategorie wählen...</option>
            {EVENT_CATEGORIES.map(cat=><option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div style={{marginBottom:"0.9rem"}}>
          <Label C={C}>BANNER</Label>
          <input ref={editBannerInputRef} type="file" accept="image/*" onChange={e=>handleImgUpload(e,setEditProjData,true)} style={{display:"none"}}/>
          {editProjData.banner
            ? <div style={{position:"relative",borderRadius:12,overflow:"hidden",aspectRatio:"2.63/1",cursor:"pointer"}} onClick={()=>editBannerInputRef.current.click()}>
                <img src={editProjData.banner} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem",color:"#fff",fontWeight:600}}>Bild ändern</div>
              </div>
            : <div onClick={()=>editBannerInputRef.current.click()} style={{border:`2px dashed ${C.border}`,borderRadius:12,padding:"1.5rem",textAlign:"center",cursor:"pointer",background:C.bg,aspectRatio:"2.63/1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <ImageIcon size={28} strokeWidth={1.5} color={C.textLight}/><div style={{fontSize:"0.9rem",color:C.textMid,marginTop:"0.4rem"}}>Banner hochladen</div>
              </div>
          }
        </div>
        <div style={{marginBottom:"1.25rem"}}>
          <Label C={C}>BESCHREIBUNG</Label>
          <RichEditor key={editProjData.id+"_desc"} value={editProjData.description||""} onChange={v=>setEditProjData(p=>({...p,description:v}))} C={C}/>
        </div>
        <button
          onClick={()=>{ setShowEditProj(false); setEditMehrwertData([...(proj.mehrwert||[])]); setShowEditMehrwert(true); }}
          style={{width:"100%",marginBottom:"0.65rem",background:C.bg,color:C.accent,border:`1.5px solid ${C.accentBorder}`,borderRadius:12,padding:"0.75rem",fontSize:"0.95rem",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem"}}
        >
          <Pencil size={14} strokeWidth={1.5}/>Warum Sponsoren profitieren bearbeiten
        </button>
        <button
          onClick={()=>{ setShowEditProj(false); setDeleteProjSource('edit'); setConfirmDeleteProj(true); }}
          style={{width:"100%",marginBottom:"0.65rem",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:12,padding:"0.75rem",fontSize:"0.95rem",fontWeight:600,cursor:"pointer"}}
        >
          Event löschen
        </button>
        <div style={{display:"flex",gap:"0.65rem"}}>
          <button onClick={saveEditProj} style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontWeight:700,cursor:"pointer"}}>Speichern</button>
          <button onClick={()=>setShowEditProj(false)} style={{flex:1,background:C.bg,color:C.textMid,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"0.9rem",cursor:"pointer"}}>Abbrechen</button>
        </div>
      </Sheet>}

      {/* CONFIRM DELETE PROJECT */}
      {confirmDeleteProj && <Sheet onClose={()=>{ setConfirmDeleteProj(false); if(deleteProjSource==='edit') setShowEditProj(true); else setShowProjects(true); }} C={C}>
        <div style={{fontSize:"1.1rem",fontWeight:800,marginBottom:"0.5rem"}}>Event löschen?</div>
        <div style={{fontSize:"0.95rem",color:C.textMid,marginBottom:"0.75rem",lineHeight:1.6}}>
          <strong>{proj.name}</strong> wird dauerhaft gelöscht.
        </div>
        {proj.pipeline.length > 0 && (
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"0.65rem 0.9rem",marginBottom:"0.75rem",fontSize:"0.88rem",color:C.textMid,lineHeight:1.6}}>
            {proj.pipeline.length} Sponsor{proj.pipeline.length!==1?"en":""} in der Pipeline
            {(() => {
              const confirmedCount = proj.pipeline.filter(s=>s.status==="confirmed").length;
              return confirmedCount > 0 ? ` (davon ${confirmedCount} bestätigt)` : "";
            })()}
          </div>
        )}
        <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"0.75rem",marginBottom:"1.5rem",fontSize:"0.88rem",color:"#dc2626",lineHeight:1.6}}>
          Alle Sponsoren-Daten, Pakete und Pipeline-Einträge dieses Events gehen unwiederbringlich verloren.
        </div>
        <div style={{display:"flex",gap:"0.65rem"}}>
          <button onClick={deleteProj} style={{flex:1,background:"#dc2626",color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontWeight:700,cursor:"pointer"}}>Endgültig löschen</button>
          <button onClick={()=>{ setConfirmDeleteProj(false); if(deleteProjSource==='edit') setShowEditProj(true); else setShowProjects(true); }} style={{flex:1,background:C.bg,color:C.textMid,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"0.9rem",cursor:"pointer"}}>Abbrechen</button>
        </div>
      </Sheet>}

      {/* EDIT MEHRWERT + GALLERY */}
      {showEditMehrwert && editMehrwertData && <Sheet onClose={()=>setShowEditMehrwert(false)} C={C}>
        <div style={{fontSize:"1.1rem",fontWeight:800,marginBottom:"0.4rem"}}>Mehrwert & Fotos</div>
        <div style={{fontSize:"0.85rem",color:C.textMid,marginBottom:"1.25rem"}}>Zeige Sponsoren warum dein Event besonders ist</div>
        {editMehrwertData.map((m,i)=>(
          <div key={m.id} style={{background:C.bg,borderRadius:12,padding:"1rem",marginBottom:"0.75rem",border:`1px solid ${C.border}`}}>
            <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.5rem",alignItems:"center"}}>
              <input value={m.icon} onChange={e=>setEditMehrwertData(d=>d.map((x,j)=>j===i?{...x,icon:e.target.value}:x))} style={{...mkInp(C),width:52,textAlign:"center",padding:"0.5rem",fontSize:"1.1rem"}}/>
              <input value={m.title} onChange={e=>setEditMehrwertData(d=>d.map((x,j)=>j===i?{...x,title:e.target.value}:x))} style={{...mkInp(C),flex:1,width:"auto",fontWeight:700}} placeholder="Titel"/>
              <button onClick={()=>setEditMehrwertData(d=>d.filter((_,j)=>j!==i))} style={{background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",flexShrink:0}}>×</button>
            </div>
            <textarea value={m.text} onChange={e=>setEditMehrwertData(d=>d.map((x,j)=>j===i?{...x,text:e.target.value}:x))} rows={2} style={{...mkInp(C),resize:"none",fontSize:"0.92rem"}} placeholder="Beschreibung..."/>
          </div>
        ))}
        <button onClick={()=>setEditMehrwertData(d=>[...d,{id:newId(),icon:"Neu",title:"Neuer Punkt",text:""}])} style={{width:"100%",background:C.bg,color:C.accent,border:`1.5px dashed ${C.accentBorder}`,borderRadius:12,padding:"0.75rem",fontSize:"0.95rem",fontWeight:600,cursor:"pointer",marginBottom:"1.25rem"}}>+ Punkt hinzufügen</button>
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:"1.25rem",marginBottom:"1.25rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem"}}>
            <div><div style={{fontSize:"0.92rem",fontWeight:700}}>Fotos (Hochformat 4:5)</div><div style={{fontSize:"0.78rem",color:C.textLight}}>Impressionen der letzten Veranstaltung</div></div>
            <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryUpload} style={{display:"none"}}/>
            <button
              onClick={()=>galleryInputRef.current.click()}
              disabled={galleryUploading}
              style={{background:C.accent,color:"#fff",border:"none",borderRadius:9,padding:"0.4rem 0.85rem",fontSize:"0.85rem",fontWeight:600,cursor:galleryUploading?"wait":"pointer",opacity:galleryUploading?0.7:1}}
            >{galleryUploading?"Lädt...":"+ Fotos"}</button>
          </div>
          {(proj.gallery||[]).length===0
            ? <div onClick={()=>galleryInputRef.current.click()} style={{border:`2px dashed ${C.border}`,borderRadius:12,padding:"1.5rem",textAlign:"center",cursor:"pointer",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center"}}><Camera size={28} strokeWidth={1.5} color={C.textLight} style={{marginBottom:"0.4rem"}}/><div style={{fontSize:"0.9rem",color:C.textMid}}>Fotos hochladen</div></div>
            : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(90px, 1fr))",gap:"0.5rem"}}>
                {(proj.gallery||[]).map(g=>(
                  <div key={g.id} style={{position:"relative",borderRadius:10,overflow:"hidden",aspectRatio:"4/5"}}>
                    <img src={g.url || g.src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    <button onClick={()=>updProj(p=>({...p,gallery:p.gallery.filter(x=>x.id!==g.id)}))} style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.6)",color:"#fff",border:"none",borderRadius:"50%",width:22,height:22,fontSize:"0.8rem",cursor:"pointer"}}>×</button>
                  </div>
                ))}
                <div onClick={()=>galleryInputRef.current.click()} style={{border:`2px dashed ${C.border}`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",aspectRatio:"4/5",cursor:"pointer",background:C.bg,fontSize:"1.3rem",color:C.textLight}}>+</div>
              </div>
          }
        </div>
        <div style={{display:"flex",gap:"0.65rem"}}>
          <button onClick={saveMehrwert} style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontWeight:700,cursor:"pointer"}}>Speichern</button>
          <button onClick={()=>setShowEditMehrwert(false)} style={{flex:1,background:C.bg,color:C.textMid,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"0.9rem",cursor:"pointer"}}>Abbrechen</button>
        </div>
      </Sheet>}

      {/* PITCH EDITOR */}
      {showPitchEditor && <Sheet onClose={()=>setShowPitchEditor(null)} C={C}>
        <div style={{fontSize:"1.1rem",fontWeight:800,marginBottom:"0.3rem"}}>Pitch E-Mail verfassen</div>
        <div style={{fontSize:"0.85rem",color:C.textMid,marginBottom:"1.25rem"}}>An: {showPitchEditor.contact} · {showPitchEditor.email}</div>
        <div style={{background:C.bg,borderRadius:10,padding:"0.75rem",marginBottom:"1rem",border:`1px solid ${C.border}`}}>
          <div style={{fontSize:"0.72rem",color:C.textLight,fontWeight:600,marginBottom:"0.2rem"}}>BETREFF</div>
          <div style={{fontSize:"0.95rem"}}>Sponsoring-Anfrage: {proj.name}</div>
        </div>
        <Label C={C}>DEINE PERSÖNLICHE NACHRICHT</Label>
        <textarea
          rows={8}
          value={pitchText}
          onChange={e=>setPitchText(e.target.value)}
          style={{...mkInp(C),resize:"none",marginBottom:"0.75rem",lineHeight:1.6}}
          placeholder={`Hallo ${showPitchEditor.contact},\n\nvielen Dank für dein Interesse an ${proj.name}!\n\n[Ergänze hier deine persönlichen Worte...]\n\nMit freundlichen Grüßen\n${user.name}`}
        />
        <div style={{background:C.amberSoft,border:`1px solid ${C.amber}44`,borderRadius:10,padding:"0.75rem",marginBottom:"1.25rem",fontSize:"0.85rem",lineHeight:1.5}}>
          <strong>Tipp:</strong> Persönliche E-Mails werden seltener als Spam markiert. Erwähne etwas Spezifisches über das Unternehmen oder einen gemeinsamen Bekannten.
        </div>
        <div style={{display:"flex",gap:"0.65rem"}}>
          <button onClick={()=>sendPitch(showPitchEditor, pitchText)} style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"}}><Mail size={15} strokeWidth={1.5}/>E-Mail öffnen</button>
          <button onClick={()=>setShowPitchEditor(null)} style={{flex:1,background:C.bg,color:C.textMid,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"0.9rem",cursor:"pointer"}}>Abbrechen</button>
        </div>
      </Sheet>}

      {/* PACKAGE EDITOR */}
      {editPkg && <Sheet onClose={()=>setEditPkg(null)} C={C}>
        <div style={{fontSize:"1.1rem",fontWeight:800,marginBottom:"1.25rem"}}>Paket bearbeiten</div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>PAKETNAME</Label><input type="text" value={editPkg.name} onChange={e=>setEditPkg(p=>({...p,name:e.target.value}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>PREIS (€, exkl. 5% Werbeabgabe)</Label><input type="number" value={editPkg.price} onChange={e=>setEditPkg(p=>({...p,price:parseInt(e.target.value)||0}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>VERFÜGBARE SLOTS</Label><input type="number" value={editPkg.slots} onChange={e=>setEditPkg(p=>({...p,slots:parseInt(e.target.value)||0}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}>
          <Label C={C}>FARBE</Label>
          <div style={{display:"flex",gap:"0.5rem"}}>
            {["#e8500a","#d97706","#64748b","#2563eb","#16a34a","#7c3aed"].map(col=>(
              <div key={col} onClick={()=>setEditPkg(p=>({...p,color:col}))} style={{width:28,height:28,borderRadius:"50%",background:col,border:`3px solid ${editPkg.color===col?"#1a1814":"transparent"}`,cursor:"pointer"}}/>
            ))}
          </div>
        </div>
        <div style={{marginBottom:"1.25rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.5rem"}}>
            <Label C={C}>BENEFITS</Label>
            <button onClick={()=>setEditPkg(p=>({...p,benefits:[...p.benefits,""]}))} style={{fontSize:"0.82rem",color:C.accent,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>+ Hinzufügen</button>
          </div>
          {editPkg.benefits.map((b,i)=>(
            <div key={i} style={{display:"flex",gap:"0.5rem",marginBottom:"0.5rem",alignItems:"center"}}>
              <input value={b} onChange={e=>setEditPkg(p=>({...p,benefits:p.benefits.map((x,j)=>j===i?e.target.value:x)}))} style={{...mkInp(C),flex:1,width:"auto"}} placeholder="Benefit..."/>
              <button onClick={()=>setEditPkg(p=>({...p,benefits:p.benefits.filter((_,j)=>j!==i)}))} style={{background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer"}}>×</button>
            </div>
          ))}
        </div>
        <button
          onClick={()=>{ setConfirmDeletePkg(editPkg); setEditPkg(null); }}
          style={{width:"100%",marginBottom:"0.65rem",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:12,padding:"0.75rem",fontSize:"0.95rem",fontWeight:600,cursor:"pointer"}}
        >
          Paket löschen
        </button>
        <div style={{display:"flex",gap:"0.65rem"}}>
          <button onClick={savePkg} style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontWeight:700,cursor:"pointer"}}>Speichern</button>
          <button onClick={()=>setEditPkg(null)} style={{flex:1,background:C.bg,color:C.textMid,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"0.9rem",cursor:"pointer"}}>Abbrechen</button>
        </div>
      </Sheet>}

      {/* CONFIRM DELETE PACKAGE */}
      {confirmDeletePkg && <Sheet onClose={()=>{ setConfirmDeletePkg(null); setEditPkg(confirmDeletePkg); }} C={C}>
        <div style={{fontSize:"1.1rem",fontWeight:800,marginBottom:"0.5rem"}}>Paket löschen?</div>
        <div style={{fontSize:"0.95rem",color:C.textMid,marginBottom:"0.75rem",lineHeight:1.6}}>
          <strong>{confirmDeletePkg.name}</strong> wird dauerhaft gelöscht. Sponsoren in der Pipeline, die diesem Paket zugeordnet sind, verlieren ihre Paketzuordnung.
        </div>
        {/* Fix 4: Slots-Info */}
        <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"0.65rem 0.9rem",marginBottom:"0.75rem",fontSize:"0.88rem",color:C.textMid}}>
          {confirmDeletePkg.name} · {confirmDeletePkg.taken} von {confirmDeletePkg.slots} Slots belegt
        </div>
        {/* Fix 1: Warnung bei betroffenen Sponsoren */}
        {(() => {
          const affected = proj.pipeline.filter(s=>s.package===confirmDeletePkg.name);
          const confirmedCount = affected.filter(s=>s.status==="confirmed").length;
          if (affected.length === 0) return null;
          return (
            <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"0.75rem",marginBottom:"0.75rem",fontSize:"0.88rem",color:"#dc2626",lineHeight:1.6}}>
              ⚠️ {affected.length} Sponsor{affected.length!==1?"en":""} (davon {confirmedCount} bestätigt) verlieren ihre Paketzuordnung.
            </div>
          );
        })()}
        <div style={{marginBottom:"1.5rem"}}/>
        <div style={{display:"flex",gap:"0.65rem"}}>
          <button onClick={()=>deletePkg(confirmDeletePkg)} style={{flex:1,background:"#dc2626",color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontWeight:700,cursor:"pointer"}}>Löschen</button>
          <button onClick={()=>{ setConfirmDeletePkg(null); setEditPkg(confirmDeletePkg); }} style={{flex:1,background:C.bg,color:C.textMid,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"0.9rem",cursor:"pointer"}}>Abbrechen</button>
        </div>
      </Sheet>}

      {/* ADD PACKAGE */}
      {showAddPkg && <Sheet onClose={()=>{ setShowAddPkg(false); setNewPkg({ name:"", price:5000, slots:2, color:"#e8500a", benefits:[""] }); }} C={C}>
        <div style={{fontSize:"1.1rem",fontWeight:800,marginBottom:"1.25rem"}}>Neues Paket anlegen</div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>PAKETNAME</Label><input type="text" placeholder="z.B. Bronze" value={newPkg.name} onChange={e=>setNewPkg(p=>({...p,name:e.target.value}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>PREIS (€)</Label><input type="number" min="1" value={newPkg.price} onChange={e=>setNewPkg(p=>({...p,price:parseInt(e.target.value)||0}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>VERFÜGBARE SLOTS</Label><input type="number" min="1" value={newPkg.slots} onChange={e=>setNewPkg(p=>({...p,slots:parseInt(e.target.value)||1}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}>
          <Label C={C}>FARBE</Label>
          <div style={{display:"flex",gap:"0.5rem"}}>
            {["#e8500a","#d97706","#64748b","#2563eb","#16a34a","#7c3aed"].map(col=>(
              <div key={col} onClick={()=>setNewPkg(p=>({...p,color:col}))} style={{width:28,height:28,borderRadius:"50%",background:col,border:`3px solid ${newPkg.color===col?"#1a1814":"transparent"}`,cursor:"pointer"}}/>
            ))}
          </div>
        </div>
        <div style={{marginBottom:"1.25rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.5rem"}}>
            <Label C={C}>BENEFITS</Label>
            <button onClick={()=>setNewPkg(p=>({...p,benefits:[...p.benefits,""]}))} style={{fontSize:"0.82rem",color:C.accent,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>+ Hinzufügen</button>
          </div>
          {newPkg.benefits.map((b,i)=>(
            <div key={i} style={{display:"flex",gap:"0.5rem",marginBottom:"0.5rem",alignItems:"center"}}>
              <input value={b} onChange={e=>setNewPkg(p=>({...p,benefits:p.benefits.map((x,j)=>j===i?e.target.value:x)}))} style={{...mkInp(C),flex:1,width:"auto"}} placeholder="Benefit..."/>
              <button onClick={()=>setNewPkg(p=>({...p,benefits:p.benefits.filter((_,j)=>j!==i)}))} style={{background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer"}}>×</button>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:"0.65rem"}}>
          <button onClick={addPkg} disabled={!newPkg.name||newPkg.price<=0} style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontWeight:700,cursor:"pointer",opacity:newPkg.name&&newPkg.price>0?1:0.5}}>Paket erstellen</button>
          <button onClick={()=>{ setShowAddPkg(false); setNewPkg({ name:"", price:5000, slots:2, color:"#e8500a", benefits:[""] }); }} style={{flex:1,background:C.bg,color:C.textMid,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"0.9rem",cursor:"pointer"}}>Abbrechen</button>
        </div>
      </Sheet>}

      {/* SPONSOR DETAIL */}
      {selected && !editSponsor && <Sheet onClose={()=>setSelected(null)} C={C}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.25rem"}}>
          <div><div style={{fontSize:"1.2rem",fontWeight:800,marginBottom:"0.2rem"}}>{selected.company}</div><div style={{fontSize:"0.9rem",color:C.textMid}}>{selected.contact}</div><div style={{fontSize:"0.85rem",color:C.textLight}}>{selected.email}</div></div>
          <Badge status={selected.status} C={C}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(100px, 1fr))",gap:"0.65rem",marginBottom:"1.25rem"}}>
          {[["Paket",selected.package],["Wert",`€${selected.value.toLocaleString("de-DE")}`],["Geöffnet",selected.opened]].map(([l,v])=>(
            <div key={l} style={{background:C.bg,borderRadius:10,padding:"0.75rem",border:`1px solid ${C.border}`,textAlign:"center"}}>
              <div style={{fontSize:"0.68rem",color:C.textLight,fontWeight:600,letterSpacing:"0.06em",marginBottom:"0.3rem"}}>{l.toUpperCase()}</div>
              <div style={{fontSize:"0.95rem",fontWeight:700}}>{v}</div>
            </div>
          ))}
        </div>
        {selected.notes && <div style={{background:C.bg,borderRadius:10,padding:"0.85rem",marginBottom:"1.25rem",border:`1px solid ${C.border}`}}><div style={{fontSize:"0.72rem",color:C.textLight,fontWeight:600,marginBottom:"0.3rem"}}>NOTIZ</div><div style={{fontSize:"0.95rem"}}>{selected.notes}</div></div>}
        <div style={{marginBottom:"1.25rem"}}>
          <div style={{fontSize:"0.72rem",color:C.textLight,fontWeight:600,marginBottom:"0.6rem"}}>STATUS ÄNDERN</div>
          <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
            {Object.entries(STATUS_CONFIG).map(([key,val])=>(
              <button key={key} onClick={()=>updStatus(selected.id,key)} style={{padding:"0.4rem 0.85rem",borderRadius:99,border:`1.5px solid ${selected.status===key?val.color:C.border}`,background:selected.status===key?val.bg:C.surface,color:selected.status===key?val.color:C.textMid,fontSize:"0.85rem",fontWeight:600,cursor:"pointer"}}>{val.label}</button>
            ))}
          </div>
        </div>
        <button onClick={()=>setEditSponsor({...selected})} style={{width:"100%",marginBottom:"0.65rem",background:C.bg,color:C.text,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"0.85rem",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"}}><Pencil size={14} strokeWidth={1.5}/>Sponsor-Akte öffnen</button>
        <button onClick={()=>{ if(!hasFeature(user?.tier||'free','email-templates')){ setShowUpgrade({feature:'email-templates',label:'E-Mail Pitch-Editor',requiredTier:'pro'}); return; } setPitchText("");setShowPitchEditor(selected);setSelected(null); }} style={{width:"100%",marginBottom:"0.65rem",background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"}}><Mail size={15} strokeWidth={1.5}/>Pitch E-Mail verfassen</button>
        <button onClick={()=>setSelected(null)} style={{width:"100%",background:"none",color:C.textMid,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"0.8rem",cursor:"pointer"}}>Schließen</button>
      </Sheet>}

      {/* EDIT SPONSOR */}
      {editSponsor && <Sheet onClose={()=>{ setEditSponsor(null); setEditSponsorTab("details"); setShowAddCall(false); setShowAddApt(false); }} C={C}>
        <div style={{fontSize:"1.1rem",fontWeight:800,marginBottom:"0.85rem"}}>Sponsor-Akte öffnen</div>

        {/* TABS */}
        <div style={{display:"flex",gap:"0.35rem",marginBottom:"1.25rem",background:C.bg,borderRadius:10,padding:"0.25rem",border:`1px solid ${C.border}`,overflowX:"auto",scrollbarWidth:"none"}}>
          {[["details","Details"],["calls","Telefonate"],["appointments","Termine"],...((editSponsor.status==="negotiating"||editSponsor.status==="confirmed") && hasFeature(user?.tier||'free','agreements')?[["vereinbarung","Vereinbarung"]]:[])]
            .map(([id,label])=>(
            <button key={id} onClick={()=>{ setEditSponsorTab(id); setShowAddCall(false); setShowAddApt(false); }}
              style={{flex:1,padding:"0.5rem 0.3rem",borderRadius:8,border:"none",cursor:"pointer",fontSize:"0.72rem",fontWeight:700,
                background: editSponsorTab===id ? C.surface : "transparent",
                color: editSponsorTab===id ? C.accent : C.textMid,
                boxShadow: editSponsorTab===id ? "0 1px 4px rgba(0,0,0,0.08)" : "none"
              }}>
              {label}{id==="calls"&&(editSponsor.calls||[]).length>0?` (${(editSponsor.calls||[]).length})`:""}
              {id==="appointments"&&(editSponsor.appointments||[]).filter(a=>!a.done).length>0?` (${(editSponsor.appointments||[]).filter(a=>!a.done).length})`:""}
            </button>
          ))}
          {(editSponsor.status==="negotiating"||editSponsor.status==="confirmed") && !hasFeature(user?.tier||'free','agreements') && (
            <button onClick={()=>setShowUpgrade({feature:'agreements',label:'Sponsorenvereinbarung',requiredTier:'max'})}
              style={{fontSize:"0.78rem",color:C.accent,background:C.accentSoft,border:`1px solid ${C.accentBorder}`,borderRadius:8,padding:"0.35rem 0.75rem",cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",gap:"0.35rem",flexShrink:0}}>
              <Zap size={11} strokeWidth={1.5}/>Vereinbarung (Max)
            </button>
          )}
        </div>

        {/* TAB: DETAILS */}
        {editSponsorTab==="details" && <>
          <div style={{marginBottom:"0.9rem"}}><Label C={C}>UNTERNEHMEN</Label><input type="text" value={editSponsor.company} onChange={e=>setEditSponsor(p=>({...p,company:e.target.value}))} style={mkInp(C)}/></div>
          <div style={{marginBottom:"0.9rem"}}><Label C={C}>ANSPRECHPARTNER</Label><input type="text" value={editSponsor.contact} onChange={e=>setEditSponsor(p=>({...p,contact:e.target.value}))} style={mkInp(C)}/></div>
          <div style={{marginBottom:"0.9rem"}}><Label C={C}>E-MAIL</Label><input type="email" value={editSponsor.email} onChange={e=>setEditSponsor(p=>({...p,email:e.target.value}))} style={mkInp(C)}/></div>
          <div style={{marginBottom:"0.9rem"}}><Label C={C}>PAKET</Label>
            <select value={editSponsor.package} onChange={e=>{
              const selectedPkg = proj.packages.find(p=>p.name===e.target.value);
              setEditSponsor(p=>({...p,package:e.target.value,value:selectedPkg?.price||p.value}));
            }} style={mkInp(C)}>
              {proj.packages.map(p=><option key={p.id} value={p.name}>{p.name} — €{p.price.toLocaleString("de-DE")}</option>)}
            </select>
          </div>
          <div style={{marginBottom:"0.9rem"}}>
            <Label C={C}>INDIVIDUELLER PREIS (€)</Label>
            <div style={{display:"flex",gap:"0.5rem",alignItems:"center"}}>
              <input type="number" min="0" value={editSponsor.value} onChange={e=>setEditSponsor(p=>({...p,value:parseInt(e.target.value)||0}))} style={{...mkInp(C),flex:1}}/>
              {(() => { const pkgRef = proj.packages.find(p=>p.name===editSponsor.package); return pkgRef && pkgRef.price !== editSponsor.value ? (
                <button type="button" onClick={()=>setEditSponsor(p=>({...p,value:pkgRef.price}))}
                  style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"0.55rem 0.75rem",fontSize:"0.75rem",color:C.textMid,cursor:"pointer",whiteSpace:"nowrap",fontWeight:600}}>
                  ↺ €{pkgRef.price.toLocaleString("de-DE")}
                </button>
              ) : null; })()}
            </div>
          </div>
          {/* Leistungen des Veranstalters — anpassbar (Punkte entfernen) */}
          {(() => {
            const pkgBenefits = proj.packages.find(p=>p.name===editSponsor.package)?.benefits || [];
            if (pkgBenefits.length === 0) return null;
            const removed = editSponsor.removedBenefits || [];
            return (
              <div style={{marginBottom:"1.25rem"}}>
                <Label C={C}>LEISTUNGEN DES VERANSTALTERS</Label>
                {pkgBenefits.map((b, i) => {
                  const isRemoved = removed.includes(b);
                  return (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:"0.5rem",background:isRemoved?"#fef2f2":C.surface,border:`1px solid ${isRemoved?"#fecaca":C.border}`,borderRadius:8,padding:"0.45rem 0.7rem",marginBottom:"0.35rem",opacity:isRemoved?0.55:1}}>
                      <span style={{flex:1,fontSize:"0.88rem",color:C.text,textDecoration:isRemoved?"line-through":"none"}}>{b}</span>
                      {isRemoved ? (
                        <button type="button" onClick={()=>setEditSponsor(p=>({...p,removedBenefits:(p.removedBenefits||[]).filter(x=>x!==b)}))}
                          style={{background:"none",border:"none",cursor:"pointer",color:C.accent,padding:"0.1rem",fontSize:"0.72rem",fontWeight:700,flexShrink:0}}>
                          ↺
                        </button>
                      ) : (
                        <button type="button" onClick={()=>setEditSponsor(p=>({...p,removedBenefits:[...(p.removedBenefits||[]),b]}))}
                          style={{background:"none",border:"none",cursor:"pointer",color:C.textLight,padding:"0.1rem",display:"flex",alignItems:"center",flexShrink:0}}>
                          <Trash2 size={13} strokeWidth={1.5}/>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Individuelle Paket-Ergänzungen */}
          <div style={{marginBottom:"1.25rem"}}>
            <Label C={C}>INDIVIDUELLE ERGÄNZUNGEN ZUM PAKET</Label>
            {(editSponsor.packageExtras||[]).map((extra,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:"0.5rem",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"0.45rem 0.7rem",marginBottom:"0.35rem"}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:C.accent,flexShrink:0}}/>
                <span style={{flex:1,fontSize:"0.88rem",color:C.text}}>{extra}</span>
                <button type="button" onClick={()=>setEditSponsor(p=>({...p,packageExtras:(p.packageExtras||[]).filter((_,j)=>j!==i)}))}
                  style={{background:"none",border:"none",cursor:"pointer",color:C.textLight,padding:"0.1rem",display:"flex",alignItems:"center"}}>
                  <Trash2 size={13} strokeWidth={1.5}/>
                </button>
              </div>
            ))}
            <div style={{display:"flex",gap:"0.5rem",marginTop:"0.35rem"}}>
              <input
                type="text"
                value={newPackageExtra}
                onChange={e=>setNewPackageExtra(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&newPackageExtra.trim()){e.preventDefault();setEditSponsor(p=>({...p,packageExtras:[...(p.packageExtras||[]),newPackageExtra.trim()]}));setNewPackageExtra("");}}}
                placeholder="Ergänzung hinzufügen…"
                style={{...mkInp(C),flex:1,fontSize:"0.85rem"}}
              />
              <button type="button"
                onClick={()=>{if(newPackageExtra.trim()){setEditSponsor(p=>({...p,packageExtras:[...(p.packageExtras||[]),newPackageExtra.trim()]}));setNewPackageExtra("");}}}
                disabled={!newPackageExtra.trim()}
                style={{background:newPackageExtra.trim()?C.accent:"#d4cfca",color:"#fff",border:"none",borderRadius:9,padding:"0 0.85rem",cursor:newPackageExtra.trim()?"pointer":"not-allowed",fontWeight:700,fontSize:"0.85rem",flexShrink:0}}>
                +
              </button>
            </div>
          </div>
          <div style={{marginBottom:"1.25rem"}}><Label C={C}>NOTIZ</Label><textarea rows={2} value={editSponsor.notes} onChange={e=>setEditSponsor(p=>({...p,notes:e.target.value}))} style={{...mkInp(C),resize:"none"}}/></div>


          {/* Anpassbarer Vertragstext */}
          {(() => {
            const agr = editSponsor.agreement || { customText:"" };
            const setAgr = fn => setEditSponsor(s=>({...s, agreement: fn(s.agreement||agr)}));
            return (
              <div style={{marginBottom:"1.25rem"}}>
                <Label C={C}>BESONDERE VEREINBARUNGEN</Label>
                <textarea
                  rows={3}
                  value={agr.customText||""}
                  onChange={e=>setAgr(a=>({...a,customText:e.target.value}))}
                  placeholder="z.B. Logo-Lieferung bis 01.04., exklusives Branding in Eingangsbereich…"
                  style={{...mkInp(C),resize:"none",fontSize:"0.85rem",lineHeight:1.5}}
                />
              </div>
            );
          })()}

          <div style={{display:"flex",gap:"0.65rem"}}>
            <button onClick={saveEditSponsor} style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontWeight:700,cursor:"pointer"}}>Speichern</button>
            <button onClick={()=>{ setEditSponsor(null); setEditSponsorTab("details"); }} style={{flex:1,background:C.bg,color:C.textMid,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"0.9rem",cursor:"pointer"}}>Abbrechen</button>
          </div>
        </>}

        {/* TAB: TELEFONATE */}
        {editSponsorTab==="calls" && <>
          {/* Existing calls */}
          {(editSponsor.calls||[]).length === 0 && !showAddCall && (
            <div style={{textAlign:"center",padding:"1.5rem 1rem",color:C.textLight,fontSize:"0.88rem"}}>
              <PhoneCall size={28} strokeWidth={1.5} style={{marginBottom:"0.5rem",opacity:0.4}}/>
              <div>Noch keine Anrufe erfasst</div>
            </div>
          )}
          {(editSponsor.calls||[]).map((call,i)=>{
            const rc = CALL_RESULT_CONFIG[call.result]||CALL_RESULT_CONFIG.no_answer;
            return (
              <div key={call.id} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"0.85rem",marginBottom:"0.6rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.4rem"}}>
                  <div style={{display:"flex",flexDirection:"column",gap:"0.2rem"}}>
                    <div style={{fontSize:"0.9rem",fontWeight:700}}>
                      {new Date(call.date+"T12:00:00").toLocaleDateString("de-AT",{day:"2-digit",month:"2-digit",year:"numeric"})}
                      {call.duration ? <span style={{fontWeight:400,color:C.textMid,fontSize:"0.8rem"}}> · {call.duration} Min.</span> : null}
                    </div>
                    {call.notes && <div style={{fontSize:"0.82rem",color:C.textMid,lineHeight:1.4}}>{call.notes}</div>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:"0.4rem",flexShrink:0,marginLeft:"0.5rem"}}>
                    <span style={{fontSize:"0.65rem",fontWeight:700,padding:"0.2rem 0.55rem",borderRadius:99,background:rc.bg,color:rc.color,whiteSpace:"nowrap"}}>{rc.label}</span>
                    <button onClick={()=>setEditSponsor(s=>({...s,calls:(s.calls||[]).filter((_,j)=>j!==i)}))} style={{background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:6,width:24,height:24,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Trash2 size={11} strokeWidth={1.5}/></button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add call form */}
          {showAddCall && (
            <div style={{background:C.accentSoft,border:`1px solid ${C.accentBorder}`,borderRadius:12,padding:"0.9rem",marginBottom:"0.75rem"}}>
              <div style={{fontSize:"0.82rem",fontWeight:700,color:C.accent,marginBottom:"0.75rem"}}>Neuer Anruf</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.6rem",marginBottom:"0.6rem"}}>
                <div><Label C={C}>DATUM</Label><input type="date" value={newCall.date} onChange={e=>setNewCall(c=>({...c,date:e.target.value}))} style={mkInp(C)}/></div>
                <div><Label C={C}>DAUER (MIN.)</Label><input type="number" min="1" placeholder="15" value={newCall.duration} onChange={e=>setNewCall(c=>({...c,duration:e.target.value}))} style={mkInp(C)}/></div>
              </div>
              <div style={{marginBottom:"0.6rem"}}><Label C={C}>ERGEBNIS</Label>
                <select value={newCall.result} onChange={e=>setNewCall(c=>({...c,result:e.target.value}))} style={mkInp(C)}>
                  {Object.entries(CALL_RESULT_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div style={{marginBottom:"0.75rem"}}><Label C={C}>NOTIZEN</Label><textarea rows={2} value={newCall.notes} onChange={e=>setNewCall(c=>({...c,notes:e.target.value}))} style={{...mkInp(C),resize:"none"}} placeholder="z.B. Sehr interessiert, will Unterlagen..."/></div>
              <div style={{display:"flex",gap:"0.5rem"}}>
                <button onClick={()=>{
                  const call = { id:newId(), date:newCall.date, duration:newCall.duration?parseInt(newCall.duration):null, result:newCall.result, notes:newCall.notes };
                  setEditSponsor(s=>({...s,calls:[...(s.calls||[]),call]}));
                  setNewCall({date:new Date().toISOString().slice(0,10),duration:"",result:"interested",notes:""});
                  setShowAddCall(false);
                }} style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:10,padding:"0.75rem",fontWeight:700,cursor:"pointer",fontSize:"0.88rem"}}>Anruf speichern</button>
                <button onClick={()=>setShowAddCall(false)} style={{flex:1,background:C.bg,color:C.textMid,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"0.75rem",cursor:"pointer",fontSize:"0.88rem"}}>Abbrechen</button>
              </div>
            </div>
          )}

          {!showAddCall && <button onClick={()=>setShowAddCall(true)} style={{width:"100%",background:C.bg,color:C.accent,border:`1.5px dashed ${C.accentBorder}`,borderRadius:12,padding:"0.85rem",fontSize:"0.88rem",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",marginBottom:"0.75rem"}}><PhoneCall size={14} strokeWidth={1.5}/>+ Anruf hinzufügen</button>}

          <button onClick={saveEditSponsor} style={{width:"100%",background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontWeight:700,cursor:"pointer"}}>Speichern & Schließen</button>
        </>}

        {/* TAB: TERMINE */}
        {editSponsorTab==="appointments" && <>
          {/* Existing appointments */}
          {(editSponsor.appointments||[]).length === 0 && !showAddApt && (
            <div style={{textAlign:"center",padding:"1.5rem 1rem",color:C.textLight,fontSize:"0.88rem"}}>
              <CalendarDays size={28} strokeWidth={1.5} style={{marginBottom:"0.5rem",opacity:0.4}}/>
              <div>Noch keine Termine eingetragen</div>
            </div>
          )}
          {(editSponsor.appointments||[]).map((apt,i)=>(
            <div key={apt.id} style={{background:apt.done?C.bg:C.surface,border:`1px solid ${apt.done?C.border:C.accentBorder}`,borderRadius:12,padding:"0.85rem",marginBottom:"0.6rem",opacity:apt.done?0.65:1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:"0.9rem",fontWeight:700,color:apt.done?C.textMid:C.text,textDecoration:apt.done?"line-through":"none",marginBottom:"0.15rem"}}>{apt.title||"Termin"}</div>
                  <div style={{fontSize:"0.8rem",color:C.textMid,display:"flex",alignItems:"center",gap:"0.35rem"}}>
                    <Calendar size={11} strokeWidth={1.5}/>
                    {new Date(apt.date+"T12:00:00").toLocaleDateString("de-AT",{day:"2-digit",month:"2-digit",year:"numeric"})}{apt.time?` um ${apt.time}`:""}</div>
                  {apt.notes && <div style={{fontSize:"0.78rem",color:C.textLight,marginTop:"0.3rem"}}>{apt.notes}</div>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"0.4rem",flexShrink:0,marginLeft:"0.5rem"}}>
                  <button
                    onClick={()=>setEditSponsor(s=>({...s,appointments:(s.appointments||[]).map((a,j)=>j===i?{...a,done:!a.done}:a)}))}
                    style={{background:apt.done?C.bg:"#f0fdf4",color:apt.done?C.textLight:"#16a34a",border:`1px solid ${apt.done?C.border:"#bbf7d0"}`,borderRadius:6,width:26,height:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
                    title={apt.done?"Als offen markieren":"Als erledigt markieren"}
                  ><Check size={12} strokeWidth={2}/></button>
                  <button onClick={()=>generateICS(apt, editSponsor.company, proj.name)} style={{background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe",borderRadius:6,width:26,height:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="In Kalender exportieren (.ics)"><Download size={11} strokeWidth={1.5}/></button>
                  <button onClick={()=>setEditSponsor(s=>({...s,appointments:(s.appointments||[]).filter((_,j)=>j!==i)}))} style={{background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:6,width:26,height:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={11} strokeWidth={1.5}/></button>
                </div>
              </div>
            </div>
          ))}

          {/* Add appointment form */}
          {showAddApt && (
            <div style={{background:C.accentSoft,border:`1px solid ${C.accentBorder}`,borderRadius:12,padding:"0.9rem",marginBottom:"0.75rem"}}>
              <div style={{fontSize:"0.82rem",fontWeight:700,color:C.accent,marginBottom:"0.75rem"}}>Neuer Termin</div>
              <div style={{marginBottom:"0.6rem"}}><Label C={C}>TITEL</Label><input type="text" placeholder="z.B. Follow-up Anruf" value={newApt.title} onChange={e=>setNewApt(a=>({...a,title:e.target.value}))} style={mkInp(C)}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.6rem",marginBottom:"0.6rem"}}>
                <div><Label C={C}>DATUM</Label><input type="date" value={newApt.date} onChange={e=>setNewApt(a=>({...a,date:e.target.value}))} style={mkInp(C)}/></div>
                <div><Label C={C}>UHRZEIT</Label><input type="time" value={newApt.time} onChange={e=>setNewApt(a=>({...a,time:e.target.value}))} style={mkInp(C)}/></div>
              </div>
              <div style={{marginBottom:"0.75rem"}}><Label C={C}>NOTIZEN</Label><textarea rows={2} value={newApt.notes} onChange={e=>setNewApt(a=>({...a,notes:e.target.value}))} style={{...mkInp(C),resize:"none"}} placeholder="z.B. Angebot besprechen..."/></div>
              <div style={{display:"flex",gap:"0.5rem"}}>
                <button onClick={()=>{
                  const apt = { id:newId(), date:newApt.date, time:newApt.time, title:newApt.title||"Termin", notes:newApt.notes, done:false };
                  setEditSponsor(s=>({...s,appointments:[...(s.appointments||[]),apt]}));
                  setNewApt({date:new Date().toISOString().slice(0,10),time:"10:00",title:"",notes:""});
                  setShowAddApt(false);
                }} style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:10,padding:"0.75rem",fontWeight:700,cursor:"pointer",fontSize:"0.88rem"}}>Termin speichern</button>
                <button onClick={()=>setShowAddApt(false)} style={{flex:1,background:C.bg,color:C.textMid,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"0.75rem",cursor:"pointer",fontSize:"0.88rem"}}>Abbrechen</button>
              </div>
            </div>
          )}

          {!showAddApt && <button onClick={()=>setShowAddApt(true)} style={{width:"100%",background:C.bg,color:C.accent,border:`1.5px dashed ${C.accentBorder}`,borderRadius:12,padding:"0.85rem",fontSize:"0.88rem",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",marginBottom:"0.75rem"}}><CalendarDays size={14} strokeWidth={1.5}/>+ Termin hinzufügen</button>}

          <button onClick={saveEditSponsor} style={{width:"100%",background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontWeight:700,cursor:"pointer"}}>Speichern & Schließen</button>
        </>}

        {/* TAB: VEREINBARUNG */}
        {editSponsorTab==="vereinbarung" && hasFeature(user?.tier||'free','agreements') && (() => {
          const pkg = proj.packages.find(pk=>pk.name===editSponsor.package);
          const agr = editSponsor.agreement || { signed:false, signedDate:"", customText:"", benefitChecklist:[] };
          const doc = editSponsor.postEventDoc || { report:"", reach:"", sentToSponsor:false, sentDate:"" };

          const setAgr = (fn) => setEditSponsor(s=>({...s, agreement: fn(s.agreement||agr)}));
          const setDoc = (fn) => setEditSponsor(s=>({...s, postEventDoc: fn(s.postEventDoc||doc)}));

          const openPrintView = () => {
            const data = {
              eventName: proj.name,
              eventDate: proj.date,
              eventLocation: proj.location,
              organizer: user.name || "Veranstalter",
              organizerAddress: agr.organizerAddress || "",
              organizerEmail: user.email || "",
              organizerLogo: user.logo || null,
              sponsorCompany: editSponsor.company,
              sponsorContact: editSponsor.contact,
              sponsorEmail: editSponsor.email,
              sponsorAddress: agr.sponsorAddress || "",
              packageName: pkg?.name || editSponsor.package,
              packagePrice: editSponsor.value,
              benefits: (agr.benefitChecklist||[]).map(x=>x.benefit).filter(Boolean).length > 0
                ? (agr.benefitChecklist||[]).map(x=>x.benefit).filter(Boolean)
                : (pkg?.benefits || []),
              packageExtras: editSponsor.packageExtras || [],
              customText: agr.customText || "",
              mwst: user.mwst || "0",
            };
            try {
              sessionStorage.setItem("vereinbarung_data", JSON.stringify(data));
            } catch(e) {
              console.warn("sessionStorage nicht verfügbar");
            }
            window.open("/vereinbarung", "_blank");
          };

          const markSigned = () => {
            const today = new Date().toISOString().slice(0,10);
            const removed = editSponsor.removedBenefits || [];
            const activeBenefits = (pkg?.benefits||[]).filter(b => !removed.includes(b));
            const extras = (editSponsor.packageExtras||[]).map(b=>({benefit:b,done:false}));
            const checklist = [...activeBenefits.map(b=>({benefit:b,done:false})), ...extras];
            const neuesAgr = {...agr, signed:true, signedDate:today, benefitChecklist:checklist};
            setEditSponsor(s=>({...s, agreement: neuesAgr}));
            const neuerStatus = "confirmed";
            const updatedSponsor = {...editSponsor, agreement: neuesAgr, status: neuerStatus};
            // Persist immediately into pipeline so data is not lost if sheet is closed without saving
            updProj(p=>({...p, pipeline: p.pipeline.map(s => s.id===editSponsor.id ? updatedSponsor : s)}));
            // Automatically set pipeline status to confirmed
            if (editSponsor.status !== "confirmed") {
              updStatus(editSponsor.id, "confirmed");
              setEditSponsor(s=>({...s, status: neuerStatus}));
            }
            notify("Vereinbarung unterzeichnet — Status auf Bestätigt gesetzt");
          };

          const sendPostEventEmail = () => {
            const subject = `Sponsoring-Dokumentation: ${proj.name}`;
            const bodyLines = [
              `Hallo ${editSponsor.contact},`,
              ``,
              `vielen Dank für deine Unterstützung von ${proj.name} als ${pkg?.name||editSponsor.package}-Sponsor.`,
              ``,
              `Hier ist unsere Veranstaltungsdokumentation:`,
              ``,
              doc.report ? `Erbrachte Leistungen:\n${doc.report}` : "",
              doc.reach ? `Reichweite / Zahlen:\n${doc.reach}` : "",
              ``,
              `Mit freundlichen Grüßen`,
              user.name||"",
            ].filter(l=>l!==undefined).join("\n");
            const htmlBody = emailTemplate(proj.name, bodyLines.replace(/\n/g, '<br>'));
            sendEmail({
              to: editSponsor.email,
              subject,
              body: htmlBody,
              onSuccess: () => {
                const today = new Date().toISOString().slice(0,10);
                setDoc(d=>({...d, sentToSponsor:true, sentDate:today}));
              },
            });
          };

          return (
            <>
              {/* ABSCHNITT A — VEREINBARUNG */}
              <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,padding:"1.1rem",marginBottom:"1.25rem"}}>
                <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.85rem"}}>
                  <FileText size={14} strokeWidth={1.5} color={C.accent}/>
                  <div style={{fontSize:"0.88rem",fontWeight:800,color:C.text}}>Sponsorenvereinbarung</div>
                </div>

                {/* Preis-Übersicht mit Steuer */}
                {(() => {
                  const netto = editSponsor.value;
                  const mwst = user.mwst || "0";
                  let rows = [];
                  let brutto = netto;
                  let taxLabel = "exkl. Steuern";
                  if (mwst === "mwst10") {
                    const t = Math.round(netto * 0.10);
                    rows = [{ label: "MwSt. (10 %)", amount: t }];
                    brutto = netto + t; taxLabel = "zzgl. 10 % MwSt.";
                  } else if (mwst === "mwst20") {
                    const t = Math.round(netto * 0.20);
                    rows = [{ label: "MwSt. (20 %)", amount: t }];
                    brutto = netto + t; taxLabel = "zzgl. 20 % MwSt.";
                  } else if (mwst === "werbung5") {
                    const wa = Math.round(netto * 0.05);
                    rows = [{ label: "Werbeabgabe (5 %)", amount: wa }];
                    brutto = netto + wa; taxLabel = "zzgl. 5 % Werbeabgabe";
                  } else if (mwst === "werbung5_mwst20") {
                    const wa = Math.round(netto * 0.05);
                    const mv = Math.round((netto + wa) * 0.20);
                    rows = [{ label: "Werbeabgabe (5 %)", amount: wa }, { label: "MwSt. (20 %)", amount: mv }];
                    brutto = netto + wa + mv; taxLabel = "zzgl. 5 % Werbeabgabe + 20 % MwSt.";
                  }
                  const hasTax = rows.length > 0;
                  return (
                    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"0.75rem 1rem",marginBottom:"1rem"}}>
                      <div style={{fontSize:"0.72rem",fontWeight:700,color:C.textLight,letterSpacing:"0.07em",marginBottom:"0.5rem"}}>{(pkg?.name||editSponsor.package).toUpperCase()}-SPONSORING · {editSponsor.company}</div>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.85rem",color:C.textMid,marginBottom:"0.2rem"}}>
                        <span>Nettobetrag</span><span style={{fontWeight:600,color:C.text}}>€{netto.toLocaleString("de-DE")}</span>
                      </div>
                      {rows.map((r,i)=>(
                        <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:"0.85rem",color:C.textMid,marginBottom:"0.2rem"}}>
                          <span>{r.label}</span><span style={{fontWeight:600,color:C.text}}>€{r.amount.toLocaleString("de-DE")}</span>
                        </div>
                      ))}
                      {!hasTax && <div style={{fontSize:"0.75rem",color:C.textLight,marginTop:"0.1rem"}}>{taxLabel}</div>}
                      {hasTax && (
                        <div style={{display:"flex",justifyContent:"space-between",borderTop:`1.5px solid ${C.border}`,marginTop:"0.4rem",paddingTop:"0.4rem"}}>
                          <span style={{fontSize:"0.88rem",fontWeight:700,color:C.text}}>Gesamtbetrag</span>
                          <span style={{fontSize:"1rem",fontWeight:800,color:C.accent}}>€{brutto.toLocaleString("de-DE")}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {!agr.signed ? (
                  <>
                    <div style={{marginBottom:"0.85rem"}}>
                      <Label C={C}>ADRESSE VERANSTALTER</Label>
                      <textarea rows={2} value={agr.organizerAddress||""} onChange={e=>setAgr(a=>({...a,organizerAddress:e.target.value}))} style={{...mkInp(C),resize:"none",fontSize:"0.85rem",lineHeight:1.5}} placeholder="Straße, PLZ Ort"/>
                    </div>
                    <div style={{marginBottom:"0.85rem"}}>
                      <Label C={C}>ADRESSE SPONSOR</Label>
                      <textarea rows={2} value={agr.sponsorAddress||""} onChange={e=>setAgr(a=>({...a,sponsorAddress:e.target.value}))} style={{...mkInp(C),resize:"none",fontSize:"0.85rem",lineHeight:1.5}} placeholder="Straße, PLZ Ort"/>
                    </div>
                    <div style={{display:"flex",gap:"0.6rem"}}>
                      <button
                        onClick={openPrintView}
                        style={{flex:1,background:C.surface,color:C.accent,border:`1.5px solid ${C.accentBorder}`,borderRadius:10,padding:"0.75rem",fontSize:"0.82rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem"}}
                      >
                        <FileText size={13} strokeWidth={1.5}/>Anzeigen &amp; Drucken
                      </button>
                      <button
                        onClick={markSigned}
                        style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:10,padding:"0.75rem",fontSize:"0.82rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem"}}
                      >
                        <Check size={13} strokeWidth={2}/>Als unterzeichnet markieren
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Signed badge */}
                    <div style={{display:"flex",alignItems:"center",gap:"0.5rem",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:"0.7rem 0.9rem",marginBottom:"1rem"}}>
                      <CheckCircle size={15} strokeWidth={2} color="#16a34a"/>
                      <div style={{fontSize:"0.88rem",fontWeight:700,color:"#16a34a"}}>
                        Unterzeichnet am {agr.signedDate ? new Date(agr.signedDate+"T12:00:00").toLocaleDateString("de-AT",{day:"2-digit",month:"2-digit",year:"numeric"}) : "—"}
                      </div>
                      <button
                        onClick={()=>setAgr(a=>({...a,signed:false,signedDate:""}))}
                        style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",fontSize:"0.72rem",color:"#16a34a",fontWeight:600,textDecoration:"underline"}}
                      >rückgängig</button>
                    </div>

                    {/* Leistungs-Checkliste nach Unterzeichnung */}
                    {(agr.benefitChecklist||[]).length > 0 && (
                      <div style={{marginBottom:"1rem"}}>
                        <div style={{fontSize:"0.72rem",fontWeight:700,color:C.textMid,letterSpacing:"0.06em",marginBottom:"0.5rem"}}>LEISTUNGEN DES VERANSTALTERS</div>
                        {(agr.benefitChecklist||[]).map((item,i)=>(
                          <div key={i}
                            onClick={()=>setAgr(a=>({...a,benefitChecklist:(a.benefitChecklist||[]).map((x,j)=>j===i?{...x,done:!x.done}:x)}))}
                            style={{display:"flex",alignItems:"center",gap:"0.65rem",padding:"0.55rem 0.7rem",borderRadius:9,marginBottom:"0.3rem",cursor:"pointer",background:item.done?"#f0fdf4":C.surface,border:`1px solid ${item.done?"#bbf7d0":C.border}`}}>
                            <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${item.done?"#16a34a":C.border}`,background:item.done?"#16a34a":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              {item.done && <span style={{color:"#fff",fontSize:"0.65rem",fontWeight:700}}>✓</span>}
                            </div>
                            <span style={{fontSize:"0.88rem",color:item.done?"#16a34a":C.text,textDecoration:item.done?"line-through":"none",lineHeight:1.4}}>{item.benefit}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* PDF Upload */}
                    <div style={{marginBottom:"1rem"}}>
                      <div style={{fontSize:"0.72rem",fontWeight:700,color:C.textMid,letterSpacing:"0.06em",marginBottom:"0.5rem"}}>UNTERZEICHNETE VEREINBARUNG (PDF)</div>
                      {agr.signedPdfUrl ? (
                        <div style={{display:"flex",alignItems:"center",gap:"0.5rem",background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"0.6rem 0.8rem"}}>
                          <FileText size={13} strokeWidth={1.5} color={C.accent}/>
                          <a href={agr.signedPdfUrl} target="_blank" rel="noreferrer" style={{flex:1,fontSize:"0.82rem",color:C.accent,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>PDF anzeigen</a>
                          <button type="button" onClick={()=>pdfInputRef.current?.click()} style={{fontSize:"0.72rem",color:C.textMid,background:"none",border:"none",cursor:"pointer",fontWeight:600,flexShrink:0}}>Ersetzen</button>
                        </div>
                      ) : (
                        <button type="button" onClick={()=>pdfInputRef.current?.click()} style={{width:"100%",background:C.bg,border:`1.5px dashed ${C.border}`,borderRadius:9,padding:"0.7rem",fontSize:"0.82rem",color:C.textMid,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem"}}>
                          <Upload size={13} strokeWidth={1.5}/>PDF hochladen
                        </button>
                      )}
                      <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf" style={{display:"none"}} onChange={async e=>{
                        const file = e.target.files?.[0];
                        if(!file) return;
                        notify("PDF wird hochgeladen…");
                        try {
                          const url = await uploadAgreementPdf(user.id, proj.id, editSponsor.id, file);
                          setAgr(a=>({...a,signedPdfUrl:url}));
                          notify("PDF gespeichert");
                        } catch(err) { console.error(err); notify("Fehler beim Hochladen"); }
                        e.target.value="";
                      }}/>
                    </div>

                    {/* Rechnung & Zahlung */}
                    <div style={{marginBottom:"1rem"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.5rem"}}>
                        <div style={{fontSize:"0.72rem",fontWeight:700,color:C.textMid,letterSpacing:"0.06em"}}>RECHNUNG & ZAHLUNG</div>
                        <button
                          type="button"
                          onClick={()=>{
                            const netto = editSponsor.value||0;
                            const mwstKey = user.mwst||"0";
                            let steuer = 0, brutto = netto;
                            if(mwstKey==="mwst10"){ steuer=Math.round(netto*0.1*100)/100; brutto=netto+steuer; }
                            else if(mwstKey==="mwst20"){ steuer=Math.round(netto*0.2*100)/100; brutto=netto+steuer; }
                            else if(mwstKey==="werbung5"){ steuer=Math.round(netto*0.05*100)/100; brutto=netto+steuer; }
                            else if(mwstKey==="werbung5_mwst20"){ const w=Math.round(netto*0.05*100)/100; const m=Math.round((netto+w)*0.2*100)/100; steuer=w+m; brutto=netto+steuer; }
                            const leistungen = (agr.benefitChecklist||[]).map(b=>b.benefit).join(" | ");
                            const adresse = (agr.sponsorAddress||"—").replace(/\n/g, ", ");
                            const rows = [
                              ["Veranstaltung","Sponsor","Ansprechperson","E-Mail","Rechnungsadresse","Paket","Netto (€)","Steuer (€)","Brutto (€)","Leistungen","Unterzeichnet am"],
                              [proj.name, editSponsor.company, editSponsor.contact||"—", editSponsor.email||"—", adresse, editSponsor.package||"—", netto.toString(), steuer.toFixed(2), brutto.toFixed(2), leistungen, agr.signedDate||"—"]
                            ];
                            const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(";")).join("\n");
                            const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href=url; a.download=`Rechnung_${editSponsor.company.replace(/\s+/g,"_")}_${proj.name.replace(/\s+/g,"_")}.csv`; a.click();
                            URL.revokeObjectURL(url);
                            setAgr(a=>({...a, csvExported:true}));
                          }}
                          style={{background:C.accentSoft,color:C.accent,border:`1px solid ${C.accentBorder}`,borderRadius:8,padding:"0.25rem 0.65rem",fontSize:"0.72rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:"0.3rem"}}
                        >
                          <Download size={11} strokeWidth={2}/>CSV Export
                        </button>
                      </div>
                      {[
                        {key:"invoiceSent", label:"Rechnung gesendet"},
                        {key:"paymentReceived", label:"Zahlung erhalten"},
                      ].map(({key,label})=>{
                        const checked = !!agr[key];
                        return (
                          <div
                            key={key}
                            onClick={()=>setAgr(a=>({...a,[key]:!a[key]}))}
                            style={{display:"flex",alignItems:"center",gap:"0.65rem",padding:"0.6rem 0.75rem",borderRadius:9,marginBottom:"0.35rem",cursor:"pointer",background:checked?"#f0fdf4":C.surface,border:`1px solid ${checked?"#bbf7d0":C.border}`}}
                          >
                            <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${checked?"#16a34a":C.border}`,background:checked?"#16a34a":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              {checked && <span style={{color:"#fff",fontSize:"0.65rem",fontWeight:700}}>✓</span>}
                            </div>
                            <span style={{fontSize:"0.88rem",fontWeight:600,color:checked?"#16a34a":C.text}}>{label}</span>
                          </div>
                        );
                      })}
                    </div>

                  </>
                )}
              </div>

              {/* ABSCHNITT B — NACH DER VERANSTALTUNG */}
              <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,padding:"1.1rem",marginBottom:"1.25rem"}}>
                <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.85rem"}}>
                  <FileText size={14} strokeWidth={1.5} color={C.textMid}/>
                  <div style={{fontSize:"0.88rem",fontWeight:800,color:C.text}}>Nach der Veranstaltung</div>
                </div>
                <div style={{marginBottom:"0.75rem"}}>
                  <Label C={C}>DOKUMENTATION (WAS WURDE GELIEFERT?)</Label>
                  <textarea
                    rows={4}
                    value={doc.report||""}
                    onChange={e=>setDoc(d=>({...d,report:e.target.value}))}
                    style={{...mkInp(C),resize:"none",fontSize:"0.85rem",lineHeight:1.5}}
                    placeholder="z.B. Logo auf Hauptbühne prominent gezeigt, 2 VIP-Tickets übergeben, Social-Media-Post veröffentlicht..."
                  />
                </div>
                <div style={{marginBottom:"1rem"}}>
                  <Label C={C}>REICHWEITE / ZAHLEN</Label>
                  <input
                    type="text"
                    value={doc.reach||""}
                    onChange={e=>setDoc(d=>({...d,reach:e.target.value}))}
                    style={mkInp(C)}
                    placeholder="z.B. 450 Gäste, 12.000 Social Impressions, 3 Artikel"
                  />
                </div>
                {/* Photo Upload */}
                <div style={{marginBottom:"1rem"}}>
                  <div style={{fontSize:"0.72rem",fontWeight:700,color:C.textMid,letterSpacing:"0.06em",marginBottom:"0.5rem"}}>FOTOS VON WERBEFLÄCHEN DER VERANSTALTUNG</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(90px, 1fr))",gap:"0.4rem"}}>
                    {(doc.photos||[]).map((url,i)=>(
                      <div key={i} style={{position:"relative",borderRadius:8,overflow:"hidden",aspectRatio:"1",background:C.bg}}>
                        <img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                        <button type="button" onClick={()=>setDoc(d=>({...d,photos:(d.photos||[]).filter((_,j)=>j!==i)}))}
                          style={{position:"absolute",top:3,right:3,background:"rgba(0,0,0,0.55)",color:"#fff",border:"none",borderRadius:"50%",width:20,height:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,fontSize:"0.75rem",padding:0}}>×</button>
                      </div>
                    ))}
                    <button type="button" onClick={()=>agreementPhotoInputRef.current?.click()}
                      style={{borderRadius:8,border:`1.5px dashed ${C.border}`,background:C.bg,aspectRatio:"1",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"0.25rem",color:C.textMid,fontSize:"0.68rem",fontWeight:600}}>
                      <Plus size={14} strokeWidth={1.5}/>Foto
                    </button>
                  </div>
                  <input ref={agreementPhotoInputRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={async e=>{
                    const files = Array.from(e.target.files||[]);
                    if(!files.length) return;
                    notify("Fotos werden hochgeladen…");
                    try {
                      const urls = await Promise.all(files.map(f=>uploadAgreementPhoto(user.id, proj.id, editSponsor.id, f)));
                      setDoc(d=>({...d,photos:[...(d.photos||[]),...urls]}));
                      notify(`${urls.length} Foto${urls.length!==1?"s":""} gespeichert`);
                    } catch(err) { console.error(err); notify("Fehler beim Hochladen"); }
                    e.target.value="";
                  }}/>
                </div>

                {doc.sentToSponsor && (
                  <div style={{display:"flex",alignItems:"center",gap:"0.5rem",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:9,padding:"0.6rem 0.8rem",marginBottom:"0.75rem",fontSize:"0.82rem",color:"#2563eb",fontWeight:600}}>
                    <Mail size={13} strokeWidth={1.5}/>
                    Gesendet am {doc.sentDate ? new Date(doc.sentDate+"T12:00:00").toLocaleDateString("de-AT",{day:"2-digit",month:"2-digit",year:"numeric"}) : "—"}
                  </div>
                )}
                <button
                  onClick={sendPostEventEmail}
                  disabled={!editSponsor.email}
                  style={{width:"100%",background:editSponsor.email?C.surface:"#f1f0ee",color:editSponsor.email?C.accent:C.textLight,border:`1.5px solid ${editSponsor.email?C.accentBorder:C.border}`,borderRadius:10,padding:"0.8rem",fontSize:"0.85rem",fontWeight:700,cursor:editSponsor.email?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem"}}
                >
                  <Mail size={14} strokeWidth={1.5}/>Per E-Mail an Sponsor senden
                </button>
                {!editSponsor.email && <div style={{fontSize:"0.72rem",color:C.textLight,marginTop:"0.35rem",textAlign:"center"}}>Keine E-Mail-Adresse hinterlegt</div>}
              </div>

              {/* SPONSOR-LINK */}
              {(() => {
                const pkg = proj.packages.find(pk=>pk.name===editSponsor.package);
                const linkData = {
                  en: proj.name, ei: proj.id, si: editSponsor.id,
                  sn: editSponsor.company, sc: editSponsor.contact||"",
                  pk: editSponsor.package||"", be: (pkg?.benefits||[]),
                  oe: user.email||"", on: user.name||"", uid: user.id
                };
                const encoded = typeof window !== "undefined" ? btoa(unescape(encodeURIComponent(JSON.stringify(linkData)))) : "";
                const link = `${typeof window!=="undefined"?window.location.origin:""}/sponsor?d=${encoded}`;
                return (
                  <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,padding:"1rem 1.1rem",marginBottom:"1.25rem",display:"flex",alignItems:"center",gap:"0.75rem",flexWrap:"wrap"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"0.4rem",flexShrink:0}}>
                      <Globe size={14} strokeWidth={1.5} color={C.accent}/>
                      <span style={{fontSize:"0.82rem",fontWeight:700,color:C.text}}>Sponsor-Upload-Link</span>
                    </div>
                    <div style={{flex:1,fontSize:"0.75rem",color:C.textMid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>/sponsor?d=…</div>
                    <button type="button" onClick={()=>{ navigator.clipboard.writeText(link); notify("Link kopiert!"); }}
                      style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"0.35rem 0.75rem",fontSize:"0.78rem",fontWeight:700,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",gap:"0.3rem"}}>
                      <Copy size={11} strokeWidth={2}/>Kopieren
                    </button>
                    <a href={link} target="_blank" rel="noopener noreferrer"
                      style={{background:C.surface,color:C.accent,border:`1px solid ${C.accentBorder}`,borderRadius:8,padding:"0.35rem 0.75rem",fontSize:"0.78rem",fontWeight:700,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",gap:"0.3rem",textDecoration:"none"}}>
                      <Eye size={11} strokeWidth={2}/>Vorschau
                    </a>
                  </div>
                );
              })()}

              {/* ABSCHNITT C — SPONSOR-MATERIALIEN */}
              {(() => {
                const mat = editSponsor.sponsorMaterials || { logoUrls:[], videoUrls:[], fileUrls:[] };
                const setMat = fn => setEditSponsor(s=>({...s, sponsorMaterials: fn(s.sponsorMaterials||{logoUrls:[],videoUrls:[],fileUrls:[]})}));
                const upload = async (files, type, urlKey) => {
                  if(!files.length) return;
                  notify("Wird hochgeladen…");
                  try {
                    const urls = await Promise.all(files.map(f=>uploadSponsorMaterial(user.id, proj.id, editSponsor.id, f, type)));
                    setMat(m=>({...m, [urlKey]:[...(m[urlKey]||[]),...urls]}));
                    notify(`${urls.length} Datei${urls.length!==1?"en":""} gespeichert`);
                  } catch(e) { console.error(e); notify("Fehler beim Hochladen"); }
                };
                const sendNotification = async () => {
                  try {
                    const logoCount = (mat.logoUrls||[]).length;
                    const videoCount = (mat.videoUrls||[]).length;
                    const fileCount = (mat.fileUrls||[]).length;
                    await fetch('/api/email/send', { method:'POST', headers:{'Content-Type':'application/json'},
                      body: JSON.stringify({
                        to: user.email,
                        subject: `Sponsor-Material vollständig: ${editSponsor.company} — ${proj.name}`,
                        html: `<div style="font-family:sans-serif;max-width:540px;margin:0 auto"><h2 style="color:#07929B">Sponsor-Material eingegangen</h2><p>Sponsor <strong>${editSponsor.company}</strong> hat Materialien für <strong>${proj.name}</strong> bereitgestellt:</p><ul>${logoCount?`<li>${logoCount} Logo${logoCount!==1?"s":""}</li>`:""}${videoCount?`<li>${videoCount} Video${videoCount!==1?"s":""}</li>`:""}${fileCount?`<li>${fileCount} weitere Datei${fileCount!==1?"en":""}</li>`:""}</ul><p style="color:#6b6560;font-size:0.9rem">Öffne SponsorMatch um die Materialien zu prüfen.</p></div>`
                      })
                    });
                    setMat(m=>({...m, notified:true, notifiedDate:new Date().toISOString().split('T')[0]}));
                    notify("Benachrichtigung gesendet");
                  } catch(e) { notify("Fehler beim Senden"); }
                };
                return (
                  <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,padding:"1.1rem",marginBottom:"1.25rem"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.85rem"}}>
                      <Upload size={14} strokeWidth={1.5} color={C.accent}/>
                      <div style={{fontSize:"0.88rem",fontWeight:800,color:C.text}}>Sponsor-Materialien</div>
                    </div>
                    {/* Logo */}
                    <div style={{marginBottom:"0.85rem"}}>
                      <div style={{fontSize:"0.72rem",fontWeight:700,color:C.textMid,letterSpacing:"0.06em",marginBottom:"0.45rem"}}>LOGO</div>
                      <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",alignItems:"center"}}>
                        {(mat.logoUrls||[]).map((url,i)=>(
                          <div key={i} style={{position:"relative",width:54,height:54,borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}`,background:C.surface}}>
                            <img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
                            <button type="button" onClick={()=>setMat(m=>({...m,logoUrls:(m.logoUrls||[]).filter((_,j)=>j!==i)}))}
                              style={{position:"absolute",top:2,right:2,background:"rgba(0,0,0,0.5)",color:"#fff",border:"none",borderRadius:"50%",width:16,height:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.65rem",padding:0}}>×</button>
                          </div>
                        ))}
                        <button type="button" onClick={()=>matLogoInputRef.current?.click()}
                          style={{width:54,height:54,borderRadius:8,border:`1.5px dashed ${C.border}`,background:C.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:2,color:C.textMid,fontSize:"0.62rem",fontWeight:600}}>
                          <Plus size={13} strokeWidth={1.5}/>Logo
                        </button>
                        <input ref={matLogoInputRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>{upload(Array.from(e.target.files||[]),'logo','logoUrls'); e.target.value="";}}/>
                      </div>
                    </div>
                    {/* Videos */}
                    <div style={{marginBottom:"0.85rem"}}>
                      <div style={{fontSize:"0.72rem",fontWeight:700,color:C.textMid,letterSpacing:"0.06em",marginBottom:"0.45rem"}}>VIDEOS</div>
                      {(mat.videoUrls||[]).map((url,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:"0.5rem",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"0.4rem 0.65rem",marginBottom:"0.3rem"}}>
                          <span style={{fontSize:"0.78rem",color:C.accent,flex:1}}>Video {i+1}</span>
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{fontSize:"0.72rem",color:C.textMid,textDecoration:"none",fontWeight:600}}>↗ Öffnen</a>
                          <button type="button" onClick={()=>setMat(m=>({...m,videoUrls:(m.videoUrls||[]).filter((_,j)=>j!==i)}))}
                            style={{background:"none",border:"none",cursor:"pointer",color:C.textLight,padding:0,display:"flex"}}><Trash2 size={12} strokeWidth={1.5}/></button>
                        </div>
                      ))}
                      <button type="button" onClick={()=>matVideoInputRef.current?.click()}
                        style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem",background:C.bg,border:`1.5px dashed ${C.border}`,borderRadius:8,padding:"0.5rem",cursor:"pointer",color:C.textMid,fontSize:"0.82rem",fontWeight:600,width:"100%"}}>
                        <Plus size={13} strokeWidth={1.5}/>Video hochladen
                      </button>
                      <input ref={matVideoInputRef} type="file" accept="video/*" multiple style={{display:"none"}} onChange={e=>{upload(Array.from(e.target.files||[]),'video','videoUrls'); e.target.value="";}}/>
                    </div>
                    {/* Weitere Dateien */}
                    <div style={{marginBottom:"0.85rem"}}>
                      <div style={{fontSize:"0.72rem",fontWeight:700,color:C.textMid,letterSpacing:"0.06em",marginBottom:"0.45rem"}}>WEITERE DATEIEN (PDF, ZIP…)</div>
                      {(mat.fileUrls||[]).map((url,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:"0.5rem",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"0.4rem 0.65rem",marginBottom:"0.3rem"}}>
                          <span style={{fontSize:"0.78rem",color:C.text,flex:1}}>Datei {i+1}</span>
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{fontSize:"0.72rem",color:C.textMid,textDecoration:"none",fontWeight:600}}>↗ Öffnen</a>
                          <button type="button" onClick={()=>setMat(m=>({...m,fileUrls:(m.fileUrls||[]).filter((_,j)=>j!==i)}))}
                            style={{background:"none",border:"none",cursor:"pointer",color:C.textLight,padding:0,display:"flex"}}><Trash2 size={12} strokeWidth={1.5}/></button>
                        </div>
                      ))}
                      <button type="button" onClick={()=>matFileInputRef.current?.click()}
                        style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem",background:C.bg,border:`1.5px dashed ${C.border}`,borderRadius:8,padding:"0.5rem",cursor:"pointer",color:C.textMid,fontSize:"0.82rem",fontWeight:600,width:"100%"}}>
                        <Plus size={13} strokeWidth={1.5}/>Datei hochladen
                      </button>
                      <input ref={matFileInputRef} type="file" multiple style={{display:"none"}} onChange={e=>{upload(Array.from(e.target.files||[]),'file','fileUrls'); e.target.value="";}}/>
                    </div>
                    {/* Benachrichtigung */}
                    {mat.notified
                      ? <div style={{display:"flex",alignItems:"center",gap:"0.5rem",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:9,padding:"0.65rem 0.9rem",fontSize:"0.83rem",color:"#16a34a",fontWeight:600}}>
                          <Check size={14} strokeWidth={2}/>Benachrichtigung gesendet am {mat.notifiedDate||"—"}
                        </div>
                      : <button type="button" onClick={sendNotification}
                          style={{width:"100%",background:C.surface,color:C.accent,border:`1.5px solid ${C.accentBorder}`,borderRadius:10,padding:"0.8rem",fontSize:"0.85rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem"}}>
                          <Mail size={14} strokeWidth={1.5}/>Benachrichtigung an mich senden
                        </button>
                    }
                  </div>
                );
              })()}

              <button onClick={saveEditSponsor} style={{width:"100%",background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontWeight:700,cursor:"pointer"}}>Speichern & Schließen</button>
            </>
          );
        })()}
      </Sheet>}

      {/* ADD SPONSOR */}
      {showAdd && <Sheet onClose={()=>{ setShowAdd(false); setNewSponsor({company:"",contact:"",email:"",phone:"",package:proj.packages[0]?.name||"",notes:"",contactId:null}); setSponsorContactSearch(""); setAddSponsorMode("contacts"); }} C={C}>
        <div style={{fontSize:"1.1rem",fontWeight:800,marginBottom:"1rem"}}>Neuen Sponsor hinzufügen</div>

        {/* ── MODE TOGGLE (nur wenn Kontakte vorhanden) ── */}
        {contacts.length > 0 && (
          <div style={{display:"flex",background:C.bg,borderRadius:10,padding:"0.25rem",marginBottom:"1.25rem",border:`1.5px solid ${C.border}`}}>
            <button
              onClick={()=>{ setAddSponsorMode("contacts"); setNewSponsor(p=>({...p,company:"",contact:"",email:"",phone:"",contactId:null})); setSponsorContactSearch(""); }}
              style={{flex:1,padding:"0.55rem 0.5rem",borderRadius:8,border:"none",fontSize:"0.82rem",fontWeight:700,cursor:"pointer",transition:"background 0.15s, color 0.15s",
                background:addSponsorMode==="contacts"?C.accent:"transparent",
                color:addSponsorMode==="contacts"?"#fff":C.textMid}}>
              <BookUser size={13} strokeWidth={1.5} style={{verticalAlign:"middle",marginRight:"0.3rem"}}/>Aus Kontakten wählen
            </button>
            <button
              onClick={()=>{ setAddSponsorMode("manual"); setNewSponsor(p=>({...p,contactId:null})); }}
              style={{flex:1,padding:"0.55rem 0.5rem",borderRadius:8,border:"none",fontSize:"0.82rem",fontWeight:700,cursor:"pointer",transition:"background 0.15s, color 0.15s",
                background:addSponsorMode==="manual"?C.accent:"transparent",
                color:addSponsorMode==="manual"?"#fff":C.textMid}}>
              <Plus size={13} strokeWidth={1.5} style={{verticalAlign:"middle",marginRight:"0.3rem"}}/>Neuen Kontakt eingeben
            </button>
          </div>
        )}

        {/* ── KONTAKTLISTE ── */}
        {addSponsorMode==="contacts" && contacts.length > 0 && (() => {
          const alreadyInPipeline = new Set(proj.pipeline.map(s=>s.contactId).filter(Boolean));
          const filtered = contacts.filter(c => {
            const q = sponsorContactSearch.toLowerCase();
            if (!q) return true;
            return (c.company||"").toLowerCase().includes(q) || (c.contactName||"").toLowerCase().includes(q) || (c.email||"").toLowerCase().includes(q);
          });
          return (
            <div style={{marginBottom:"1.25rem"}}>
              {/* Suchfeld */}
              <div style={{position:"relative",marginBottom:"0.65rem"}}>
                <Search size={14} strokeWidth={1.5} color={C.textLight} style={{position:"absolute",left:"0.85rem",top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
                <input
                  type="text"
                  placeholder="Firma oder Name suchen…"
                  value={sponsorContactSearch}
                  onChange={e=>setSponsorContactSearch(e.target.value)}
                  style={{...mkInp(C),paddingLeft:"2.4rem"}}
                  autoFocus
                />
              </div>
              {/* Kontakt-Liste */}
              <div style={{maxHeight:260,overflowY:"auto",borderRadius:12,border:`1.5px solid ${C.border}`,background:C.surface}}>
                {filtered.length === 0
                  ? <div style={{padding:"1.25rem",textAlign:"center",color:C.textLight,fontSize:"0.85rem"}}>Kein Kontakt gefunden</div>
                  : filtered.map((c,i) => {
                      const isSelected = newSponsor.contactId === c.id;
                      const inPipeline = alreadyInPipeline.has(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={()=>{
                            if (inPipeline) return;
                            setNewSponsor(p=>({...p,company:c.company||"",contact:c.contactName||"",email:c.email||"",phone:c.phone||"",contactId:c.id}));
                          }}
                          style={{
                            display:"flex",alignItems:"center",justifyContent:"space-between",
                            padding:"0.8rem 1rem",
                            borderTop: i>0 ? `1px solid ${C.border}` : "none",
                            cursor: inPipeline ? "default" : "pointer",
                            background: isSelected ? C.accentSoft : "transparent",
                            opacity: inPipeline ? 0.55 : 1,
                            transition:"background 0.12s",
                          }}
                          onMouseEnter={e=>{ if(!isSelected && !inPipeline) e.currentTarget.style.background=C.bg; }}
                          onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.background=isSelected?C.accentSoft:"transparent"; }}
                        >
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:700,fontSize:"0.9rem",color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.company||"–"}</div>
                            <div style={{fontSize:"0.75rem",color:C.textMid,marginTop:"0.1rem",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                              {[c.contactName, c.email].filter(Boolean).join(" · ")}
                            </div>
                            {inPipeline && <div style={{fontSize:"0.68rem",color:C.textLight,fontWeight:600,marginTop:"0.15rem"}}>Bereits in Pipeline</div>}
                          </div>
                          {isSelected && <Check size={16} strokeWidth={2.5} color={C.accent} style={{flexShrink:0,marginLeft:"0.6rem"}}/>}
                        </div>
                      );
                    })
                }
              </div>
              {newSponsor.contactId && (
                <div style={{fontSize:"0.75rem",color:C.accent,fontWeight:600,marginTop:"0.5rem",display:"flex",alignItems:"center",gap:"0.35rem"}}>
                  <Check size={12} strokeWidth={2.5}/>{newSponsor.company} ausgewählt — ergänze Paket &amp; Notiz
                </div>
              )}
            </div>
          );
        })()}

        {/* ── MANUELLES FORMULAR (oder Felder nach Kontakt-Auswahl) ── */}
        {addSponsorMode==="manual" && <>
          <div style={{marginBottom:"0.9rem"}}><Label C={C}>UNTERNEHMEN</Label><input type="text" placeholder="z.B. Erste Bank AG" value={newSponsor.company} onChange={e=>setNewSponsor(p=>({...p,company:e.target.value}))} style={mkInp(C)}/></div>
          <div style={{marginBottom:"0.9rem"}}><Label C={C}>ANSPRECHPARTNER</Label><input type="text" placeholder="z.B. Maria Huber" value={newSponsor.contact} onChange={e=>setNewSponsor(p=>({...p,contact:e.target.value}))} style={mkInp(C)}/></div>
          <div style={{marginBottom:"0.9rem"}}><Label C={C}>E-MAIL</Label><input type="email" placeholder="maria@firma.at" value={newSponsor.email} onChange={e=>setNewSponsor(p=>({...p,email:e.target.value}))} style={mkInp(C)}/></div>
        </>}

        {/* ── PAKET & NOTIZ (immer sichtbar) ── */}
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>PAKET</Label>
          <select value={newSponsor.package} onChange={e=>setNewSponsor(p=>({...p,package:e.target.value}))} style={mkInp(C)}>
            {proj.packages.map(p=><option key={p.id} value={p.name}>{p.name} — €{p.price.toLocaleString("de-DE")}</option>)}
          </select>
        </div>
        <div style={{marginBottom:"1.25rem"}}><Label C={C}>NOTIZ</Label><textarea rows={2} value={newSponsor.notes} onChange={e=>setNewSponsor(p=>({...p,notes:e.target.value}))} style={{...mkInp(C),resize:"none"}} placeholder="z.B. Sehr interessiert, follow-up nächste Woche"/></div>

        <div style={{display:"flex",gap:"0.65rem"}}>
          <button onClick={addSponsor} disabled={!newSponsor.company} style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontWeight:700,cursor:"pointer",opacity:newSponsor.company?1:0.5}}>Hinzufügen</button>
          <button onClick={()=>{ setShowAdd(false); setNewSponsor({company:"",contact:"",email:"",phone:"",package:proj.packages[0]?.name||"",notes:"",contactId:null}); setSponsorContactSearch(""); setAddSponsorMode("contacts"); }} style={{flex:1,background:C.bg,color:C.textMid,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"0.9rem",cursor:"pointer"}}>Abbrechen</button>
        </div>
      </Sheet>}

      {/* ADD CONTACT */}
      {showAddContact && <Sheet onClose={()=>setShowAddContact(false)} C={C}>
        <div style={{fontSize:"1.1rem",fontWeight:800,marginBottom:"1.25rem"}}>Neuen Kontakt anlegen</div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>UNTERNEHMEN *</Label><input type="text" placeholder="z.B. Erste Bank AG" value={newContact.company} onChange={e=>setNewContact(p=>({...p,company:e.target.value}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>ANSPRECHPARTNER</Label><input type="text" placeholder="z.B. Maria Huber" value={newContact.contactName} onChange={e=>setNewContact(p=>({...p,contactName:e.target.value}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>E-MAIL</Label><input type="email" placeholder="maria@firma.at" value={newContact.email} onChange={e=>setNewContact(p=>({...p,email:e.target.value}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>TELEFON</Label><input type="tel" placeholder="+43 1 234 5678" value={newContact.phone} onChange={e=>setNewContact(p=>({...p,phone:e.target.value}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"1.25rem"}}><Label C={C}>NOTIZEN</Label><textarea rows={3} value={newContact.notes} onChange={e=>setNewContact(p=>({...p,notes:e.target.value}))} style={{...mkInp(C),resize:"none"}} placeholder="Interne Notizen zu diesem Kontakt..."/></div>
        <div style={{display:"flex",gap:"0.65rem"}}>
          <button onClick={addContact} disabled={!newContact.company} style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontWeight:700,cursor:"pointer",opacity:newContact.company?1:0.5}}>Anlegen</button>
          <button onClick={()=>setShowAddContact(false)} style={{flex:1,background:C.bg,color:C.textMid,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"0.9rem",cursor:"pointer"}}>Abbrechen</button>
        </div>
      </Sheet>}

      {/* EDIT CONTACT */}
      {editContact && !confirmDeleteContact && <Sheet onClose={()=>setEditContact(null)} C={C}>
        <div style={{fontSize:"1.1rem",fontWeight:800,marginBottom:"1.25rem"}}>Kontakt bearbeiten</div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>UNTERNEHMEN</Label><input type="text" value={editContact.company} onChange={e=>setEditContact(p=>({...p,company:e.target.value}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>ANSPRECHPARTNER</Label><input type="text" value={editContact.contactName||""} onChange={e=>setEditContact(p=>({...p,contactName:e.target.value}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"0.9rem"}}>
          <Label C={C}>E-MAIL</Label>
          <input type="email" value={editContact.email||""} readOnly style={{...mkInp(C),background:C.bg,color:C.textMid,cursor:"default"}}/>
          <div style={{fontSize:"0.72rem",color:C.textLight,marginTop:"0.3rem"}}>E-Mail ist der eindeutige Schlüssel und kann nicht geändert werden.</div>
        </div>
        <div style={{marginBottom:"0.9rem"}}><Label C={C}>TELEFON</Label><input type="tel" value={editContact.phone||""} onChange={e=>setEditContact(p=>({...p,phone:e.target.value}))} style={mkInp(C)}/></div>
        <div style={{marginBottom:"1.25rem"}}><Label C={C}>NOTIZEN</Label><textarea rows={3} value={editContact.notes||""} onChange={e=>setEditContact(p=>({...p,notes:e.target.value}))} style={{...mkInp(C),resize:"none"}}/></div>
        {(editContact.eventHistory||[]).length > 0 && (
          <div style={{marginBottom:"1.25rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.6rem"}}>
              <History size={13} strokeWidth={1.5} color={C.textMid}/>
              <Label C={C}>EVENT-HISTORIE</Label>
            </div>
            {(editContact.eventHistory||[]).map((h,i)=>{
              const cfg = STATUS_CONFIG[h.status]||STATUS_CONFIG.draft;
              return (
                <div key={h.eventName||i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"0.65rem 0.9rem",marginBottom:"0.45rem"}}>
                  <div>
                    <div style={{fontSize:"0.9rem",fontWeight:600}}>{h.eventName}</div>
                    <div style={{fontSize:"0.75rem",color:C.textMid}}>{h.package}{h.year?` · ${h.year}`:""}</div>
                  </div>
                  <span style={{fontSize:"0.65rem",fontWeight:700,padding:"0.2rem 0.55rem",borderRadius:99,background:cfg.bg,color:cfg.color,whiteSpace:"nowrap"}}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        )}
        {(() => {
          if (!hasFeature(user?.tier||'free','learning-db')) return (
            <div onClick={()=>setShowUpgrade({feature:'learning-db',label:'Lernende Pipeline-Datenbank',requiredTier:'max'})}
              style={{background:C.bg,border:`1.5px dashed ${C.accentBorder}`,borderRadius:12,padding:"0.85rem",marginBottom:"1.25rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                <Zap size={14} strokeWidth={1.5} color={C.accent}/>
                <div>
                  <div style={{fontSize:"0.82rem",fontWeight:700,color:C.text}}>Sponsoring-Profil</div>
                  <div style={{fontSize:"0.72rem",color:C.textLight}}>Lernende Datenbank — Max-Feature</div>
                </div>
              </div>
              <span style={{fontSize:"0.7rem",fontWeight:700,color:C.accent,background:C.accentSoft,padding:"0.2rem 0.55rem",borderRadius:99,border:`1px solid ${C.accentBorder}`}}>Upgrade</span>
            </div>
          );
          const prefs = getContactPreferences(editContact);
          if (!prefs) return null;
          return (
            <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"1rem",marginBottom:"1.25rem"}}>
              <div style={{fontSize:"0.7rem",fontWeight:700,color:C.textMid,letterSpacing:"0.07em",marginBottom:"0.75rem"}}>SPONSORING-PROFIL</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.65rem"}}>
                <div style={{background:C.surface,borderRadius:10,padding:"0.75rem",textAlign:"center",border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:"1.4rem",fontWeight:800,color:prefs.conversionRate>=50?C.green:prefs.conversionRate>0?C.amber:"#dc2626"}}>{prefs.conversionRate}%</div>
                  <div style={{fontSize:"0.7rem",color:C.textLight,marginTop:"0.2rem"}}>Zusagerate</div>
                </div>
                <div style={{background:C.surface,borderRadius:10,padding:"0.75rem",textAlign:"center",border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:"1.4rem",fontWeight:800,color:C.text}}>{prefs.confirmedCount}<span style={{fontSize:"0.85rem",color:C.textLight}}>/{prefs.totalCount}</span></div>
                  <div style={{fontSize:"0.7rem",color:C.textLight,marginTop:"0.2rem"}}>Bestätigte Events</div>
                </div>
              </div>
              {(prefs.topGenre || prefs.topPackage) && (
                <div style={{marginTop:"0.65rem",display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
                  {prefs.topGenre && <div style={{flex:1,background:C.surface,borderRadius:10,padding:"0.65rem 0.9rem",border:`1px solid ${C.border}`}}>
                    <div style={{fontSize:"0.68rem",color:C.textLight,marginBottom:"0.2rem"}}>Bevorzugte Kategorie</div>
                    <div style={{fontSize:"0.9rem",fontWeight:700,color:"#2563eb"}}>{prefs.topGenre}</div>
                  </div>}
                  {prefs.topPackage && <div style={{flex:1,background:C.surface,borderRadius:10,padding:"0.65rem 0.9rem",border:`1px solid ${C.border}`}}>
                    <div style={{fontSize:"0.68rem",color:C.textLight,marginBottom:"0.2rem"}}>Bevorzugtes Paket</div>
                    <div style={{fontSize:"0.9rem",fontWeight:700,color:C.accent}}>{prefs.topPackage}</div>
                  </div>}
                </div>
              )}
            </div>
          );
        })()}
        <button
          onClick={()=>setConfirmDeleteContact(editContact)}
          style={{width:"100%",marginBottom:"0.65rem",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:12,padding:"0.75rem",fontSize:"0.95rem",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"}}
        ><Trash2 size={14} strokeWidth={1.5}/>Kontakt löschen</button>
        <div style={{display:"flex",gap:"0.65rem"}}>
          <button onClick={saveEditContact} style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontWeight:700,cursor:"pointer"}}>Speichern</button>
          <button onClick={()=>setEditContact(null)} style={{flex:1,background:C.bg,color:C.textMid,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"0.9rem",cursor:"pointer"}}>Abbrechen</button>
        </div>
      </Sheet>}

      {/* CONFIRM DELETE CONTACT */}
      {confirmDeleteContact && <Sheet onClose={()=>{setConfirmDeleteContact(null);setEditContact(confirmDeleteContact);}} C={C}>
        <div style={{fontSize:"1.1rem",fontWeight:800,marginBottom:"0.5rem"}}>Kontakt löschen?</div>
        <div style={{fontSize:"0.95rem",color:C.textMid,marginBottom:"0.75rem",lineHeight:1.6}}>
          <strong>{confirmDeleteContact.company}</strong> wird dauerhaft aus der Kontaktdatenbank entfernt. Event-Pipeline-Einträge bleiben erhalten.
        </div>
        <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"0.75rem",marginBottom:"1.5rem",fontSize:"0.88rem",color:"#dc2626",lineHeight:1.6}}>
          Diese Aktion kann nicht rückgängig gemacht werden.
        </div>
        <div style={{display:"flex",gap:"0.65rem"}}>
          <button onClick={()=>deleteContact(confirmDeleteContact)} style={{flex:1,background:"#dc2626",color:"#fff",border:"none",borderRadius:12,padding:"0.9rem",fontWeight:700,cursor:"pointer"}}>Endgültig löschen</button>
          <button onClick={()=>{setConfirmDeleteContact(null);setEditContact(confirmDeleteContact);}} style={{flex:1,background:C.bg,color:C.textMid,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"0.9rem",cursor:"pointer"}}>Abbrechen</button>
        </div>
      </Sheet>}

      {/* TOP BAR */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0.9rem 1.25rem",position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 6px rgba(0,0,0,0.05)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"0.5rem"}}>
          {/* Veranstalter-Branding — klickbar öffnet Branding-Einstellungen */}
          <button onClick={()=>{setShowBranding(true);loadTeam();}} style={{display:"flex",alignItems:"center",gap:"0.65rem",background:"none",border:"none",cursor:"pointer",padding:"0.2rem 0.4rem",borderRadius:10,transition:"background 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.background=C.bg} onMouseLeave={e=>e.currentTarget.style.background="none"}>
            {user.logo
              ? <img src={user.logo} alt="" style={{width:36,height:36,objectFit:"contain",borderRadius:8,border:`1px solid ${C.border}`}}/>
              : <div style={{width:36,height:36,background:C.accent,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{color:"#fff",fontWeight:800,fontSize:"0.85rem",letterSpacing:"-0.02em"}}>
                    {(user.name||"S").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase()||<Zap size={16} strokeWidth={1.5} color="#fff"/>}
                  </span>
                </div>
            }
            <div style={{textAlign:"left"}}>
              <div style={{fontSize:"0.95rem",fontWeight:800,letterSpacing:"-0.02em",color:C.text,lineHeight:1.2}}>{user.name||"SponsorMatch"}</div>
              <div style={{fontSize:"0.68rem",color:C.textLight,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120}}>Branding bearbeiten</div>
            </div>
          </button>
          <span
            onClick={()=>{if((user?.tier||'free')==='free')setShowUpgrade({feature:'upgrade',label:'Mehr Events, KI-Finder & Templates',requiredTier:'pro'});}}
            style={{fontSize:"0.65rem",fontWeight:800,padding:"0.2rem 0.6rem",borderRadius:99,
              ...((user?.tier||'free')==='free'
                ? {background:"#f1f0ee",color:"#a09b94",border:"1px solid #e8e4dd",cursor:"pointer"}
                : {background:C.accentSoft,color:C.accent,border:`1px solid ${C.accentBorder}`,cursor:"default"}
              ),
              letterSpacing:"0.06em",flexShrink:0
            }}>
            {(user?.tier||'free')==='free' ? 'FREE ↑' : (user?.tier||'free').toUpperCase()}
          </span>
          <button onClick={()=>setShowProjects(true)} style={{display:"flex",alignItems:"center",gap:"0.4rem",background:C.bg,border:`1px solid ${C.border}`,borderRadius:99,padding:"0.4rem 1rem",cursor:"pointer",flexGrow:1,maxWidth:"calc(100% - 120px)",transition:"border-color 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
            <span style={{fontSize:"0.82rem",fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{proj.name}</span>
            <span style={{fontSize:"0.75rem",color:C.textLight,flexShrink:0}}>▾</span>
          </button>
        </div>
      </div>

      <div style={{padding:"1rem"}}>

        {/* DASHBOARD */}
        {page==="dashboard" && <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.75rem"}}>
            <div>
              <div style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:C.textLight,marginBottom:"0.35rem"}}>MEIN EVENT</div>
              <h1 style={{fontSize:"clamp(1.3rem, 5vw, 1.65rem)",fontWeight:800,letterSpacing:"-0.03em",margin:"0 0 0.3rem",fontFamily:"Georgia,serif"}}>{proj.name}</h1>
              <div style={{fontSize:"0.92rem",color:C.textMid}}>{proj.date} · {proj.location}</div>
            </div>
            <div style={{display:"flex",gap:"0.5rem",alignItems:"center",flexShrink:0}}>
              <button onClick={()=>{setEditProjData({...proj});setShowEditProj(true);}}
                style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"0.5rem 0.9rem",fontSize:"0.88rem",fontWeight:600,cursor:"pointer",color:C.textMid,display:"flex",alignItems:"center",gap:"0.4rem",transition:"border-color 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                <Pencil size={13} strokeWidth={1.5}/>Bearbeiten
              </button>
              <button onClick={async()=>{await supabase.auth.signOut();router.push('/');}}
                title="Ausloggen"
                style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"0.5rem 0.65rem",cursor:"pointer",color:C.textLight,display:"flex",alignItems:"center",transition:"border-color 0.15s,color 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#ef4444";e.currentTarget.style.color="#ef4444";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textLight;}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          </div>
          {/* Stat-Karten */}
          {(() => {
            const confirmedSponsors = proj.pipeline.filter(s => s.status === "confirmed");
            const activeSponsors = proj.pipeline.filter(s => ["sent","negotiating"].includes(s.status));
            const conversionPct = proj.pipeline.length ? Math.round(confirmedSponsors.length / proj.pipeline.length * 100) : null;

            const stats = [
              { key:"confirmed",  label:"Bestätigt",    value:`€${confirmed.toLocaleString("de-DE")}`, sub:"gesichert",       color:C.green,  sponsors: confirmedSponsors },
              { key:"pipeline",   label:"Pipeline",     value:`€${pTotal.toLocaleString("de-DE")}`,    sub:"Potenzial",       color:C.blue,   sponsors: proj.pipeline },
              { key:"active",     label:"Aktive Leads", value:activeSponsors.length,                   sub:"in Verhandlung",  color:C.accent, sponsors: activeSponsors },
              { key:"conversion", label:"Conversion",   value:conversionPct !== null ? `${conversionPct}%` : "—", sub:"Abschlussquote", color:C.amber, sponsors: confirmedSponsors },
            ];

            return (
              <>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.65rem",marginBottom:"1.25rem"}}>
                  {stats.map(({key,label,value,sub,color,sponsors})=>{
                    const isActive = dashFilter === key;
                    const hasSponsors = sponsors.length > 0;
                    return (
                      <div key={key}
                        onClick={()=> hasSponsors && setDashFilter(isActive ? null : key)}
                        style={{
                          background: isActive ? color + "12" : C.surface,
                          border: `1.5px solid ${isActive ? color : C.border}`,
                          borderRadius:14, padding:"1.1rem 1.25rem",
                          cursor: hasSponsors ? "pointer" : "default",
                          transition:"border-color 0.15s, background 0.15s",
                          position:"relative",
                        }}
                      >
                        <div style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.08em",color:isActive?color:C.textLight,marginBottom:"0.5rem"}}>{label.toUpperCase()}</div>
                        <div style={{fontSize:"clamp(1.4rem, 5vw, 1.65rem)",fontWeight:800,color,lineHeight:1,marginBottom:"0.3rem",fontFamily:"Georgia,serif"}}>{value}</div>
                        <div style={{fontSize:"0.85rem",color:C.textMid,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <span>{sub}</span>
                          {hasSponsors && <span style={{fontSize:"0.7rem",color:color,fontWeight:600}}>{isActive?"▲ schließen":"▼ zeigen"}</span>}
                        </div>
                        {/* Mini Progress-Bar */}
                        {key === "confirmed" && pTotal > 0 && (
                          <div style={{marginTop:"0.6rem",height:4,borderRadius:99,background:C.border,overflow:"hidden"}}>
                            <div style={{height:"100%",borderRadius:99,background:color,width:`${Math.min(100,Math.round(confirmed/pTotal*100))}%`,transition:"width 0.4s ease"}}/>
                          </div>
                        )}
                        {key === "pipeline" && proj.packages.length > 0 && (
                          <div style={{marginTop:"0.6rem",height:4,borderRadius:99,background:C.border,overflow:"hidden"}}>
                            <div style={{height:"100%",borderRadius:99,background:color,width:`${Math.min(100,Math.round(proj.pipeline.filter(s=>s.status!=="rejected").length/Math.max(1,proj.pipeline.length)*100))}%`,transition:"width 0.4s ease"}}/>
                          </div>
                        )}
                        {key === "active" && proj.pipeline.length > 0 && (
                          <div style={{marginTop:"0.6rem",height:4,borderRadius:99,background:C.border,overflow:"hidden"}}>
                            <div style={{height:"100%",borderRadius:99,background:color,width:`${Math.min(100,Math.round(activeSponsors.length/proj.pipeline.length*100))}%`,transition:"width 0.4s ease"}}/>
                          </div>
                        )}
                        {key === "conversion" && conversionPct !== null && (
                          <div style={{marginTop:"0.6rem",height:4,borderRadius:99,background:C.border,overflow:"hidden"}}>
                            <div style={{height:"100%",borderRadius:99,background:color,width:`${conversionPct}%`,transition:"width 0.4s ease"}}/>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Gefilterte Sponsorenliste unter den Karten */}
                {dashFilter && (() => {
                  const filtered = stats.find(s=>s.key===dashFilter);
                  if (!filtered || filtered.sponsors.length === 0) return null;
                  return (
                    <div style={{background:C.surface,border:`1.5px solid ${filtered.color}44`,borderRadius:14,marginBottom:"1.25rem",overflow:"hidden"}}>
                      <div style={{padding:"0.75rem 1.25rem",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:filtered.color+"0d"}}>
                        <div style={{fontSize:"0.85rem",fontWeight:700,color:filtered.color}}>{filtered.label} — {filtered.sponsors.length} Sponsor{filtered.sponsors.length!==1?"en":""}</div>
                        <button onClick={()=>setDashFilter(null)} style={{background:"none",border:"none",cursor:"pointer",color:C.textLight,fontSize:"1.1rem",lineHeight:1,padding:"0 0.25rem"}}>×</button>
                      </div>
                      {filtered.sponsors.map((s,i)=>(
                        <div key={s.id} onClick={()=>setSelected(s)}
                          style={{display:"flex",alignItems:"center",gap:"1rem",padding:"0.85rem 1.25rem",borderBottom:i<filtered.sponsors.length-1?`1px solid ${C.border}`:"none",cursor:"pointer",transition:"background 0.12s"}}
                          onMouseEnter={e=>e.currentTarget.style.background=C.bg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <div style={{width:36,height:36,borderRadius:9,background:C.bg,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.8rem",fontWeight:800,color:C.textMid,flexShrink:0}}>{s.company.slice(0,2).toUpperCase()}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:"0.95rem",fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.company}</div>
                            <div style={{fontSize:"0.8rem",color:C.textMid}}>{s.package} · {s.contact||"—"}</div>
                          </div>
                          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"0.3rem",flexShrink:0}}>
                            <Badge status={s.status} C={C}/>
                            <div style={{fontSize:"0.75rem",color:C.textLight,fontWeight:600}}>€{s.value.toLocaleString("de-DE")}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Pipeline-Status Balkendiagramm */}
                {proj.pipeline.length > 0 && (() => {
                  const statusGroups = [
                    { key:"confirmed",   label:"Bestätigt",   color:C.green  },
                    { key:"negotiating", label:"Verhandlung", color:C.amber  },
                    { key:"sent",        label:"Gesendet",    color:C.blue   },
                    { key:"draft",       label:"Entwurf",     color:C.textLight },
                    { key:"rejected",    label:"Abgelehnt",   color:"#dc2626" },
                  ].map(s=>({...s, count: proj.pipeline.filter(p=>p.status===s.key).length, value: proj.pipeline.filter(p=>p.status===s.key).reduce((a,p)=>a+p.value,0)}))
                   .filter(s=>s.count > 0);

                  const maxVal = Math.max(...statusGroups.map(s=>s.value), 1);

                  return (
                    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"1.1rem 1.25rem",marginBottom:"1.25rem"}}>
                      <div style={{fontSize:"0.85rem",fontWeight:700,marginBottom:"0.9rem"}}>Statusverteilung</div>
                      <div style={{display:"flex",flexDirection:"column",gap:"0.55rem"}}>
                        {statusGroups.map(s=>(
                          <div key={s.key}>
                            <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.75rem",color:C.textMid,marginBottom:"0.25rem"}}>
                              <span style={{fontWeight:600}}>{s.label} <span style={{color:C.textLight,fontWeight:400}}>({s.count})</span></span>
                              <span style={{fontWeight:700,color:s.color}}>€{s.value.toLocaleString("de-DE")}</span>
                            </div>
                            <div style={{height:8,borderRadius:99,background:C.border,overflow:"hidden"}}>
                              <div style={{height:"100%",borderRadius:99,background:s.color,width:`${Math.round(s.value/maxVal*100)}%`,transition:"width 0.5s ease"}}/>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </>
            );
          })()}
          {proj.pipeline.some(s=>s.status==="sent") && <div style={{background:C.accentSoft,border:`1px solid ${C.accentBorder}`,borderRadius:14,padding:"1.1rem 1.25rem",marginBottom:"1.75rem",display:"flex",gap:"0.85rem"}}>
            <div style={{display:"flex",alignItems:"center",paddingTop:"0.1rem"}}><AlertCircle size={20} strokeWidth={1.5} color={C.accent}/></div>
            <div>
              <div style={{fontSize:"0.9rem",fontWeight:700,color:C.accent,marginBottom:"0.25rem"}}>Jetzt handeln</div>
              <div style={{fontSize:"0.95rem",lineHeight:1.5}}><strong>{proj.pipeline.find(s=>s.status==="sent")?.company}</strong> hat deinen Pitch geöffnet!</div>
              <button onClick={()=>setPage("pipeline")} style={{marginTop:"0.65rem",background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"0.5rem 1.1rem",fontSize:"0.88rem",fontWeight:700,cursor:"pointer"}}>Zur Pipeline →</button>
            </div>
          </div>}
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
            <div style={{padding:"1rem 1.25rem",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:"1rem",fontWeight:700}}>Letzte Aktivität</div>
              <button onClick={()=>setPage("pipeline")} style={{fontSize:"0.88rem",color:C.accent,background:"none",border:"none",cursor:"pointer",fontWeight:700}}>Alle →</button>
            </div>
            {proj.pipeline.length===0
              ? <div style={{padding:"2.5rem",textAlign:"center",color:C.textLight,fontSize:"0.95rem"}}>Noch keine Sponsoren</div>
              : proj.pipeline.slice(0,4).map((s,i)=>(
                <div key={s.id} onClick={()=>setSelected(s)}
                  style={{display:"flex",alignItems:"center",gap:"1rem",padding:"1rem 1.25rem",borderBottom:i<Math.min(3,proj.pipeline.length-1)?`1px solid ${C.border}`:"none",cursor:"pointer",transition:"background 0.12s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.bg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{width:40,height:40,borderRadius:10,background:C.bg,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.85rem",fontWeight:800,color:C.textMid,flexShrink:0}}>{s.company.slice(0,2).toUpperCase()}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"1rem",fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.company}</div>
                    <div style={{fontSize:"0.85rem",color:s.pitchSent?C.accent:C.textMid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.pitchSent?`Geöffnet: ${s.opened}`:s.notes}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"0.35rem",flexShrink:0}}>
                    <Badge status={s.status} C={C}/><div style={{fontSize:"0.78rem",color:C.textLight,fontWeight:600}}>€{s.value.toLocaleString("de-DE")}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>}

        {/* PIPELINE */}
        {page==="pipeline" && <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem"}}>
            <div>
              <h2 style={{fontSize:"1.5rem",fontWeight:800,margin:"0 0 0.3rem",fontFamily:"Georgia,serif"}}>Pipeline</h2>
              <div style={{fontSize:"0.9rem",color:C.textMid}}>{proj.pipeline.length} Kontakte · €{pTotal.toLocaleString("de-DE")}</div>
            </div>
            <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",justifyContent:"flex-end"}}>
              <button onClick={()=>setPage("checkliste")}
                style={{background:C.surface,color:C.accent,border:`1.5px solid ${C.accentBorder}`,borderRadius:10,padding:"0.6rem 1rem",fontSize:"0.88rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:"0.4rem"}}
                onMouseEnter={e=>e.currentTarget.style.background=C.accentSoft} onMouseLeave={e=>e.currentTarget.style.background=C.surface}>
                <CheckCircle size={14} strokeWidth={2}/>Werbepräsenz
              </button>
              <button onClick={()=>{ setAddSponsorMode(contacts.length>0?"contacts":"manual"); setNewSponsor({company:"",contact:"",email:"",phone:"",package:proj.packages[0]?.name||"",notes:"",contactId:null}); setSponsorContactSearch(""); setShowAdd(true); }}
                style={{background:C.accent,color:"#fff",border:"none",borderRadius:10,padding:"0.65rem 1.25rem",fontSize:"0.95rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:"0.4rem",boxShadow:`0 2px 8px ${C.accent}44`,transition:"opacity 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.88"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                <Plus size={15} strokeWidth={2}/>Sponsor hinzufügen
              </button>
            </div>
          </div>
          {/* RECHNUNGSÜBERSICHT */}
          {proj.pipeline.length > 0 && (() => {
            const signedSponsors = proj.pipeline.filter(s => s.agreement?.signed);
            const notExported = signedSponsors.filter(s => !s.agreement?.csvExported);
            const totalValue = proj.pipeline.reduce((sum, s) => sum + (s.value || 0), 0);

            const calcBrutto = (netto) => {
              const mwstKey = user.mwst || "0";
              if(mwstKey==="mwst10") return { steuer: Math.round(netto*0.1*100)/100, brutto: netto + Math.round(netto*0.1*100)/100 };
              if(mwstKey==="mwst20") return { steuer: Math.round(netto*0.2*100)/100, brutto: netto + Math.round(netto*0.2*100)/100 };
              if(mwstKey==="werbung5") return { steuer: Math.round(netto*0.05*100)/100, brutto: netto + Math.round(netto*0.05*100)/100 };
              if(mwstKey==="werbung5_mwst20") { const w=Math.round(netto*0.05*100)/100; const m=Math.round((netto+w)*0.2*100)/100; return { steuer:w+m, brutto:netto+w+m }; }
              return { steuer: 0, brutto: netto };
            };

            const buildCsvRows = (sponsors) => {
              const header = ["Veranstaltung","Sponsor","Ansprechperson","E-Mail","Rechnungsadresse","Paket","Netto (€)","Steuer (€)","Brutto (€)","Leistungen","Unterzeichnet am","Rechnung gesendet","Zahlung erhalten"];
              const dataRows = sponsors.map(s => {
                const agr = s.agreement || {};
                const netto = s.value || 0;
                const { steuer, brutto } = calcBrutto(netto);
                const leistungen = (agr.benefitChecklist||[]).map(b=>b.benefit).join(" | ");
                const adresse = (agr.sponsorAddress||"—").replace(/\n/g, ", ");
                return [proj.name, s.company, s.contact||"—", s.email||"—", adresse, s.package||"—", netto.toString(), steuer.toFixed(2), brutto.toFixed(2), leistungen, agr.signedDate||"—", agr.invoiceSent?"Ja":"Nein", agr.paymentReceived?"Ja":"Nein"];
              });
              return [header, ...dataRows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(";")).join("\n");
            };

            const bulkExport = () => {
              const csv = buildCsvRows(signedSponsors);
              const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href=url; a.download=`Rechnungen_${proj.name.replace(/\s+/g,"_")}.csv`; a.click();
              URL.revokeObjectURL(url);
              updProj(p=>({...p, pipeline: p.pipeline.map(s => s.agreement?.signed ? {...s, agreement:{...s.agreement, csvExported:true}} : s)}));
              notify("CSV exportiert & als exportiert markiert");
            };

            const exportOne = (s) => {
              const csv = buildCsvRows([s]);
              const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href=url; a.download=`Rechnung_${s.company.replace(/\s+/g,"_")}.csv`; a.click();
              URL.revokeObjectURL(url);
              updProj(p=>({...p, pipeline: p.pipeline.map(sp => sp.id===s.id ? {...sp, agreement:{...sp.agreement, csvExported:true}} : sp)}));
              notify(`CSV für ${s.company} exportiert`);
            };

            return (
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,marginBottom:"1.75rem",overflow:"hidden"}}>
                {/* Header */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 1.25rem",gap:"0.75rem",flexWrap:"wrap",borderBottom:`1px solid ${C.border}`,background:C.bg}}>
                  <div style={{display:"flex",alignItems:"center",gap:"0.55rem"}}>
                    <FileText size={16} strokeWidth={1.75} color={C.accent}/>
                    <span style={{fontSize:"1rem",fontWeight:800,color:C.text,letterSpacing:"-0.01em"}}>Rechnungsübersicht</span>
                  </div>
                  <button
                    type="button"
                    onClick={bulkExport}
                    style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"0.45rem 1rem",fontSize:"0.82rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:"0.4rem",boxShadow:`0 2px 8px ${C.accent}33`,transition:"opacity 0.15s",flexShrink:0}}
                    onMouseEnter={e=>e.currentTarget.style.opacity="0.88"}
                    onMouseLeave={e=>e.currentTarget.style.opacity="1"}
                  >
                    <Download size={13} strokeWidth={2.25}/>Alle als CSV
                  </button>
                </div>

                {/* Stat-Leiste */}
                <div style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.7rem 1.25rem",borderBottom:`1px solid ${C.border}`,flexWrap:"wrap",background:C.bg}}>
                  <span style={{fontSize:"0.73rem",fontWeight:700,background:C.accentSoft,color:C.accent,padding:"0.2rem 0.65rem",borderRadius:99,border:`1px solid ${C.accentBorder}`}}>
                    {proj.pipeline.length} Sponsoren
                  </span>
                  <span style={{fontSize:"0.73rem",color:C.textLight,fontWeight:500}}>·</span>
                  <span style={{fontSize:"0.73rem",fontWeight:700,background:"#f0fdf4",color:"#16a34a",padding:"0.2rem 0.65rem",borderRadius:99,border:"1px solid #bbf7d0"}}>
                    €{totalValue.toLocaleString("de-DE")} gesamt
                  </span>
                  <span style={{fontSize:"0.73rem",color:C.textLight,fontWeight:500}}>·</span>
                  <span style={{fontSize:"0.73rem",fontWeight:700,background:C.accentSoft,color:C.accent,padding:"0.2rem 0.65rem",borderRadius:99,border:`1px solid ${C.accentBorder}`}}>
                    {signedSponsors.length} unterzeichnet
                  </span>
                  {notExported.length > 0 && <>
                    <span style={{fontSize:"0.73rem",color:C.textLight,fontWeight:500}}>·</span>
                    <span style={{fontSize:"0.73rem",fontWeight:700,background:"#fef3c7",color:"#92400e",padding:"0.2rem 0.65rem",borderRadius:99,border:"1px solid #fde68a"}}>
                      {notExported.length} CSV ausstehend
                    </span>
                  </>}
                </div>

                {/* Sponsorenliste */}
                <div>
                  {proj.pipeline.map((s, i) => {
                    const agr = s.agreement || {};
                    return (
                      <div
                        key={s.id}
                        style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.85rem 1.25rem",borderBottom:i<proj.pipeline.length-1?`1px solid ${C.border}`:"none",flexWrap:"wrap",transition:"background 0.12s",cursor:"pointer"}}
                        onClick={()=>setSelected(s)}
                        onMouseEnter={e=>e.currentTarget.style.background=C.surface}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                      >
                        {/* Firma + Paket */}
                        <div style={{flex:"1 1 130px",minWidth:0}}>
                          <div style={{fontSize:"0.9rem",fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {s.company}
                          </div>
                          <div style={{fontSize:"0.76rem",color:C.textMid,marginTop:"0.1rem"}}>
                            {s.package||"—"} · <span style={{fontWeight:600,color:C.text}}>€{(s.value||0).toLocaleString("de-DE")}</span>
                          </div>
                        </div>

                        {/* Status-Badges */}
                        <div style={{display:"flex",alignItems:"center",gap:"0.35rem",flexWrap:"wrap",justifyContent:"flex-end",flexShrink:0}} onClick={e=>e.stopPropagation()}>
                          {agr.signed
                            ? <span style={{fontSize:"0.68rem",fontWeight:700,background:"#eff6ff",color:"#1d4ed8",padding:"0.15rem 0.5rem",borderRadius:99,border:"1px solid #bfdbfe"}}>Unterzeichnet</span>
                            : <span style={{fontSize:"0.68rem",fontWeight:600,background:"#f9fafb",color:C.textLight,padding:"0.15rem 0.5rem",borderRadius:99,border:`1px solid ${C.border}`}}>Offen</span>
                          }
                          {agr.invoiceSent
                            ? <span style={{fontSize:"0.68rem",fontWeight:700,background:"#dcfce7",color:"#16a34a",padding:"0.15rem 0.5rem",borderRadius:99,border:"1px solid #bbf7d0"}}>Rechnung ✓</span>
                            : <span style={{fontSize:"0.68rem",fontWeight:600,background:"#f9fafb",color:C.textLight,padding:"0.15rem 0.5rem",borderRadius:99,border:`1px solid ${C.border}`}}>Rechnung —</span>
                          }
                          {agr.paymentReceived
                            ? <span style={{fontSize:"0.68rem",fontWeight:700,background:"#dcfce7",color:"#16a34a",padding:"0.15rem 0.5rem",borderRadius:99,border:"1px solid #bbf7d0"}}>Zahlung ✓</span>
                            : <span style={{fontSize:"0.68rem",fontWeight:600,background:"#f9fafb",color:C.textLight,padding:"0.15rem 0.5rem",borderRadius:99,border:`1px solid ${C.border}`}}>Zahlung —</span>
                          }
                          <button
                            type="button"
                            onClick={()=>exportOne(s)}
                            title="Als CSV exportieren"
                            style={{background:agr.csvExported?"#f0fdf4":"transparent",border:`1px solid ${agr.csvExported?"#bbf7d0":C.border}`,borderRadius:7,padding:"0.2rem 0.45rem",cursor:"pointer",display:"flex",alignItems:"center",gap:"0.2rem",color:agr.csvExported?"#16a34a":C.textMid,fontSize:"0.68rem",fontWeight:700,transition:"border-color 0.15s, color 0.15s"}}
                            onMouseEnter={e=>{if(!agr.csvExported){e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.color=C.accent;}}}
                            onMouseLeave={e=>{if(!agr.csvExported){e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.textMid;}}}
                          >
                            <Download size={10} strokeWidth={2}/>{agr.csvExported?"Exportiert":"CSV"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {proj.pipeline.length===0 && (
            <div style={{textAlign:"center",padding:"3.5rem 1rem",color:C.textLight}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:"1rem"}}><Inbox size={40} strokeWidth={1.5}/></div>
              <div style={{fontWeight:700,marginBottom:"0.5rem",fontSize:"1rem",color:C.textMid}}>Noch keine Sponsoren</div>
              <div style={{fontSize:"0.9rem",marginBottom:"1.5rem",lineHeight:1.5}}>Füge deinen ersten Sponsor hinzu und starte die Akquise.</div>
              <button onClick={()=>{ setAddSponsorMode(contacts.length>0?"contacts":"manual"); setNewSponsor({company:"",contact:"",email:"",phone:"",package:proj.packages[0]?.name||"",notes:"",contactId:null}); setSponsorContactSearch(""); setShowAdd(true); }} style={{background:C.accent,color:"#fff",border:"none",borderRadius:10,padding:"0.7rem 1.5rem",fontSize:"0.95rem",fontWeight:700,cursor:"pointer",boxShadow:`0 2px 8px ${C.accent}44`}}>+ Sponsor hinzufügen</button>
            </div>
          )}
          {[["draft","Entwurf"],["sent","Gesendet"],["negotiating","Verhandlung"],["confirmed","Bestätigt"]].map(([status,label])=>{
            const items = proj.pipeline.filter(s=>s.status===status);
            if(!items.length) return null;
            const cfg = STATUS_CONFIG[status];
            return <div key={status} style={{marginBottom:"1.75rem"}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.75rem"}}>
                <span style={{fontSize:"0.88rem",fontWeight:700,color:cfg.color}}>{label}</span>
                <span style={{fontSize:"0.75rem",fontWeight:700,background:cfg.bg,color:cfg.color,padding:"0.15rem 0.5rem",borderRadius:99}}>{items.length}</span>
              </div>
              {items.map(s=>(
                <div key={s.id} onClick={()=>setSelected(s)}
                  style={{background:C.surface,border:`1px solid ${C.border}`,borderLeft:`4px solid ${cfg.color}`,borderRadius:12,padding:"1.1rem 1.25rem",cursor:"pointer",marginBottom:"0.65rem",transition:"box-shadow 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.07)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",marginBottom:"0.5rem"}}>
                    <div>
                      <div style={{fontSize:"1.05rem",fontWeight:800}}>{s.company}</div>
                      <div style={{fontSize:"0.88rem",color:C.textMid,marginTop:"0.1rem"}}>{s.contact}</div>
                    </div>
                    <div style={{textAlign:"right",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"0.25rem"}}>
                      <div style={{fontSize:"1.05rem",fontWeight:800,fontFamily:"Georgia,serif"}}>€{s.value.toLocaleString("de-DE")}</div>
                      <div style={{fontSize:"0.78rem",color:C.textLight}}>{s.package}</div>
                      {confirmDeleteSponsor === s.id ? (
                        <div onClick={e=>e.stopPropagation()} style={{display:"flex",gap:"0.35rem",marginTop:"0.25rem"}}>
                          <button onClick={()=>deleteSponsor(s.id)} style={{background:"#dc2626",color:"#fff",border:"none",borderRadius:6,padding:"0.25rem 0.6rem",fontSize:"0.72rem",fontWeight:700,cursor:"pointer"}}>Ja, löschen</button>
                          <button onClick={()=>setConfirmDeleteSponsor(null)} style={{background:C.bg,color:C.textMid,border:`1px solid ${C.border}`,borderRadius:6,padding:"0.25rem 0.6rem",fontSize:"0.72rem",fontWeight:600,cursor:"pointer"}}>Abbrechen</button>
                        </div>
                      ) : (
                        <button onClick={e=>{e.stopPropagation();setConfirmDeleteSponsor(s.id);}} style={{background:"none",border:"none",cursor:"pointer",color:C.textLight,padding:"0.1rem",display:"flex",alignItems:"center"}} title="Löschen">
                          <Trash2 size={14} strokeWidth={1.5}/>
                        </button>
                      )}
                    </div>
                  </div>
                  {s.pitchSent && <div style={{fontSize:"0.85rem",color:status==="sent"?C.accent:C.textLight,fontWeight:status==="sent"?600:400,marginTop:"0.4rem",display:"flex",alignItems:"center",gap:"0.35rem"}}><Eye size={12} strokeWidth={1.5}/>Pitch geöffnet: {s.opened}{status==="sent"&&" · Jetzt anrufen!"}</div>}
                  {status==="draft" && <button onClick={e=>{e.stopPropagation();if(!hasFeature(user?.tier||'free','email-templates')){setShowUpgrade({feature:'email-templates',label:'E-Mail Pitch-Editor',requiredTier:'pro'});return;}setPitchText("");setShowPitchEditor(s);}} style={{width:"100%",marginTop:"0.75rem",background:C.accentSoft,color:C.accent,border:`1px solid ${C.accentBorder}`,borderRadius:8,padding:"0.55rem",fontSize:"0.88rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"}}><Mail size={14} strokeWidth={1.5}/>Pitch E-Mail verfassen</button>}
                </div>
              ))}
            </div>;
          })}

        </div>}

        {/* WERBEPRÄSENZ-CHECKLISTE */}
        {page==="checkliste" && <div>
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"1.5rem",flexWrap:"wrap"}}>
            <button onClick={()=>setPage("pipeline")} style={{background:"none",border:"none",cursor:"pointer",color:C.textMid,display:"flex",alignItems:"center",gap:"0.3rem",fontSize:"0.88rem",padding:0,fontWeight:600}}>
              ← Pipeline
            </button>
            <div style={{flex:1}}>
              <h2 style={{fontSize:"1.5rem",fontWeight:800,margin:"0 0 0.2rem",fontFamily:"Georgia,serif"}}>Werbepräsenz-Checkliste</h2>
              <div style={{fontSize:"0.88rem",color:C.textMid}}>Alle bestätigten Vereinbarungen & vereinbarte Leistungen</div>
            </div>
          </div>
          {(() => {
            const allSigned = projects.flatMap(p =>
              p.pipeline
                .filter(s => s.agreement?.signed && (s.agreement?.benefitChecklist||[]).length > 0)
                .map(s => ({ proj: p, sponsor: s }))
            );
            if (allSigned.length === 0) return (
              <div style={{textAlign:"center",padding:"3rem 1rem",color:C.textLight}}>
                <CheckCircle size={36} strokeWidth={1.5} style={{margin:"0 auto 1rem"}}/>
                <div style={{fontWeight:700,color:C.textMid,marginBottom:"0.5rem"}}>Noch keine unterzeichneten Vereinbarungen</div>
                <div style={{fontSize:"0.9rem"}}>Sobald Sponsoren Verträge unterzeichnen, erscheinen ihre Leistungen hier.</div>
              </div>
            );
            // Gruppiert nach Event
            const byEvent = projects.map(p => ({
              proj: p,
              sponsors: p.pipeline.filter(s => s.agreement?.signed && (s.agreement?.benefitChecklist||[]).length > 0)
            })).filter(e => e.sponsors.length > 0);

            return byEvent.map(({ proj: p, sponsors }) => {
              const totalItems = sponsors.reduce((sum, s) => sum + (s.agreement?.benefitChecklist||[]).length, 0);
              const doneItems = sponsors.reduce((sum, s) => sum + (s.agreement?.benefitChecklist||[]).filter(i=>i.done).length, 0);
              const pct = totalItems > 0 ? Math.round(doneItems/totalItems*100) : 0;
              return (
                <div key={p.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,marginBottom:"1.5rem",overflow:"hidden"}}>
                  {/* Event-Header */}
                  <div style={{background:C.bg,borderBottom:`1px solid ${C.border}`,padding:"0.9rem 1.25rem",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"0.5rem"}}>
                    <div>
                      <div style={{fontSize:"1rem",fontWeight:800,color:C.text}}>{p.name}</div>
                      <div style={{fontSize:"0.78rem",color:C.textMid,marginTop:"0.1rem"}}>{sponsors.length} Sponsor{sponsors.length!==1?"en":""} · {doneItems}/{totalItems} Leistungen</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:"0.6rem"}}>
                      <div style={{fontSize:"0.82rem",fontWeight:700,color:pct===100?"#16a34a":C.accent}}>{pct}%</div>
                      <div style={{width:80,height:6,borderRadius:99,background:C.border,overflow:"hidden"}}>
                        <div style={{width:`${pct}%`,height:"100%",background:pct===100?"#16a34a":C.accent,borderRadius:99,transition:"width 0.3s"}}/>
                      </div>
                    </div>
                  </div>
                  {/* Sponsors */}
                  {sponsors.map((s, si) => {
                    const checklist = s.agreement?.benefitChecklist || [];
                    const sponsorDone = checklist.filter(i=>i.done).length;
                    return (
                      <div key={s.id} style={{borderBottom:si<sponsors.length-1?`1px solid ${C.border}`:"none",padding:"1rem 1.25rem"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.6rem",gap:"0.5rem",flexWrap:"wrap"}}>
                          <div style={{display:"flex",alignItems:"center",gap:"0.55rem"}}>
                            <div style={{width:32,height:32,borderRadius:8,background:C.bg,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.78rem",fontWeight:800,color:C.textMid,flexShrink:0}}>
                              {s.company.slice(0,2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{fontSize:"0.92rem",fontWeight:700,color:C.text}}>{s.company}</div>
                              <div style={{fontSize:"0.75rem",color:C.textMid}}>{s.package||"—"} · €{(s.value||0).toLocaleString("de-DE")}</div>
                            </div>
                          </div>
                          <span style={{fontSize:"0.72rem",fontWeight:700,background:sponsorDone===checklist.length?"#dcfce7":C.accentSoft,color:sponsorDone===checklist.length?"#16a34a":C.accent,padding:"0.15rem 0.55rem",borderRadius:99,border:`1px solid ${sponsorDone===checklist.length?"#bbf7d0":C.accentBorder}`}}>
                            {sponsorDone}/{checklist.length}
                          </span>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:"0.3rem"}}>
                          {checklist.map((item, idx) => (
                            <div key={idx}
                              onClick={()=>{
                                updAnyProj(p.id, proj => ({...proj, pipeline: proj.pipeline.map(sp =>
                                  sp.id===s.id ? {...sp, agreement:{...sp.agreement, benefitChecklist: (sp.agreement?.benefitChecklist||[]).map((x,j)=>j===idx?{...x,done:!x.done}:x)}} : sp
                                )}));
                              }}
                              style={{display:"flex",alignItems:"center",gap:"0.6rem",padding:"0.5rem 0.65rem",borderRadius:9,cursor:"pointer",background:item.done?"#f0fdf4":C.bg,border:`1px solid ${item.done?"#bbf7d0":C.border}`,transition:"background 0.12s"}}
                            >
                              <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${item.done?"#16a34a":C.border}`,background:item.done?"#16a34a":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                {item.done && <span style={{color:"#fff",fontSize:"0.65rem",fontWeight:700}}>✓</span>}
                              </div>
                              <span style={{fontSize:"0.85rem",color:item.done?"#16a34a":C.text,textDecoration:item.done?"line-through":"none",lineHeight:1.4}}>{item.benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            });
          })()}
        </div>}

        {/* PAKETE */}
        {page==="packages" && <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.5rem"}}>
            <div>
              <h2 style={{fontSize:"1.5rem",fontWeight:800,margin:"0 0 0.3rem",fontFamily:"Georgia,serif"}}>Sponsoring-Pakete</h2>
              <div style={{fontSize:"0.9rem",color:C.textMid}}>Paket antippen zum Auswählen · Stift-Symbol zum Bearbeiten</div>
            </div>
            <button onClick={()=>{ if(!canCreatePackage(user?.tier||'free', proj.packages.length)){ setShowUpgrade({feature:'maxPackages',label:'Unbegrenzte Pakete',requiredTier:'pro'}); return; } setShowAddPkg(true); }}
              style={{background:C.accent,color:"#fff",border:"none",borderRadius:10,padding:"0.6rem 1.1rem",fontSize:"0.9rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:"0.4rem",boxShadow:`0 2px 8px ${C.accent}44`,transition:"opacity 0.15s",flexShrink:0}}
              onMouseEnter={e=>e.currentTarget.style.opacity="0.88"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              <Plus size={14} strokeWidth={2}/>Neues Paket
            </button>
          </div>
          {proj.packages.map(pkg=>(
            <div key={pkg.id} onClick={()=>setSelectedPkgId(pkg.id===selectedPkgId ? null : pkg.id)} style={{background:selectedPkgId===pkg.id ? C.accentSoft : C.surface,border:`2px solid ${selectedPkgId===pkg.id ? C.accent : C.border}`,borderRadius:16,padding:"1.35rem 1.4rem",marginBottom:"1.1rem",cursor:"pointer",transition:"border-color 0.15s, background 0.15s, box-shadow 0.15s"}}
              onMouseEnter={e=>{if(pkg.id!==selectedPkgId)e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.07)"}} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.75rem"}}>
                <div>
                  <div style={{fontSize:"0.78rem",fontWeight:700,letterSpacing:"0.1em",color:pkg.color,marginBottom:"0.3rem"}}>{pkg.name.toUpperCase()}</div>
                  <div style={{fontSize:"1.75rem",fontWeight:800,fontFamily:"Georgia,serif",lineHeight:1}}>€{pkg.price.toLocaleString("de-DE")}</div>
                  <div style={{fontSize:"0.78rem",color:C.textLight,marginTop:"0.25rem"}}>{user.mwst==="0"?"exkl. Steuern":user.mwst==="werbung5"?"zzgl. 5% ges. Werbeabgabe":user.mwst==="mwst10"?"zzgl. 10% MwSt":user.mwst==="mwst20"?"zzgl. 20% MwSt":"zzgl. 5% Werbeabgabe + 20% MwSt"}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"0.5rem"}}>
                  <button onClick={e=>{e.stopPropagation();setEditPkg({...pkg})}} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"0.4rem 0.85rem",fontSize:"0.88rem",fontWeight:600,cursor:"pointer",color:C.textMid,display:"flex",alignItems:"center",gap:"0.35rem"}}><Pencil size={13} strokeWidth={1.5}/>Bearbeiten</button>
                  <div style={{fontSize:"0.78rem",fontWeight:700,color:pkg.taken>=pkg.slots?C.green:C.textLight}}>{pkg.taken>=pkg.slots?"AUSGEBUCHT":`${pkg.slots-pkg.taken} von ${pkg.slots} frei`}</div>
                  <div style={{height:5,width:72,background:C.bg,borderRadius:99,overflow:"hidden",border:`1px solid ${C.border}`}}><div style={{height:"100%",width:`${Math.min(100,pkg.taken/pkg.slots*100)}%`,background:pkg.color,borderRadius:99}}/></div>
                </div>
              </div>
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:"0.75rem",display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                {pkg.benefits.map((b,j)=>(
                  <div key={j} style={{display:"flex",gap:"0.6rem",alignItems:"center"}}>
                    <div style={{width:16,height:16,borderRadius:"50%",background:pkg.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:"0.52rem",color:"#fff",fontWeight:700}}>✓</span></div>
                    <span style={{fontSize:"0.9rem",color:C.textMid,lineHeight:1.4}}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={()=>{ if(!canCreatePackage(user?.tier||'free', proj.packages.length)){ setShowUpgrade({feature:'maxPackages',label:'Unbegrenzte Pakete',requiredTier:'pro'}); return; } setShowAddPkg(true); }} style={{width:"100%",marginTop:"0.5rem",background:C.bg,color:C.accent,border:`1.5px dashed ${C.accentBorder}`,borderRadius:14,padding:"1.1rem",fontSize:"1rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"}}>
            <Plus size={17} strokeWidth={1.5}/>Neues Paket anlegen
          </button>
        </div>}

        {/* VORSCHAU */}
        {page==="preview" && <div>
          <div style={{background:C.amberSoft,border:`1px solid ${C.amber}44`,borderRadius:12,padding:"0.75rem 1rem",marginBottom:"1.25rem",display:"flex",gap:"0.6rem",alignItems:"center"}}>
            <Eye size={15} strokeWidth={1.5} color={C.amber}/><div style={{fontSize:"0.88rem",flex:1}}>So sieht dein Angebot für Sponsoren aus</div>
          </div>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,overflow:"hidden"}}>

            {/* BANNER */}
            <div style={{position:"relative",background:C.text,aspectRatio:"2.63/1",overflow:"hidden"}}>
              {proj.banner
                ? <img src={proj.banner} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.7}}/>
                : <div style={{position:"absolute",top:-30,right:-30,width:140,height:140,borderRadius:"50%",background:"rgba(232,80,10,0.15)"}}/>
              }
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"1rem 1.25rem"}}>
                <div style={{fontSize:"0.65rem",fontWeight:600,letterSpacing:"0.15em",color:"rgba(255,255,255,0.5)",marginBottom:"0.3rem"}}>SPONSORING-ANGEBOT</div>
                <div style={{fontSize:"1.4rem",fontWeight:800,color:"#fff",fontFamily:"Georgia,serif",lineHeight:1.2}}>{proj.name}</div>
              </div>
            </div>

            <div style={{padding:"1.25rem"}}>
              {/* EVENT INFO */}
              <div style={{display:"flex",flexDirection:"column",gap:"0.3rem",marginBottom:"1.25rem",paddingBottom:"1.25rem",borderBottom:`1px solid ${C.border}`}}>
                {[[<Calendar size={13} strokeWidth={1.5}/>,proj.date],[<MapPin size={13} strokeWidth={1.5}/>,proj.location],[<Users size={13} strokeWidth={1.5}/>,`${proj.audience} Gäste · ${proj.reach} Reach`]].map(([icon,text],i)=>(
                  <div key={i} style={{display:"flex",gap:"0.5rem",fontSize:"0.92rem",color:C.textMid,alignItems:"center"}}>{icon}<span>{text}</span></div>
                ))}
              </div>

              {proj.description && <div style={{marginBottom:"1.5rem"}}>
                <div style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:C.textLight,marginBottom:"0.75rem"}}>ÜBER DAS EVENT</div>
                <SafeHtml html={proj.description} style={{fontSize:"0.98rem",lineHeight:1.7}}/>
              </div>}

              {/* MEHRWERT */}
              <div style={{marginBottom:"1.75rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem"}}>
                  <div style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:C.textLight}}>WARUM SPONSOREN PROFITIEREN</div>
                </div>
                {(proj.mehrwert||[]).map(m=>(
                  <div key={m.id} style={{display:"flex",gap:"1rem",padding:"0.9rem 1rem",background:C.bg,borderRadius:12,marginBottom:"0.6rem",border:`1px solid ${C.border}`}}>
                    <div style={{fontSize:"1.4rem",flexShrink:0,lineHeight:1,marginTop:"0.1rem"}}>{m.icon}</div>
                    <div><div style={{fontSize:"0.95rem",fontWeight:700,marginBottom:"0.2rem"}}>{m.title}</div><div style={{fontSize:"0.88rem",color:C.textMid,lineHeight:1.5}}>{m.text}</div></div>
                  </div>
                ))}
              </div>

              {/* GALLERY */}
              {(proj.gallery||[]).length>0 && <div style={{marginBottom:"1.75rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem"}}>
                  <div style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:C.textLight}}>IMPRESSIONEN</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(90px, 1fr))",gap:"0.5rem"}}>
                  {proj.gallery.slice(0,6).map((g,i)=>(
                    <div key={g.id} style={{borderRadius:10,overflow:"hidden",aspectRatio:"4/5",position:"relative"}}>
                      <img src={g.url || g.src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      {i===5&&proj.gallery.length>6&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:"1.1rem"}}>+{proj.gallery.length-6}</div>}
                    </div>
                  ))}
                </div>
              </div>}

              {/* PAKETE */}
              {(() => {
                const recommendedId = proj.packages[0]?.id;
                const selectedId = previewPkgId || recommendedId;
                const selectedPkg = proj.packages.find(p=>p.id===selectedId) || proj.packages[0];
                const taxLabel = user.mwst==="0"?"exkl. Steuern":user.mwst==="werbung5"?"zzgl. 5% Werbeabgabe":user.mwst==="mwst10"?"zzgl. 10% MwSt":user.mwst==="mwst20"?"zzgl. 20% MwSt":"zzgl. 5% Werbeabgabe + 20% MwSt";
                return (
                  <div style={{marginBottom:"1.75rem"}}>
                    <div style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:C.textLight,marginBottom:"0.75rem"}}>SPONSORING-PAKETE</div>
                    {proj.packages.map((pkg)=>{
                      const isSelected = pkg.id === selectedId;
                      const isRecommended = pkg.id === recommendedId;
                      return (
                        <div key={pkg.id} onClick={()=>setPreviewPkgId(pkg.id)}
                          style={{border:`2px solid ${isSelected?pkg.color:C.border}`,borderRadius:14,padding:"1rem 1.1rem",background:isSelected?C.accentSoft:C.surface,marginBottom:"0.75rem",cursor:"pointer",transition:"border-color 0.15s, background 0.15s"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.5rem"}}>
                            <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                              <span style={{fontSize:"0.8rem",fontWeight:700,color:pkg.color,letterSpacing:"0.08em"}}>{pkg.name.toUpperCase()}</span>
                              {isRecommended && <span style={{fontSize:"0.6rem",background:C.accent,color:"#fff",padding:"0.1rem 0.45rem",borderRadius:99,fontWeight:700}}>EMPFOHLEN</span>}
                              {isSelected && !isRecommended && <span style={{fontSize:"0.6rem",background:pkg.color,color:"#fff",padding:"0.1rem 0.45rem",borderRadius:99,fontWeight:700}}>AUSGEWÄHLT</span>}
                            </div>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontSize:"1.2rem",fontWeight:800,fontFamily:"Georgia,serif"}}>€{pkg.price.toLocaleString("de-DE")}</div>
                              <div style={{fontSize:"0.68rem",color:C.textLight}}>{taxLabel}</div>
                            </div>
                          </div>
                          <div style={{display:"flex",flexDirection:"column",gap:"0.35rem",marginTop:"0.4rem"}}>
                            {pkg.benefits.map((b,j)=>(
                              <div key={j} style={{display:"flex",gap:"0.5rem",alignItems:"flex-start"}}>
                                <div style={{width:16,height:16,borderRadius:"50%",background:pkg.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"0.1rem"}}><span style={{fontSize:"0.5rem",color:"#fff",fontWeight:700}}>✓</span></div>
                                <span style={{fontSize:"0.9rem",color:C.textMid,lineHeight:1.4}}>{b}</span>
                              </div>
                            ))}
                          </div>
                          {isSelected && (
                            <div style={{marginTop:"0.75rem",paddingTop:"0.75rem",borderTop:`1px solid ${pkg.color}44`,display:"flex",alignItems:"center",gap:"0.4rem"}}>
                              <div style={{width:16,height:16,borderRadius:"50%",background:pkg.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:"#fff",fontSize:"0.55rem",fontWeight:700}}>✓</span></div>
                              <span style={{fontSize:"0.78rem",color:pkg.color,fontWeight:700}}>Dieses Paket ausgewählt</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* VERANSTALTER */}
              <div style={{background:C.bg,borderRadius:16,padding:"1.25rem",marginBottom:"1.5rem",border:`1px solid ${C.border}`}}>
                <div style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:C.textLight,marginBottom:"0.75rem"}}>VERANSTALTER</div>
                <div style={{display:"flex",gap:"0.75rem",alignItems:"flex-start",marginBottom:"0.75rem"}}>
                  {user.logo
                    ? <img src={user.logo} alt="" style={{width:48,height:48,objectFit:"contain",borderRadius:10,border:`1px solid ${C.border}`,background:C.surface,flexShrink:0}}/>
                    : <div style={{width:48,height:48,borderRadius:10,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Zap size={22} strokeWidth={1.5} color="#fff"/></div>
                  }
                  <div>
                    <div style={{fontSize:"1rem",fontWeight:700,marginBottom:"0.2rem"}}>{user.name}</div>
                    {user.bio && <div style={{fontSize:"0.88rem",color:C.textMid,lineHeight:1.5}}>{user.bio}</div>}
                  </div>
                </div>
                <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
                  {user.website && <a href={user.website.startsWith("http")?user.website:"https://"+user.website} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"0.3rem",fontSize:"0.82rem",color:C.text,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"0.3rem 0.65rem",textDecoration:"none",fontWeight:600}}><Globe size={11} strokeWidth={1.5}/>Website</a>}
                  {user.facebook && <a href={user.facebook} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"0.3rem",fontSize:"0.82rem",color:"#1877f2",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:8,padding:"0.3rem 0.65rem",textDecoration:"none",fontWeight:600}}>f Facebook</a>}
                  {user.instagram && <a href={user.instagram} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"0.3rem",fontSize:"0.82rem",color:"#e1306c",background:"#fdf2f8",border:"1px solid #fbcfe8",borderRadius:8,padding:"0.3rem 0.65rem",textDecoration:"none",fontWeight:600}}><Camera size={11} strokeWidth={1.5}/>Instagram</a>}
                  {user.linkedin && <a href={user.linkedin} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"0.3rem",fontSize:"0.82rem",color:"#0077b5",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:8,padding:"0.3rem 0.65rem",textDecoration:"none",fontWeight:600}}>in LinkedIn</a>}
                </div>
              </div>

              {/* CTA */}
              {(() => {
                const selectedId = previewPkgId || proj.packages[0]?.id;
                const selectedPkg = proj.packages.find(p=>p.id===selectedId) || proj.packages[0];
                const pkgLine = selectedPkg ? `Ausgewähltes Paket: ${selectedPkg.name} (€${selectedPkg.price.toLocaleString("de-AT")})%0A%0A` : "";
                const mailto = `mailto:${proj.email||user.email}?subject=Sponsoring-Anfrage: ${encodeURIComponent(proj.name)}&body=Hallo,%0A%0Aich interessiere mich für eine Sponsoring-Partnerschaft bei ${encodeURIComponent(proj.name)}.%0A%0A${pkgLine}Mit freundlichen Grüßen%0A${encodeURIComponent(user.name||"")}`;
                return (
                  <div style={{background:C.text,borderRadius:16,padding:"1.5rem",textAlign:"center"}}>
                    <div style={{fontSize:"1.1rem",fontWeight:700,color:"#fff",marginBottom:"0.4rem",fontFamily:"Georgia,serif"}}>Interesse an einer Partnerschaft?</div>
                    {selectedPkg && (
                      <div style={{fontSize:"0.82rem",color:"rgba(255,255,255,0.6)",marginBottom:"0.5rem"}}>
                        Ausgewähltes Paket: <strong style={{color:"#fff"}}>{selectedPkg.name}</strong> · €{selectedPkg.price.toLocaleString("de-DE")}
                      </div>
                    )}
                    <div style={{fontSize:"0.85rem",color:"rgba(255,255,255,0.45)",marginBottom:"1.25rem"}}>Wir freuen uns auf deine Nachricht</div>
                    <a href={mailto} style={{display:"inline-block",background:C.accent,color:"#fff",textDecoration:"none",borderRadius:12,padding:"0.85rem 2rem",fontSize:"0.98rem",fontWeight:700}}>
                      Interesse signalisieren →
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>}
      </div>


        {/* KONTAKTE */}
        {page==="contacts" && (() => {
          const query = contactSearch.trim().toLowerCase();
          const filtered = contacts.filter(c =>
            !query ||
            c.company.toLowerCase().includes(query) ||
            (c.contactName||"").toLowerCase().includes(query)
          );
          return (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.5rem"}}>
                <div>
                  <h2 style={{fontSize:"1.5rem",fontWeight:800,margin:"0 0 0.3rem",fontFamily:"Georgia,serif"}}>Kontakte</h2>
                  <div style={{fontSize:"0.9rem",color:C.textMid}}>{contacts.length} Kontakt{contacts.length!==1?"e":""} · global über alle Events</div>
                </div>
                <button onClick={()=>setShowAddContact(true)}
                  style={{background:C.accent,color:"#fff",border:"none",borderRadius:10,padding:"0.65rem 1.1rem",fontSize:"0.9rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:"0.4rem",flexShrink:0,boxShadow:`0 2px 8px ${C.accent}44`,transition:"opacity 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.opacity="0.88"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                  <Plus size={14} strokeWidth={2}/>Kontakt anlegen
                </button>
              </div>

              {/* SEARCH — prominent mit Icon */}
              <div style={{position:"relative",marginTop:"0.25rem",marginBottom:"1.5rem"}}>
                <Search size={16} strokeWidth={1.5} color={C.textMid} style={{position:"absolute",left:"1rem",top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
                <input
                  type="text"
                  placeholder="Firma oder Ansprechpartner suchen..."
                  value={contactSearch}
                  onChange={e=>setContactSearch(e.target.value)}
                  style={{...mkInp(C),paddingLeft:"2.75rem",fontSize:"1rem",padding:"0.85rem 1rem 0.85rem 2.75rem",border:`1.5px solid ${C.border}`,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}
                />
              </div>

              {/* EMPTY STATE */}
              {contacts.length === 0 && (
                <div style={{textAlign:"center",padding:"3.5rem 1rem",color:C.textLight}}>
                  <div style={{display:"flex",justifyContent:"center",marginBottom:"1rem"}}><BookUser size={40} strokeWidth={1.5}/></div>
                  <div style={{fontWeight:700,marginBottom:"0.5rem",color:C.textMid,fontSize:"1rem"}}>Noch keine Kontakte</div>
                  <div style={{fontSize:"0.9rem",marginBottom:"1.5rem",lineHeight:1.6}}>Sponsoren mit E-Mail-Adresse in deiner Pipeline werden automatisch hier eingetragen.</div>
                  <button onClick={()=>setShowAddContact(true)} style={{background:C.accent,color:"#fff",border:"none",borderRadius:10,padding:"0.7rem 1.5rem",fontSize:"0.95rem",fontWeight:700,cursor:"pointer",boxShadow:`0 2px 8px ${C.accent}44`}}>+ Kontakt anlegen</button>
                </div>
              )}

              {/* CONTACT LIST */}
              {filtered.length === 0 && contacts.length > 0 && (
                <div style={{textAlign:"center",padding:"2rem 1rem",color:C.textLight,fontSize:"0.95rem"}}>Keine Kontakte gefunden für „{contactSearch}"</div>
              )}

              {filtered.map(c => {
                const lastEvent = (c.eventHistory||[]).slice(-1)[0];
                const lastCfg = lastEvent ? (STATUS_CONFIG[lastEvent.status]||STATUS_CONFIG.draft) : null;
                const prefs = getContactPreferences(c);
                return (
                  <div key={c.id}
                    style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"1.25rem 1.5rem",marginBottom:"0.75rem",cursor:"pointer",transition:"box-shadow 0.15s"}}
                    onClick={()=>setEditContact({...c})}
                    onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.07)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                    <div style={{display:"flex",gap:"1rem",alignItems:"flex-start"}}>
                      {/* Avatar */}
                      <div style={{
                        width:44,height:44,borderRadius:12,
                        background:C.accentSoft,
                        border:`1.5px solid ${C.accentBorder}`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:"0.9rem",fontWeight:800,color:C.accent,
                        flexShrink:0,letterSpacing:"-0.02em",
                      }}>
                        {c.company.slice(0,2).toUpperCase()}
                      </div>
                      {/* Restlicher Inhalt */}
                      <div style={{flex:1,minWidth:0}}>
                        {/* Obere Zeile: Firmenname groß + Badges rechts */}
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.5rem"}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:"1.05rem",fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:"0.2rem"}}>{c.company}</div>
                            {c.contactName && <div style={{fontSize:"0.88rem",color:C.textMid,display:"flex",alignItems:"center",gap:"0.35rem"}}><User size={12} strokeWidth={1.5}/>{c.contactName}</div>}
                          </div>
                          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"0.35rem",flexShrink:0,marginLeft:"1rem"}}>
                            {(c.eventHistory||[]).length > 0 && (
                              <span style={{fontSize:"0.7rem",fontWeight:700,padding:"0.25rem 0.65rem",borderRadius:99,background:C.accentSoft,color:C.accent,whiteSpace:"nowrap"}}>
                                {(c.eventHistory||[]).length} Event{(c.eventHistory||[]).length!==1?"s":""}
                              </span>
                            )}
                            {lastCfg && <span style={{fontSize:"0.7rem",fontWeight:700,padding:"0.25rem 0.65rem",borderRadius:99,background:lastCfg.bg,color:lastCfg.color,whiteSpace:"nowrap"}}>{lastCfg.label}</span>}
                          </div>
                        </div>
                        {/* Untere Zeile: E-Mail + Telefon */}
                        {(c.email||c.phone) && (
                          <div style={{display:"flex",gap:"1.25rem",flexWrap:"wrap",marginTop:"0.4rem",paddingTop:"0.5rem",borderTop:`1px solid ${C.border}`}}>
                            {c.email && <div style={{fontSize:"0.82rem",color:C.textLight,display:"flex",alignItems:"center",gap:"0.35rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><Mail size={12} strokeWidth={1.5}/>{c.email}</div>}
                            {c.phone && <div style={{fontSize:"0.82rem",color:C.textLight,display:"flex",alignItems:"center",gap:"0.35rem"}}><Phone size={12} strokeWidth={1.5}/>{c.phone}</div>}
                          </div>
                        )}
                        {lastEvent && <div style={{fontSize:"0.78rem",color:C.textLight,marginTop:"0.4rem",display:"flex",alignItems:"center",gap:"0.35rem"}}><History size={12} strokeWidth={1.5}/>Letztes Event: {lastEvent.eventName}</div>}
                        {prefs && (
                          <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",marginTop:"0.5rem",paddingTop:"0.5rem",borderTop:`1px solid ${C.border}`}}>
                            {prefs.conversionRate > 0 && <span style={{fontSize:"0.68rem",fontWeight:700,padding:"0.2rem 0.55rem",borderRadius:99,background:"#f0fdf4",color:"#16a34a",whiteSpace:"nowrap"}}>{prefs.conversionRate}% Zusagerate</span>}
                            {prefs.topGenre && prefs.confirmedCount > 0 && <span style={{fontSize:"0.68rem",fontWeight:700,padding:"0.2rem 0.55rem",borderRadius:99,background:"#eff6ff",color:"#2563eb",whiteSpace:"nowrap"}}>{prefs.topGenre}</span>}
                            {prefs.topPackage && prefs.confirmedCount > 0 && <span style={{fontSize:"0.68rem",fontWeight:700,padding:"0.2rem 0.55rem",borderRadius:99,background:C.accentSoft,color:C.accent,whiteSpace:"nowrap"}}>{prefs.topPackage}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* KALENDER */}
        {page==="calendar" && (() => {
          // Collect all appointments across all projects
          const allApts = [];
          projects.forEach(p => {
            (p.pipeline||[]).forEach(s => {
              (s.appointments||[]).forEach(apt => {
                allApts.push({ ...apt, sponsorName: s.company, sponsorId: s.id, eventName: p.name, projId: p.id });
              });
            });
          });
          allApts.sort((a,b) => a.date.localeCompare(b.date) || (a.time||"").localeCompare(b.time||""));

          const today = new Date().toISOString().slice(0,10);
          const { year, month } = calendarMonth;

          const prevMonth = () => setCalendarMonth(m => m.month === 0 ? { year: m.year-1, month: 11 } : { year: m.year, month: m.month-1 });
          const nextMonth = () => setCalendarMonth(m => m.month === 11 ? { year: m.year+1, month: 0 } : { year: m.year, month: m.month+1 });

          const MONTH_NAMES = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
          const DAY_NAMES   = ["Mo","Di","Mi","Do","Fr","Sa","So"];

          // Build month grid
          const firstDay = new Date(year, month, 1);
          const lastDay  = new Date(year, month+1, 0);
          // Monday-first: 0=Mon ... 6=Sun
          const startDow = (firstDay.getDay() + 6) % 7;
          const totalDays = lastDay.getDate();
          const cells = [];
          for (let i = 0; i < startDow; i++) cells.push(null);
          for (let d = 1; d <= totalDays; d++) cells.push(d);
          while (cells.length % 7 !== 0) cells.push(null);

          const aptsForDay = (d) => {
            const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            return allApts.filter(a => a.date === dateStr);
          };

          const selectedDayApts = calendarDaySelected ? allApts.filter(a => a.date === calendarDaySelected) : [];

          // Toggle appointment done state across projects
          const toggleAptDone = (apt) => {
            const ps = projects.map(p => {
              if (p.id !== apt.projId) return p;
              return { ...p, pipeline: p.pipeline.map(s => {
                if (s.id !== apt.sponsorId) return s;
                return { ...s, appointments: (s.appointments||[]).map(a => a.id === apt.id ? { ...a, done: !a.done } : a) };
              })};
            });
            saveProjects(ps, user.id);
          };

          // Kalender-Export Icons — alle drei öffnen denselben ICS-Download
          const ExportIcons = ({apt}) => (
            <div style={{display:"flex",gap:"0.3rem",flexShrink:0}}>
              <button onClick={()=>generateICS(apt,apt.sponsorName,apt.eventName)} title="In Outlook exportieren"
                style={{background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe",borderRadius:6,padding:"0.2rem 0.45rem",cursor:"pointer",fontSize:"0.65rem",fontWeight:700,display:"flex",alignItems:"center",gap:"0.2rem",whiteSpace:"nowrap"}}>
                <Download size={10} strokeWidth={1.5}/>Outlook
              </button>
              <button onClick={()=>generateICS(apt,apt.sponsorName,apt.eventName)} title="In Apple Kalender exportieren"
                style={{background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0",borderRadius:6,padding:"0.2rem 0.45rem",cursor:"pointer",fontSize:"0.65rem",fontWeight:700,display:"flex",alignItems:"center",gap:"0.2rem",whiteSpace:"nowrap"}}>
                <Download size={10} strokeWidth={1.5}/>Apple
              </button>
              <button onClick={()=>generateICS(apt,apt.sponsorName,apt.eventName)} title="In Google Kalender exportieren"
                style={{background:"#fef9c3",color:"#ca8a04",border:"1px solid #fde68a",borderRadius:6,padding:"0.2rem 0.45rem",cursor:"pointer",fontSize:"0.65rem",fontWeight:700,display:"flex",alignItems:"center",gap:"0.2rem",whiteSpace:"nowrap"}}>
                <Download size={10} strokeWidth={1.5}/>Google
              </button>
            </div>
          );

          return (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.5rem"}}>
                <div>
                  <h2 style={{fontSize:"1.5rem",fontWeight:800,margin:"0 0 0.3rem",fontFamily:"Georgia,serif"}}>Kalender</h2>
                  <div style={{fontSize:"0.9rem",color:C.textMid}}>{allApts.filter(a=>!a.done).length} offene Termin{allApts.filter(a=>!a.done).length!==1?"e":""} · alle Events</div>
                </div>
                {/* View toggle */}
                <div style={{display:"flex",gap:"0.35rem",background:C.bg,borderRadius:9,padding:"0.25rem",border:`1px solid ${C.border}`}}>
                  <button onClick={()=>setCalendarView("month")} style={{padding:"0.4rem 0.75rem",borderRadius:7,border:"none",cursor:"pointer",fontSize:"0.82rem",fontWeight:700,background:calendarView==="month"?C.surface:"transparent",color:calendarView==="month"?C.accent:C.textMid,transition:"background 0.15s"}}>Monat</button>
                  <button onClick={()=>setCalendarView("list")} style={{padding:"0.4rem 0.75rem",borderRadius:7,border:"none",cursor:"pointer",fontSize:"0.82rem",fontWeight:700,background:calendarView==="list"?C.surface:"transparent",color:calendarView==="list"?C.accent:C.textMid,transition:"background 0.15s"}}>Liste</button>
                </div>
              </div>

              {/* MONTH VIEW */}
              {calendarView==="month" && (
                <div>
                  {/* Month navigation — prominent */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem",background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"0.75rem 1rem"}}>
                    <button onClick={prevMonth} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,width:38,height:38,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.2rem",color:C.textMid,fontWeight:700,transition:"border-color 0.15s"}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>‹</button>
                    <div style={{fontSize:"1.15rem",fontWeight:800,color:C.text,fontFamily:"Georgia,serif"}}>{MONTH_NAMES[month]} {year}</div>
                    <button onClick={nextMonth} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,width:38,height:38,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.2rem",color:C.textMid,fontWeight:700,transition:"border-color 0.15s"}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>›</button>
                  </div>
                  {/* Day headers */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"0.25rem",marginBottom:"0.35rem"}}>
                    {DAY_NAMES.map(d=><div key={d} style={{textAlign:"center",fontSize:"0.7rem",fontWeight:700,color:C.textLight,padding:"0.25rem 0"}}>{d}</div>)}
                  </div>
                  {/* Day cells */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"0.25rem",marginBottom:"1.25rem"}}>
                    {cells.map((d,i)=>{
                      if (!d) return <div key={"e"+i}/>;
                      const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                      const dayApts = aptsForDay(d);
                      const isToday = dateStr === today;
                      const isSelected = calendarDaySelected === dateStr;
                      const hasOpen = dayApts.some(a=>!a.done);
                      return (
                        <div key={d} onClick={()=>setCalendarDaySelected(isSelected ? null : dateStr)}
                          style={{
                            borderRadius:9, padding:"0.4rem 0.2rem", textAlign:"center", cursor: dayApts.length?"pointer":"default",
                            background: isSelected ? C.accent : isToday ? C.accentSoft : C.surface,
                            border: `1.5px solid ${isSelected ? C.accent : isToday ? C.accentBorder : C.border}`,
                            minHeight:46, display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"0.25rem",
                            transition:"box-shadow 0.12s",
                          }}
                          onMouseEnter={e=>{ if(dayApts.length&&!isSelected) e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.08)"; }}
                          onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                          <div style={{fontSize:"0.85rem",fontWeight:isToday||isSelected?800:500,color:isSelected?"#fff":isToday?C.accent:C.text}}>{d}</div>
                          {dayApts.length>0 && (
                            <div style={{display:"flex",gap:"0.15rem",justifyContent:"center"}}>
                              {dayApts.slice(0,3).map((a,j)=>(
                                <div key={j} style={{width:6,height:6,borderRadius:"50%",background:isSelected?"rgba(255,255,255,0.9)":a.done?"#a09b94":C.accent}}/>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected day appointments */}
                  {calendarDaySelected && (
                    <div style={{borderTop:`1px solid ${C.border}`,paddingTop:"1.1rem"}}>
                      <div style={{fontSize:"0.9rem",fontWeight:700,color:C.text,marginBottom:"0.85rem"}}>
                        {new Date(calendarDaySelected+"T12:00:00").toLocaleDateString("de-AT",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}
                      </div>
                      {selectedDayApts.length===0
                        ? <div style={{fontSize:"0.9rem",color:C.textLight,textAlign:"center",padding:"1.25rem"}}>Keine Termine an diesem Tag</div>
                        : selectedDayApts.map(apt=>(
                          <div key={apt.id} style={{background:apt.done?C.bg:C.surface,border:`1px solid ${apt.done?C.border:C.accentBorder}`,borderRadius:12,padding:"1rem 1.1rem",marginBottom:"0.65rem",opacity:apt.done?0.65:1}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.5rem"}}>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:"0.95rem",fontWeight:700,textDecoration:apt.done?"line-through":"none",color:apt.done?C.textMid:C.text}}>{apt.title}</div>
                                <div style={{fontSize:"0.83rem",color:C.textMid,marginTop:"0.2rem"}}>{apt.time||"—"} · {apt.sponsorName}</div>
                                <div style={{fontSize:"0.78rem",color:C.textLight}}>{apt.eventName}</div>
                                {apt.notes && <div style={{fontSize:"0.8rem",color:C.textLight,marginTop:"0.25rem"}}>{apt.notes}</div>}
                              </div>
                              <button onClick={()=>toggleAptDone(apt)} style={{background:apt.done?C.bg:"#f0fdf4",color:apt.done?C.textLight:"#16a34a",border:`1px solid ${apt.done?C.border:"#bbf7d0"}`,borderRadius:6,width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginLeft:"0.5rem"}}><Check size={12} strokeWidth={2}/></button>
                            </div>
                            <ExportIcons apt={apt}/>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              )}

              {/* LIST VIEW */}
              {calendarView==="list" && (
                <div>
                  {allApts.length === 0 && (
                    <div style={{textAlign:"center",padding:"3.5rem 1rem",color:C.textLight}}>
                      <div style={{display:"flex",justifyContent:"center",marginBottom:"1rem"}}><CalendarDays size={40} strokeWidth={1.5}/></div>
                      <div style={{fontWeight:700,marginBottom:"0.5rem",color:C.textMid,fontSize:"1rem"}}>Noch keine Termine</div>
                      <div style={{fontSize:"0.9rem",lineHeight:1.5}}>Füge Termine im Sponsor-Bearbeiten-Dialog hinzu.</div>
                    </div>
                  )}
                  {/* Group by date */}
                  {(() => {
                    const grouped = {};
                    allApts.forEach(apt => {
                      if (!grouped[apt.date]) grouped[apt.date] = [];
                      grouped[apt.date].push(apt);
                    });
                    return Object.entries(grouped).map(([dateStr, apts]) => (
                      <div key={dateStr} style={{marginBottom:"1.5rem"}}>
                        <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.75rem"}}>
                          {dateStr===today&&<span style={{background:C.accent,color:"#fff",fontSize:"0.65rem",padding:"0.15rem 0.5rem",borderRadius:99,fontWeight:700}}>HEUTE</span>}
                          <div style={{fontSize:"0.78rem",fontWeight:700,color:C.textMid,letterSpacing:"0.04em"}}>
                            {new Date(dateStr+"T12:00:00").toLocaleDateString("de-AT",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}
                          </div>
                        </div>
                        {apts.map(apt=>(
                          <div key={apt.id} style={{background:apt.done?C.bg:C.surface,border:`1px solid ${apt.done?C.border:C.accentBorder}`,borderRadius:12,marginBottom:"0.65rem",opacity:apt.done?0.65:1,overflow:"hidden"}}>
                            {/* Card header */}
                            <div style={{display:"flex",gap:"0",alignItems:"stretch"}}>
                              {/* Datum-Badge links */}
                              <div style={{width:54,background:apt.done?C.border:C.accent,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0.75rem 0.4rem",flexShrink:0}}>
                                <div style={{fontSize:"1.1rem",fontWeight:800,color:"#fff",lineHeight:1}}>
                                  {new Date(dateStr+"T12:00:00").getDate()}
                                </div>
                                <div style={{fontSize:"0.6rem",fontWeight:700,color:"rgba(255,255,255,0.75)",textTransform:"uppercase",marginTop:"0.15rem"}}>
                                  {MONTH_NAMES[new Date(dateStr+"T12:00:00").getMonth()].slice(0,3)}
                                </div>
                                {apt.time&&<div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.8)",marginTop:"0.25rem",fontWeight:600}}>{apt.time}</div>}
                              </div>
                              {/* Inhalt rechts */}
                              <div style={{flex:1,padding:"0.85rem 1rem",minWidth:0}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontSize:"0.95rem",fontWeight:700,textDecoration:apt.done?"line-through":"none",color:apt.done?C.textMid:C.text,marginBottom:"0.2rem"}}>{apt.title}</div>
                                    <div style={{fontSize:"0.83rem",color:C.textMid,display:"flex",alignItems:"center",gap:"0.4rem",flexWrap:"wrap"}}>
                                      <span style={{display:"flex",alignItems:"center",gap:"0.2rem"}}><Building2 size={11} strokeWidth={1.5}/>{apt.sponsorName}</span>
                                    </div>
                                    <div style={{fontSize:"0.78rem",color:C.textLight,marginTop:"0.1rem"}}>{apt.eventName}</div>
                                    {apt.notes&&<div style={{fontSize:"0.78rem",color:C.textLight,marginTop:"0.2rem"}}>{apt.notes}</div>}
                                  </div>
                                  <button onClick={()=>toggleAptDone(apt)} style={{background:apt.done?C.bg:"#f0fdf4",color:apt.done?C.textLight:"#16a34a",border:`1px solid ${apt.done?C.border:"#bbf7d0"}`,borderRadius:6,padding:"0.3rem 0.55rem",cursor:"pointer",fontSize:"0.75rem",fontWeight:700,display:"flex",alignItems:"center",gap:"0.25rem",flexShrink:0,marginLeft:"0.5rem"}}><Check size={11} strokeWidth={2}/>{apt.done?"Offen":"Erledigt"}</button>
                                </div>
                              </div>
                            </div>
                            {/* Export Icons am Boden */}
                            <div style={{borderTop:`1px solid ${C.border}`,padding:"0.5rem 1rem",background:C.bg}}>
                              <ExportIcons apt={apt}/>
                            </div>
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          );
        })()}

        {/* KI SPONSOR MATCH */}


        {/* KI SPONSOR SUCHE */}
        {page==="ki" && (hasFeature(user?.tier||'free','ai-finder')
          ? <AISponsorSearch proj={proj} C={C} onAdd={(s)=>{
              if (!canAddPipelineContact(user?.tier||'free', proj.pipeline.length)) {
                setShowUpgrade({feature:'maxPipelineContacts',label:'Unbegrenzte Pipeline-Kontakte',requiredTier:'pro'});
                return;
              }
              const pkg = proj.packages.find(p=>p.slots-p.taken>0) || proj.packages[0];
              updProj(p=>({...p,pipeline:[...p.pipeline,{...s,id:newId(),status:"draft",value:pkg?.price||5000,opened:"—",pitchSent:false,package:pkg?.name||"",notes:""}]}));
              notify("Sponsor zur Pipeline hinzugefügt");
              setPage("pipeline");
            }}/>
          : <div style={{textAlign:"center",padding:"3rem 1rem"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:"1rem"}}><Bot size={40} strokeWidth={1.5} color={C.textLight}/></div>
              <div style={{fontWeight:700,fontSize:"1rem",marginBottom:"0.5rem",color:C.textMid}}>KI Sponsor-Finder</div>
              <div style={{fontSize:"0.88rem",color:C.textLight,marginBottom:"1.5rem",lineHeight:1.6}}>Der KI Sponsor-Finder ist im Pro-Tarif verfügbar.</div>
              <button onClick={()=>setShowUpgrade({feature:'ai-finder',label:'KI Sponsor-Finder',requiredTier:'pro'})}
                style={{background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"0.8rem 2rem",fontSize:"0.95rem",fontWeight:700,cursor:"pointer"}}>Upgrade auf Pro →</button>
            </div>
        )}

      {/* BOTTOM NAV */}
      <nav
        aria-label="Hauptnavigation"
        className="sm-bottom-nav"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
          display: "flex",
          zIndex: 50,
          boxShadow: "0 -1px 0 rgba(0,0,0,0.04), 0 -4px 16px rgba(0,0,0,0.06)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {TABS.map(tab => {
          const isActive = page === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className="sm-tab-btn"
              onClick={() => {
                if (tab.id === 'calendar' && !hasFeature(user?.tier || 'free', 'calendar')) {
                  setShowUpgrade({ feature: 'calendar', label: 'Kalender-Integration', requiredTier: 'pro' });
                  return;
                }
                setPage(tab.id);
                if (tab.id !== "packages") setSelectedPkgId(null);
              }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.65rem 0.25rem 0.55rem",
                background: isActive ? `${C.accent}0d` : "transparent",
                border: "none",
                cursor: "pointer",
                gap: "0.2rem",
                transition: "background 0.15s ease",
                minWidth: 0,
              }}
            >
              <tab.Icon
                size={20}
                strokeWidth={isActive ? 2.25 : 1.5}
                style={{ color: isActive ? C.accent : C.textLight, flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? C.accent : C.textLight,
                  lineHeight: 1,
                  letterSpacing: isActive ? "0.01em" : "0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {tab.label}
              </span>
              {isActive && (
                <div
                  className="sm-tab-active-bar"
                  style={{ background: C.accent }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
