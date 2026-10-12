import { NextResponse } from "next/server";
import { translateText, detectLanguage } from "@/lib/translation/translator-service";
import { generateDidacticSignature } from "@/lib/tts/signature";
import { authenticate } from "@/mcp/server/session";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const sourceLang = body?.sourceLang || "auto";
    const targetLang = body?.targetLang;

    if (!text) {
      return NextResponse.json(
        { error: "Texto requerido para traducción." },
        { status: 400 }
      );
    }

    if (text.length > 500) {
      return NextResponse.json(
        { error: "El texto excede el límite máximo de 500 caracteres para traducción escolar." },
        { status: 400 }
      );
    }

    // Resolve authenticated actor identity for didactic signature
    const authHeader = req.headers.get("authorization") || req.headers.get("x-demo-control");
    let actorId = "student-mariana-1";
    if (authHeader) {
      const cleanToken = authHeader.replace(/^Bearer\s+/i, "").trim();
      const trusted = authenticate(cleanToken);
      if (trusted) {
        actorId = trusted.id;
      }
    }

    const result = await translateText({
      text,
      sourceLang,
      targetLang,
    });

    // Generate cryptographic didactic signature for TTS playback of the translation
    const ttsSignature = generateDidacticSignature(result.translatedText, actorId);
    const sourceTtsSignature = generateDidacticSignature(result.originalText, actorId);

    return NextResponse.json(
      {
        ...result,
        ttsSignature,
        sourceTtsSignature,
        signature: ttsSignature,
        boundActorId: actorId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error procesando traducción." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "MIA Bilingual Neural Translator 3.0",
    supportedLanguages: ["es", "en"],
    features: [
      "Auto language detection",
      "Bidirectional ES <-> EN",
      "Cryptographic Didactic Signature for TTS",
      "Offline lexical fallback",
    ],
  });
}
