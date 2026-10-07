import { NextResponse } from "next/server";
import { miaAgent } from "@/lib/ai/mia-agent";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { message, mode, practiceContext } = body || {};
    const reply = await miaAgent.respond(String(message || ""), mode || "free", practiceContext);
    return NextResponse.json(reply, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error procesando pregunta" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "MIA Educational Companion API" });
}
