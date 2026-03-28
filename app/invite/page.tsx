"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const loadingStyle = {
  minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
  background: "#f8f7f4", fontFamily: "'Helvetica Neue',sans-serif", padding: "2rem",
};

function InviteContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [invite, setInvite] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setError("Ungültiger Einladungslink."); return; }
    fetch(`/api/team/invite?token=${token}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setInvite(d); })
      .catch(() => setError("Fehler beim Laden der Einladung."));
  }, [token]);

  const style = loadingStyle;

  if (error) return (
    <div style={style}>
      <div style={{textAlign:"center",maxWidth:400}}>
        <div style={{fontSize:"2rem",marginBottom:"1rem"}}>⚠️</div>
        <div style={{fontSize:"1rem",fontWeight:700,marginBottom:"0.5rem"}}>Ungültige Einladung</div>
        <div style={{color:"#6b6560",marginBottom:"1.5rem"}}>{error}</div>
        <a href="/" style={{color:"#e8500a",fontWeight:600}}>Zur Startseite</a>
      </div>
    </div>
  );

  if (!invite) return (
    <div style={style}>
      <div style={{color:"#6b6560"}}>Einladung wird geladen…</div>
    </div>
  );

  return (
    <div style={style}>
      <div style={{background:"#fff",borderRadius:16,padding:"2.5rem",maxWidth:420,width:"100%",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",textAlign:"center"}}>
        <div style={{width:56,height:56,background:"#fff3ed",border:"2px solid #fbd5c5",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1.5rem",fontSize:"1.5rem"}}>🤝</div>
        <div style={{fontSize:"1.2rem",fontWeight:800,marginBottom:"0.5rem",fontFamily:"Georgia,serif"}}>Du wurdest eingeladen</div>
        <div style={{color:"#6b6560",marginBottom:"0.35rem",fontSize:"0.95rem"}}>
          Tritt der Organisation <strong style={{color:"#1a1814"}}>{invite.orgName}</strong> bei
        </div>
        <div style={{color:"#9b9690",fontSize:"0.82rem",marginBottom:"2rem"}}>
          Eingeladen von {invite.invitedByName}
        </div>
        <a
          href={`/?invite=${token}`}
          style={{display:"block",background:"#e8500a",color:"#fff",textDecoration:"none",borderRadius:12,padding:"0.95rem",fontSize:"0.95rem",fontWeight:700}}
        >
          Jetzt registrieren &amp; beitreten
        </a>
        <div style={{marginTop:"1rem",fontSize:"0.8rem",color:"#9b9690"}}>
          Bereits ein Konto? <a href={`/?invite=${token}`} style={{color:"#e8500a",fontWeight:600}}>Einloggen</a>
        </div>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div style={loadingStyle}><div style={{color:"#6b6560"}}>Einladung wird geladen…</div></div>}>
      <InviteContent />
    </Suspense>
  );
}
