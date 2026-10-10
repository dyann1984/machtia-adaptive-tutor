async function monitor() {
  const targetCommit = "ddfaceb";
  console.log("Monitoring Render deployment for commit:", targetCommit);
  const start = Date.now();
  const maxWaitMs = 5 * 60 * 1000; // 5 minutes max

  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetch("https://machtia-tutor-mcp-server.onrender.com/health", {
        headers: { "Cache-Control": "no-cache" }
      });
      if (res.ok) {
        const data = await res.json();
        const liveCommit = String(data.commit || "");
        console.log(`[${new Date().toLocaleTimeString()}] Live commit: ${liveCommit.slice(0, 7)} (Target: ${targetCommit})`);
        if (liveCommit.toLowerCase().startsWith(targetCommit.toLowerCase())) {
          console.log("🎉 Deployed commit is LIVE in production!");
          process.exit(0);
        }
      } else {
        console.log(`[${new Date().toLocaleTimeString()}] Status: ${res.status}`);
      }
    } catch (err) {
      console.log(`[${new Date().toLocaleTimeString()}] Waiting (Server building or restarting): ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 12000));
  }

  console.log("Timed out waiting for deployment to report commit. Continuing to verification.");
  process.exit(0);
}

monitor();
