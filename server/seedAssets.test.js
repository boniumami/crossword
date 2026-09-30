const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { copySeedFile, SEED_IMAGE_FILES, SEED_MUSIC_FILES } = require("./db");

test("seed filenames stay stable for built-in poems", () => {
  assert.deepEqual(SEED_IMAGE_FILES, [
    "default.gif",
    "jingyesi.gif",
    "chunxiao.gif",
    "yonge.gif",
    "minnong.gif",
    "dengguanquelou.gif",
  ]);
  assert.deepEqual(SEED_MUSIC_FILES, [
    "default.wav",
    "jingyesi.wav",
    "chunxiao.wav",
    "yonge.wav",
    "minnong.wav",
    "dengguanquelou.wav",
  ]);
});

test("copySeedFile overwrites an existing destination file", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "seed-"));
  const srcDir = path.join(root, "src");
  const destDir = path.join(root, "dest");
  fs.mkdirSync(srcDir);
  fs.mkdirSync(destDir);
  fs.writeFileSync(path.join(srcDir, "jingyesi.gif"), "new-bytes");
  fs.writeFileSync(path.join(destDir, "jingyesi.gif"), "old-bytes");
  copySeedFile(srcDir, destDir, "jingyesi.gif");
  assert.equal(fs.readFileSync(path.join(destDir, "jingyesi.gif"), "utf8"), "new-bytes");
});

test("copySeedFile throws when the seed source is missing", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "seed-missing-"));
  assert.throws(() => copySeedFile(root, root, "missing.gif"), /缺少种子文件/);
});
