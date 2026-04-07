import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const MIME_MAP: Record<string, string> = {
  mp4: "video/mp4", mov: "video/quicktime", avi: "video/x-msvideo",
  webm: "video/webm", mkv: "video/x-matroska", wmv: "video/x-ms-wmv",
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  svg: "image/svg+xml", gif: "image/gif", webp: "image/webp",
  pdf: "application/pdf", zip: "application/zip",
  ai: "application/postscript", eps: "application/postscript",
};

function resolveMime(file: File): string {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_MAP[ext] ?? "application/octet-stream";
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const uid = form.get("uid") as string;
    const eventId = form.get("eventId") as string;
    const sponsorId = form.get("sponsorId") as string;
    const type = (form.get("type") as string) || "file";

    if (!file || !uid || !eventId || !sponsorId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}-${safeName}`;
    const path = `${uid}/${eventId}/sponsor-materials/${sponsorId}/${type}/${filename}`;
    const contentType = resolveMime(file);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error } = await supabaseAdmin.storage
      .from("events")
      .upload(path, buffer, { contentType, upsert: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data } = supabaseAdmin.storage.from("events").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
