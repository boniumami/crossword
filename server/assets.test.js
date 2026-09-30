const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { SEED_IMAGE_FILES, SEED_MUSIC_FILES } = require("./db");

const ROOT = path.join(__dirname, "..");
const IMG_DIR = path.join(ROOT, "seed-assets", "images");
const MUS_DIR = path.join(ROOT, "seed-assets", "music");

function inspectGif(buf) {
  const header = buf.toString("ascii", 0, 6);
  assert.ok(header === "GIF89a" || header === "GIF87a", "need a GIF header");
  const width = buf.readUInt16LE(6);
  const height = buf.readUInt16LE(8);
  let i = 13;
  const packed = buf[10];
  if (packed & 0x80) i += 3 * 2 ** ((packed & 7) + 1);
  let loop = null;
  const delays = [];
  while (i < buf.length) {
    const b = buf[i];
    if (b === 0x3b) break;
    if (b === 0x2c) {
      i += 10;
      const localPacked = buf[i - 1];
      if (localPacked & 0x80) i += 3 * 2 ** ((localPacked & 7) + 1);
      i += 1;
      while (buf[i] !== 0) i += buf[i] + 1;
      i += 1;
      continue;
    }
    if (b === 0x21) {
      const label = buf[i + 1];
      if (label === 0xf9) {
        delays.push(buf.readUInt16LE(i + 4) * 10);
        i += 8;
        continue;
      }
      if (label === 0xff) {
        const blockSize = buf[i + 2];
        const app = buf.toString("ascii", i + 3, i + 3 + blockSize);
        let j = i + 3 + blockSize;
        if (app.startsWith("NETSCAPE") && buf[j] >= 3 && buf[j + 1] === 1) {
          loop = buf.readUInt16LE(j + 2);
        }
        while (buf[j] !== 0) j += buf[j] + 1;
        i = j + 1;
        continue;
      }
      let j = i + 2;
      while (buf[j] !== 0) j += buf[j] + 1;
      i = j + 1;
      continue;
    }
    throw new Error(`unexpected GIF block at ${i}`);
  }
  return { width, height, frames: delays.length, delays, loop };
}

function inspectWav(buf) {
  assert.equal(buf.toString("ascii", 0, 4), "RIFF");
  const channels = buf.readUInt16LE(22);
  const rate = buf.readUInt32LE(24);
  const bits = buf.readUInt16LE(34);
  let offset = 12;
  let dataSize = 0;
  let dataStart = 0;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "data") {
      dataSize = size;
      dataStart = offset + 8;
      break;
    }
    offset += 8 + size + (size % 2);
  }
  const duration = dataSize / (rate * channels * (bits / 8));
  let peak = 0;
  if (bits === 16 && dataStart) {
    const samples = dataSize / 2;
    for (let n = 0; n < samples; n += 64) {
      peak = Math.max(peak, Math.abs(buf.readInt16LE(dataStart + n * 2)));
    }
  }
  return { channels, rate, bits, duration, peak };
}

for (const name of SEED_IMAGE_FILES) {
  test(`seed gif ${name} meets atmosphere specs`, () => {
    const info = inspectGif(fs.readFileSync(path.join(IMG_DIR, name)));
    assert.ok(info.width >= 1280, `${name} width ${info.width}`);
    assert.ok(info.height >= 720, `${name} height ${info.height}`);
    assert.ok(info.frames >= 24, `${name} frames ${info.frames}`);
    assert.equal(info.loop, 0);
    for (const delay of info.delays) {
      assert.ok(delay >= 80 && delay <= 160, `${name} delay ${delay}`);
    }
  });
}

for (const name of SEED_MUSIC_FILES) {
  test(`seed wav ${name} meets atmosphere specs`, () => {
    const info = inspectWav(fs.readFileSync(path.join(MUS_DIR, name)));
    assert.equal(info.rate, 44100);
    assert.equal(info.channels, 2);
    assert.equal(info.bits, 16);
    assert.ok(info.duration >= 16, `${name} duration ${info.duration}`);
    assert.ok(info.peak < 32767, `${name} clipped`);
  });
}
