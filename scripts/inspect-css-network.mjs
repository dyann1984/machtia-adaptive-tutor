async function check() {
  try {
    const res = await fetch("http://localhost:3000/?demo=judge");
    console.log("Status:", res.status);
    const html = await res.text();
    console.log("HTML length:", html.length);
    
    // Find all link tags
    const links = html.match(/<link[^>]+>/g) || [];
    console.log("\nFound link tags (" + links.length + "):");
    links.forEach(l => console.log(" ", l));

    // Find all style tags
    const styles = html.match(/<style[^>]*>[\s\S]*?<\/style>/g) || [];
    console.log("\nFound style tags (" + styles.length + ")");
    styles.forEach((s, idx) => console.log(`  Style tag ${idx}: length ${s.length}, snippet: ${s.substring(0, 80)}...`));

    // Check each CSS link
    const cssHrefs = [];
    for (const l of links) {
      const match = l.match(/href=["']([^"']+\.css[^"']*)["']/);
      if (match) cssHrefs.push(match[1]);
    }
    console.log("\nCSS Hrefs found:", cssHrefs);

    for (const href of cssHrefs) {
      const url = href.startsWith("http") ? href : `http://localhost:3000${href}`;
      const cssRes = await fetch(url);
      console.log(`\nFetching ${url}:`);
      console.log("  Status:", cssRes.status);
      console.log("  Content-Type:", cssRes.headers.get("content-type"));
      const cssText = await cssRes.text();
      console.log("  Length:", cssText.length);
      console.log("  Contains @tailwind:", cssText.includes("@tailwind"));
      console.log("  Contains bg-slate:", cssText.includes("bg-slate"));
      console.log("  Contains flex:", cssText.includes("flex"));
      console.log("  First 200 chars:\n  ", cssText.substring(0, 200).replace(/\n/g, " "));
    }
  } catch (err) {
    console.error("Error inspecting:", err);
  }
}

check();
