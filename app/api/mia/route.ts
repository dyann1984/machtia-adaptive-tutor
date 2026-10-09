import { NextResponse } from "next/server";
import { miaAgent } from "@/lib/ai/mia-agent";
import { generateDidacticSignature } from "@/lib/tts/signature";
import { authenticate } from "@/mcp/server/session";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { message, mode, practiceContext } = body || {};

    // 1. Actor resolution for signature binding
    const authHeader = req.headers.get("authorization") || req.headers.get("x-demo-control");
    let actorId = "student-mariana-1"; // Default official demo student
    if (authHeader) {
      const cleanToken = authHeader.replace(/^Bearer\s+/i, "").trim();
      const trusted = authenticate(cleanToken);
      if (trusted) {
        actorId = trusted.id;
      }
    } else if (practiceContext?.studentId) {
      actorId = String(practiceContext.studentId);
    }

    const reply = await miaAgent.respond(String(message || ""), mode || "free", practiceContext);
    const ttsSignature = generateDidacticSignature(reply.reply, actorId);
    return NextResponse.json({ ...reply, ttsSignature, boundActorId: actorId }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error procesando pregunta" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "MIA Educational Companion API" });
}
