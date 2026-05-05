const fs = require("fs");
const path = require("path");

const [inputArg, secondsArg, outputArg] = process.argv.slice(2);

if (!inputArg || !secondsArg) {
  console.error("Usage: node scripts/trim-mp3.js <input.mp3> <seconds> [output.mp3]");
  process.exit(1);
}

const inputPath = path.resolve(inputArg);
const outputPath = path.resolve(outputArg || inputArg);
const targetSeconds = Number(secondsArg);

if (!Number.isFinite(targetSeconds) || targetSeconds <= 0) {
  console.error("Seconds must be a positive number.");
  process.exit(1);
}

const data = fs.readFileSync(inputPath);

function syncSafeSize(offset) {
  return (
    ((data[offset] & 0x7f) << 21) |
    ((data[offset + 1] & 0x7f) << 14) |
    ((data[offset + 2] & 0x7f) << 7) |
    (data[offset + 3] & 0x7f)
  );
}

function id3v2EndOffset() {
  if (data.length < 10 || data.toString("latin1", 0, 3) !== "ID3") return 0;
  const flags = data[5];
  const hasFooter = (flags & 0x10) !== 0;
  return 10 + syncSafeSize(6) + (hasFooter ? 10 : 0);
}

const bitrateKbps = {
  "1-I": [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
  "1-II": [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
  "1-III": [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  "2-I": [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
  "2-II": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  "2-III": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
};

const sampleRates = {
  1: [44100, 48000, 32000],
  2: [22050, 24000, 16000],
  2.5: [11025, 12000, 8000],
};

function parseFrame(offset) {
  if (offset + 4 > data.length) return null;
  const b0 = data[offset];
  const b1 = data[offset + 1];
  const b2 = data[offset + 2];
  const b3 = data[offset + 3];
  if (b0 !== 0xff || (b1 & 0xe0) !== 0xe0) return null;

  const versionBits = (b1 >> 3) & 0x03;
  const layerBits = (b1 >> 1) & 0x03;
  const bitrateIndex = (b2 >> 4) & 0x0f;
  const sampleRateIndex = (b2 >> 2) & 0x03;
  const padding = (b2 >> 1) & 0x01;

  if (versionBits === 1 || layerBits === 0 || bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) {
    return null;
  }

  const version = versionBits === 3 ? 1 : versionBits === 2 ? 2 : 2.5;
  const layer = layerBits === 3 ? "I" : layerBits === 2 ? "II" : "III";
  const bitrateKey = `${version === 1 ? 1 : 2}-${layer}`;
  const bitrate = bitrateKbps[bitrateKey][bitrateIndex] * 1000;
  const sampleRate = sampleRates[version][sampleRateIndex];
  if (!bitrate || !sampleRate) return null;

  let frameLength;
  let samples;
  if (layer === "I") {
    frameLength = Math.floor(((12 * bitrate) / sampleRate + padding) * 4);
    samples = 384;
  } else if (layer === "III" && version !== 1) {
    frameLength = Math.floor((72 * bitrate) / sampleRate + padding);
    samples = 576;
  } else {
    frameLength = Math.floor((144 * bitrate) / sampleRate + padding);
    samples = 1152;
  }

  if (frameLength <= 4 || offset + frameLength > data.length) return null;
  return {
    frameLength,
    durationSeconds: samples / sampleRate,
  };
}

let offset = id3v2EndOffset();
let firstFrameOffset = -1;
let endOffset = offset;
let duration = 0;

while (offset < data.length - 4 && duration < targetSeconds) {
  const frame = parseFrame(offset);
  if (!frame) {
    offset++;
    continue;
  }
  if (firstFrameOffset < 0) firstFrameOffset = offset;
  duration += frame.durationSeconds;
  offset += frame.frameLength;
  endOffset = offset;
}

if (firstFrameOffset < 0 || endOffset <= firstFrameOffset) {
  console.error("No MP3 frames were found.");
  process.exit(1);
}

const trimmed = data.subarray(0, endOffset);
const tempPath = outputPath === inputPath ? `${outputPath}.tmp` : outputPath;
fs.writeFileSync(tempPath, trimmed);
if (tempPath !== outputPath) fs.renameSync(tempPath, outputPath);

console.log(
  `Wrote ${path.relative(process.cwd(), outputPath)} (${duration.toFixed(1)}s, ${trimmed.length} bytes).`,
);
