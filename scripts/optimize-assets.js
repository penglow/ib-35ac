// Asset optimization script — converts PNG backgrounds and GIF sprites to WebP/APNG.
// Requires one of: ImageMagick (`magick`), `cwebp` + `gif2webp`, or `ffmpeg`.
//
// Usage:
//   node scripts/optimize-assets.js --dry-run       List savings without converting
//   node scripts/optimize-assets.js --png-to-webp    Convert PNG backgrounds to WebP
//   node scripts/optimize-assets.js --gif-to-webp    Convert GIF sprites to animated WebP
//   node scripts/optimize-assets.js --all             Convert everything (creates .webp copies)

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");

function findFiles(dir, ext) {
  const results = [];
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.toLowerCase().endsWith(ext)) results.push(full);
    }
  }
  if (fs.existsSync(dir)) walk(dir);
  return results;
}

function formatMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function hasTool(name) {
  try { execSync(`where ${name} 2>nul || which ${name} 2>/dev/null || echo ""`, { stdio: "pipe" }); return true; } catch { return false; }
}

function dryRun() {
  const pngBg = findFiles(path.join(ROOT, "assets", "backgrounds"), ".png");
  const gifSprites = [
    ...findFiles(path.join(ROOT, "assets", "sprites", "ani"), ".gif"),
    ...findFiles(path.join(ROOT, "assets", "sprites", "ani-back"), ".gif"),
  ];

  const pngTotal = pngBg.reduce((s, f) => s + fs.statSync(f).size, 0);
  const gifTotal = gifSprites.reduce((s, f) => s + fs.statSync(f).size, 0);

  console.log("=== Asset Size Report ===");
  console.log(`Background PNGs: ${pngBg.length} files, ${formatMB(pngTotal)}`);
  console.log(`  Estimated WebP savings: ~${formatMB(pngTotal * 0.6)} (60%)`);
  console.log(`Sprite GIFs:     ${gifSprites.length} files, ${formatMB(gifTotal)}`);
  console.log(`  Estimated WebP savings: ~${formatMB(gifTotal * 0.4)} (40%)`);
  console.log(`Total potential savings: ~${formatMB(pngTotal * 0.6 + gifTotal * 0.4)}`);

  // Top 10 largest files
  console.log("\n=== Top 10 Largest Assets ===");
  const all = [
    ...pngBg.map((f) => ({ file: path.relative(ROOT, f), size: fs.statSync(f).size })),
    ...gifSprites.map((f) => ({ file: path.relative(ROOT, f), size: fs.statSync(f).size })),
  ];
  all.sort((a, b) => b.size - a.size);
  all.slice(0, 10).forEach(({ file, size }) => {
    console.log(`  ${formatMB(size).padStart(8)}  ${file}`);
  });
}

function convertPNGtoWebP() {
  if (!hasTool("cwebp") && !hasTool("magick")) {
    console.error("Neither cwebp nor ImageMagick found. Install one:");
    console.error("  choco install imagemagick   (Windows)");
    console.error("  brew install webp           (macOS)");
    process.exit(1);
  }
  const files = findFiles(path.join(ROOT, "assets", "backgrounds"), ".png");
  let saved = 0;
  for (const file of files) {
    const out = file.replace(/\.png$/i, ".webp");
    const before = fs.statSync(file).size;
    try {
      if (hasTool("cwebp")) {
        execSync(`cwebp -q 80 "${file}" -o "${out}"`, { stdio: "pipe" });
      } else {
        execSync(`magick "${file}" -quality 80 "${out}"`, { stdio: "pipe" });
      }
      const after = fs.statSync(out).size;
      saved += before - after;
      console.log(`${path.basename(file)}: ${formatMB(before)} → ${formatMB(after)} (${((1 - after/before) * 100).toFixed(0)}%)`);
    } catch (e) {
      console.error(`Failed: ${file}: ${e.message}`);
    }
  }
  console.log(`\nTotal saved: ${formatMB(saved)}`);
  console.log("\nNOTE: Update index.html CSS background-url() references to .webp or keep .png as fallback.");
}

function convertGIFtoWebP() {
  if (!hasTool("gif2webp") && !hasTool("magick")) {
    console.error("Neither gif2webp nor ImageMagick found.");
    process.exit(1);
  }
  for (const dir of ["ani", "ani-back"]) {
    const files = findFiles(path.join(ROOT, "assets", "sprites", dir), ".gif");
    let saved = 0;
    for (const file of files) {
      const out = file.replace(/\.gif$/i, ".webp");
      const before = fs.statSync(file).size;
      try {
        if (hasTool("gif2webp")) {
          execSync(`gif2webp -q 80 "${file}" -o "${out}"`, { stdio: "pipe" });
        } else {
          execSync(`magick "${file}" -quality 80 "${out}"`, { stdio: "pipe" });
        }
        const after = fs.statSync(out).size;
        saved += before - after;
        console.log(`${path.basename(file)}: ${formatMB(before)} → ${formatMB(after)}`);
      } catch (e) {
        console.error(`Failed: ${file}: ${e.message}`);
      }
    }
    console.log(`${dir}: saved ${formatMB(saved)}`);
  }
  console.log("\nNOTE: Update SP/SPB constants in js/data.js to use .webp extension.");
}

const arg = process.argv[2] || "--dry-run";
if (arg === "--dry-run") dryRun();
else if (arg === "--png-to-webp") convertPNGtoWebP();
else if (arg === "--gif-to-webp") convertGIFtoWebP();
else if (arg === "--all") { convertPNGtoWebP(); convertGIFtoWebP(); }
else console.log("Usage: node scripts/optimize-assets.js [--dry-run|--png-to-webp|--gif-to-webp|--all]");
