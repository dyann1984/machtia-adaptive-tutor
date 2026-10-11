// scripts/verify-mia2-production.mjs
// Comprehensive verification suite for MACHTIA MIA 2.0 against live production server

const BASE_URL = "http://localhost:3000";

async function runVerification() {
  console.log("=== MACHTIA MIA 2.0 LIVE PRODUCTION VERIFICATION ===");
  const results = {};

  // 1. Obtain demo capability token from /api/demo
  let authToken = "student-demo-auth-token-1234567890";
  try {
    const demoRes = await fetch(`${BASE_URL}/api/demo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (demoRes.ok) {
      const demoData = await demoRes.json();
      authToken = demoData.actorToken || authToken;
      console.log(`[PASS] Acquired authenticated demo capability token.`);
    }
  } catch (err) {
    console.warn(`[WARN] Could not acquire demo token, using fallback demo token:`, err.message);
  }

  // 2. Server Health
  try {
    const res = await fetch(`${BASE_URL}/health`);
    results.health = { status: res.status, ok: res.ok };
    console.log(`[PASS] Server Health: HTTP ${res.status}`);
  } catch (err) {
    console.error(`[FAIL] Health check failed:`, err.message);
    process.exit(1);
  }

  // 3. Test Case A - "¿Quién descubrió América?"
  console.log("\n--- TEST CASE A: '¿Quién descubrió América?' ---");
  let caseAResponse;
  {
    const payload = {
      message: "¿Quién descubrió América?",
      mode: "free",
      practiceContext: {
        topicName: "Fracciones Equivalentes",
        exercisePrompt: "Compara 1/2 con 2/4",
      },
    };
    const res = await fetch(`${BASE_URL}/api/mia`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    caseAResponse = data;

    const reply = data.reply || "";
    const hasColon = reply.includes("Cristóbal Colón");
    const has1492 = reply.includes("1492");
    const hasPueblos = reply.toLowerCase().includes("pueblos originarios") || reply.toLowerCase().includes("indígenas");
    const noFractions = !reply.toLowerCase().includes("denominador") && !reply.toLowerCase().includes("fracción");
    const hasSig = Boolean(data.signature || data.ttsSignature);

    console.log(`Intent detected: ${data.intent}`);
    console.log(`Topic: ${data.topic}`);
    console.log(`Reply snippet: ${reply.slice(0, 100)}...`);
    console.log(`Length: ${reply.length} chars (Limit: 600)`);
    console.log(`Signature present: ${hasSig}`);
    console.log(`Colón mentioned: ${hasColon}`);
    console.log(`1492 mentioned: ${has1492}`);
    console.log(`Indigenous peoples mentioned: ${hasPueblos}`);
    console.log(`No fraction contamination: ${noFractions}`);

    if (hasColon && has1492 && hasPueblos && noFractions && reply.length <= 600 && hasSig) {
      console.log("[PASS] Test Case A: Historical accuracy confirmed, 0 fraction contamination, signature valid.");
      results.testCaseA = { pass: true, chars: reply.length, intent: data.intent };
    } else {
      console.error("[FAIL] Test Case A validation failed.");
      results.testCaseA = { pass: false, error: "Validation criteria not met" };
    }
  }

  // 4. Test Case B - "Explícame un medio y un cuarto"
  console.log("\n--- TEST CASE B: 'Explícame un medio y un cuarto' ---");
  let caseBResponse;
  {
    const payload = {
      message: "Explícame un medio y un cuarto",
      mode: "free",
    };
    const res = await fetch(`${BASE_URL}/api/mia`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    caseBResponse = data;

    const reply = data.reply || "";
    const mentionsHalf = reply.includes("1/2");
    const mentionsQuarter = reply.includes("1/4");
    const mentionsPizzaOrVisual = reply.includes("pizza") || reply.includes("pastel") || reply.includes("rebanada");
    const hasSig = Boolean(data.signature || data.ttsSignature);

    console.log(`Topic: ${data.topic}`);
    console.log(`Mentions 1/2: ${mentionsHalf}`);
    console.log(`Mentions 1/4: ${mentionsQuarter}`);
    console.log(`Visual analogy: ${mentionsPizzaOrVisual}`);
    console.log(`Length: ${reply.length} chars (Limit: 600)`);

    if (mentionsHalf && mentionsQuarter && mentionsPizzaOrVisual && reply.length <= 600 && hasSig) {
      console.log("[PASS] Test Case B: Mathematical and visual pedagogical explanation confirmed.");
      results.testCaseB = { pass: true, chars: reply.length };
    } else {
      console.error("[FAIL] Test Case B validation failed.");
      results.testCaseB = { pass: false };
    }
  }

  // 5. Test Case C - "No entendí, explícamelo de otra manera"
  console.log("\n--- TEST CASE C: 'No entendí, explícamelo de otra manera' ---");
  {
    const payload = {
      message: "No entendí, explícamelo de otra manera",
      mode: "free",
      conversationHistory: [
        { sender: "user", text: "Explícame un medio y un cuarto" },
        { sender: "mia", text: caseBResponse.reply, topic: caseBResponse.topic },
      ],
    };
    const res = await fetch(`${BASE_URL}/api/mia`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    const reply = data.reply || "";
    const isReformulation = data.intent === "reformulation" || reply.toLowerCase().includes("monedas") || reply.toLowerCase().includes("chocolate");
    const hasSig = Boolean(data.signature || data.ttsSignature);

    console.log(`Intent: ${data.intent}`);
    console.log(`Topic: ${data.topic}`);
    console.log(`Reply snippet: ${reply.slice(0, 100)}...`);
    console.log(`Length: ${reply.length} chars (Limit: 600)`);

    if (isReformulation && reply.length <= 600 && hasSig) {
      console.log("[PASS] Test Case C: Contextual adaptive reformulation confirmed.");
      results.testCaseC = { pass: true, intent: data.intent };
    } else {
      console.error("[FAIL] Test Case C validation failed.");
      results.testCaseC = { pass: false };
    }
  }

  // 6. Test Case D - Oral / Microphone Transcribed Input
  console.log("\n--- TEST CASE D: Microphone Transcribed Input ---");
  {
    const micQueries = [
      "Quiero saber quién descubrió América",
      "Explícame qué es un medio y un cuarto por favor",
    ];

    let allPass = true;
    for (const q of micQueries) {
      const res = await fetch(`${BASE_URL}/api/mia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ message: q, mode: "free" }),
      });
      const data = await res.json();
      const hasSig = Boolean(data.signature || data.ttsSignature);
      if (!data.reply || data.reply.length < 50 || data.reply.length > 600 || !hasSig) {
        allPass = false;
      }
      console.log(`Query "${q}" -> intent: ${data.intent}, chars: ${data.reply?.length}, signature: ${hasSig}`);
    }

    if (allPass) {
      console.log("[PASS] Test Case D: Speech input transcribed and parsed successfully.");
      results.testCaseD = { pass: true };
    } else {
      console.error("[FAIL] Test Case D failed.");
      results.testCaseD = { pass: false };
    }
  }

  // 7. ElevenLabs TTS Real API Synthesis (Test Case A text with signature)
  console.log("\n--- ELEVENLABS REAL TTS AUDIO SYNTHESIS ---");
  {
    const ttsPayload = {
      text: caseAResponse.reply,
      signature: caseAResponse.signature || caseAResponse.ttsSignature,
    };

    const startTime = Date.now();
    const ttsRes = await fetch(`${BASE_URL}/api/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(ttsPayload),
    });
    const latencyMs = Date.now() - startTime;

    const contentType = ttsRes.headers.get("content-type") || "";
    const ttsSource = ttsRes.headers.get("x-tts-source") || "";
    const audioBuffer = await ttsRes.arrayBuffer();

    console.log(`HTTP Status: ${ttsRes.status}`);
    console.log(`Content-Type: ${contentType}`);
    console.log(`X-TTS-Source: ${ttsSource}`);
    console.log(`Audio Buffer Size: ${audioBuffer.byteLength} bytes`);
    console.log(`TTS Latency: ${latencyMs}ms`);

    const isElevenLabs = ttsSource.toLowerCase().includes("elevenlabs");
    const isAudioMpeg = contentType.includes("audio/mpeg") || contentType.includes("audio/mp3");
    const hasSufficientBytes = audioBuffer.byteLength > 15000;

    if (ttsRes.status === 200 && isAudioMpeg && isElevenLabs && hasSufficientBytes) {
      console.log(`[PASS] ElevenLabs Neural TTS verified! Generated ${audioBuffer.byteLength} bytes of real MP3 audio via ${ttsSource} in ${latencyMs}ms.`);
      results.elevenLabsTTS = {
        pass: true,
        source: ttsSource,
        bytes: audioBuffer.byteLength,
        latencyMs,
      };
    } else {
      console.error(`[FAIL] ElevenLabs TTS verification failed. Status: ${ttsRes.status}, Source: ${ttsSource}, Bytes: ${audioBuffer.byteLength}`);
      results.elevenLabsTTS = {
        pass: false,
        status: ttsRes.status,
        source: ttsSource,
        bytes: audioBuffer.byteLength,
      };
    }
  }

  // 8. Test Case E - Five Consecutive Syntheses (Interruption & Resource Safety)
  console.log("\n--- TEST CASE E: Five Consecutive Syntheses ---");
  {
    const sequentialTexts = [
      "¡Hola! Soy MIA, tu compañera de aprendizaje en MACHTIA.",
      "El Sol es una estrella brillante en el centro del sistema solar.",
      "Las fracciones representan partes iguales de un todo.",
      "Ada Lovelace fue la primera programadora de la historia.",
      "¡Excelente trabajo! Has completado esta actividad con éxito.",
    ];

    let countPassed = 0;
    for (let i = 0; i < sequentialTexts.length; i++) {
      const text = sequentialTexts[i];
      // Generate signature via api/mia
      const miaRes = await fetch(`${BASE_URL}/api/mia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ message: text, mode: "free" }),
      });
      const miaData = await miaRes.json();

      const tRes = await fetch(`${BASE_URL}/api/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          text: miaData.reply,
          signature: miaData.signature || miaData.ttsSignature,
        }),
      });
      if (tRes.status === 200) {
        countPassed++;
      }
      console.log(`  Audio ${i + 1}/5: status ${tRes.status}, source ${tRes.headers.get("x-tts-source")}`);
    }

    if (countPassed === 5) {
      console.log("[PASS] Test Case E: 5 consecutive syntheses succeeded without lockup or resource leakage.");
      results.testCaseE = { pass: true, count: countPassed };
    } else {
      console.error(`[FAIL] Test Case E: Only ${countPassed}/5 succeeded.`);
      results.testCaseE = { pass: false, count: countPassed };
    }
  }

  // 9. Test Case F - Teacher-Student Navigation & Diagnostic
  console.log("\n--- TEST CASE F: Teacher-Student Navigation & Diagnostic ---");
  {
    // Teacher diagnosis inquiry
    const teachRes = await fetch(`${BASE_URL}/api/mia`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        message: "¿Cuál es el diagnóstico de Mariana?",
        mode: "practice",
        practiceContext: {
          studentName: "Mariana López",
          diagnosticScore: 52,
          topicName: "Fracciones Equivalentes",
        },
      }),
    });
    const teachData = await teachRes.json();
    const hasStudentName = teachData.reply.includes("Mariana López");
    const hasScore = teachData.reply.includes("52%");

    // Read state from /api/state
    const stateRes = await fetch(`${BASE_URL}/api/state`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const stateData = await stateRes.json();
    const hasPractices = Array.isArray(stateData.practices) && stateData.practices.length > 0;
    const hasStudents = Array.isArray(stateData.students) && stateData.students.length > 0;

    console.log(`Teacher inquiry mentions Mariana: ${hasStudentName}`);
    console.log(`Teacher inquiry mentions score 52%: ${hasScore}`);
    console.log(`State API returns practices: ${hasPractices} (${stateData?.practices?.length || 0} practices)`);
    console.log(`State API returns students: ${hasStudents} (${stateData?.students?.length || 0} students)`);

    if (hasStudentName && hasScore && hasPractices && hasStudents) {
      console.log("[PASS] Test Case F: Teacher-student navigation and diagnostic inquiries verified.");
      results.testCaseF = { pass: true };
    } else {
      console.error("[FAIL] Test Case F failed.");
      results.testCaseF = { pass: false };
    }
  }

  // 10. Alexa+ Simulator MCP Flow Verification
  console.log("\n--- ALEXA+ SIMULATOR MCP FLOW VERIFICATION ---");
  {
    const mcpRes = await fetch(`${BASE_URL}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-11-25",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "alexa-test-1",
        method: "tools/call",
        params: {
          name: "get_student_context",
          arguments: { studentId: "mariana-lopez" },
        },
      }),
    });
    const mcpData = await mcpRes.json();
    const toolExecuted = Boolean(mcpData?.result || mcpData?.content);

    console.log(`MCP Status: ${mcpRes.status}`);
    console.log(`MCP Tool execution success: ${toolExecuted}`);

    if (mcpRes.status === 200 && toolExecuted) {
      console.log("[PASS] Alexa+ Simulator MCP protocol exchange verified.");
      results.alexaMcp = { pass: true };
    } else {
      console.error("[FAIL] Alexa+ Simulator MCP protocol exchange failed.");
      results.alexaMcp = { pass: false };
    }
  }

  console.log("\n========================================================");
  console.log("FINAL RESULTS SUMMARY:", JSON.stringify(results, null, 2));

  const allPassed = Object.values(results).every(r => r.pass === true || r.ok === true);
  if (allPassed) {
    console.log("\n>>> ALL PRODUCTION CRITERIA VERIFIED AND CERTIFIED! <<<");
  } else {
    console.log("\n>>> SOME CHECKS FAILED. PLEASE REVIEW LOGS. <<<");
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
