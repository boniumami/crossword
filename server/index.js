const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const multer = require("multer");
const { initDb, getDb, UPLOAD_IMAGES, UPLOAD_MUSIC } = require("./db");

const PORT = Number(process.env.PORT || 3001);
const IMAGE_MIMES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "image/apng"]);
const AUDIO_MIMES = new Set(["audio/mpeg", "audio/wav", "audio/wave", "audio/x-wav", "audio/ogg", "audio/webm"]);
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".apng"]);
const AUDIO_EXTS = new Set([".mp3", ".wav", ".ogg"]);

initDb();

const app = express();
app.use(express.json({ limit: "2mb" }));

function safeExt(original, fallback) {
  const ext = path.extname(original || "").toLowerCase();
  return ext || fallback;
}

function uniqueName(original, fallbackExt) {
  const ext = safeExt(original, fallbackExt);
  return `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
}

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_IMAGES),
  filename: (_req, file, cb) => cb(null, uniqueName(file.originalname, ".png")),
});
const musicStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_MUSIC),
  filename: (_req, file, cb) => cb(null, uniqueName(file.originalname, ".mp3")),
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (IMAGE_MIMES.has(file.mimetype) || IMAGE_EXTS.has(ext)) {
      cb(null, true);
      return;
    }
    cb(new Error("图片类型需为 PNG、JPEG、GIF、APNG 或 WebP"));
  },
});

const uploadMusic = multer({
  storage: musicStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (AUDIO_MIMES.has(file.mimetype) || AUDIO_EXTS.has(ext)) {
      cb(null, true);
      return;
    }
    cb(new Error("音乐类型需为 MP3、WAV 或 OGG"));
  },
});

function imagePublic(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    mimeType: row.mime_type,
    url: `/api/files/images/${encodeURIComponent(row.filename)}`,
  };
}

function musicPublic(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    mimeType: row.mime_type,
    url: `/api/files/music/${encodeURIComponent(row.filename)}`,
  };
}

function poemPublic(row) {
  const image = row.image_id
    ? imagePublic({
        id: row.image_id,
        name: row.image_name,
        mime_type: row.image_mime,
        filename: row.image_filename,
      })
    : null;
  const music = row.music_id
    ? musicPublic({
        id: row.music_id,
        name: row.music_name,
        mime_type: row.music_mime,
        filename: row.music_filename,
      })
    : null;
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    body: row.body,
    imageId: row.image_id,
    musicId: row.music_id,
    image,
    music,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const POEM_SELECT = `
  SELECT
    p.id, p.title, p.author, p.body, p.image_id, p.music_id, p.created_at, p.updated_at,
    i.name AS image_name, i.filename AS image_filename, i.mime_type AS image_mime,
    m.name AS music_name, m.filename AS music_filename, m.mime_type AS music_mime
  FROM poems p
  LEFT JOIN images i ON i.id = p.image_id
  LEFT JOIN music m ON m.id = p.music_id
`;

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/poems", (_req, res) => {
  const rows = getDb().prepare(`${POEM_SELECT} ORDER BY p.id DESC`).all();
  res.json(rows.map(poemPublic));
});

app.get("/api/round", (_req, res) => {
  const rows = getDb().prepare(POEM_SELECT).all();
  if (rows.length < 5) {
    res.status(400).json({ error: "题库至少需要 5 首诗词才能开始一轮" });
    return;
  }
  res.json(shuffle(rows).slice(0, 5).map(poemPublic));
});

function parseOptionalId(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return undefined;
  return n;
}

function assertMediaExists(kind, id) {
  if (id === null) return true;
  const table = kind === "image" ? "images" : "music";
  const row = getDb().prepare(`SELECT id FROM ${table} WHERE id = ?`).get(id);
  return Boolean(row);
}

app.post("/api/poems", (req, res) => {
  const title = String(req.body.title || "").trim();
  const author = String(req.body.author || "").trim();
  const body = String(req.body.body || "").trim();
  const imageId = parseOptionalId(req.body.imageId);
  const musicId = parseOptionalId(req.body.musicId);
  if (!title || !author || !body) {
    res.status(400).json({ error: "标题、作者和正文都不能为空" });
    return;
  }
  if (imageId === undefined || musicId === undefined) {
    res.status(400).json({ error: "图片或音乐编号无效" });
    return;
  }
  if (!assertMediaExists("image", imageId) || !assertMediaExists("music", musicId)) {
    res.status(400).json({ error: "所选图片或音乐不存在" });
    return;
  }
  const now = new Date().toISOString();
  const result = getDb()
    .prepare(
      "INSERT INTO poems (title, author, body, image_id, music_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(title, author, body, imageId, musicId, now, now);
  const row = getDb().prepare(`${POEM_SELECT} WHERE p.id = ?`).get(result.lastInsertRowid);
  res.status(201).json(poemPublic(row));
});

app.put("/api/poems/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = getDb().prepare("SELECT id FROM poems WHERE id = ?").get(id);
  if (!existing) {
    res.status(404).json({ error: "诗词不存在" });
    return;
  }
  const title = String(req.body.title || "").trim();
  const author = String(req.body.author || "").trim();
  const body = String(req.body.body || "").trim();
  const imageId = parseOptionalId(req.body.imageId);
  const musicId = parseOptionalId(req.body.musicId);
  if (!title || !author || !body) {
    res.status(400).json({ error: "标题、作者和正文都不能为空" });
    return;
  }
  if (imageId === undefined || musicId === undefined) {
    res.status(400).json({ error: "图片或音乐编号无效" });
    return;
  }
  if (!assertMediaExists("image", imageId) || !assertMediaExists("music", musicId)) {
    res.status(400).json({ error: "所选图片或音乐不存在" });
    return;
  }
  const now = new Date().toISOString();
  getDb()
    .prepare("UPDATE poems SET title = ?, author = ?, body = ?, image_id = ?, music_id = ?, updated_at = ? WHERE id = ?")
    .run(title, author, body, imageId, musicId, now, id);
  const row = getDb().prepare(`${POEM_SELECT} WHERE p.id = ?`).get(id);
  res.json(poemPublic(row));
});

app.delete("/api/poems/:id", (req, res) => {
  const id = Number(req.params.id);
  const result = getDb().prepare("DELETE FROM poems WHERE id = ?").run(id);
  if (result.changes === 0) {
    res.status(404).json({ error: "诗词不存在" });
    return;
  }
  res.json({ ok: true });
});

app.get("/api/images", (_req, res) => {
  const rows = getDb().prepare("SELECT * FROM images ORDER BY id DESC").all();
  res.json(rows.map(imagePublic));
});

app.post("/api/images", uploadImage.single("file"), (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(400).json({ error: "请填写图片名称" });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "请选择图片文件" });
    return;
  }
  const now = new Date().toISOString();
  const result = getDb()
    .prepare("INSERT INTO images (name, filename, mime_type, created_at) VALUES (?, ?, ?, ?)")
    .run(name, req.file.filename, req.file.mimetype || "image/gif", now);
  const row = getDb().prepare("SELECT * FROM images WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(imagePublic(row));
});

app.delete("/api/images/:id", (req, res) => {
  const id = Number(req.params.id);
  const row = getDb().prepare("SELECT * FROM images WHERE id = ?").get(id);
  if (!row) {
    res.status(404).json({ error: "图片不存在" });
    return;
  }
  const used = getDb().prepare("SELECT id, title FROM poems WHERE image_id = ?").all(id);
  if (used.length > 0) {
    res.status(409).json({
      error: `图片仍被诗词使用：${used.map((p) => p.title).join("、")}`,
      poems: used,
    });
    return;
  }
  getDb().prepare("DELETE FROM images WHERE id = ?").run(id);
  const filePath = path.join(UPLOAD_IMAGES, row.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  res.json({ ok: true });
});

app.get("/api/music", (_req, res) => {
  const rows = getDb().prepare("SELECT * FROM music ORDER BY id DESC").all();
  res.json(rows.map(musicPublic));
});

app.post("/api/music", uploadMusic.single("file"), (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(400).json({ error: "请填写音乐名称" });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "请选择音乐文件" });
    return;
  }
  const now = new Date().toISOString();
  const result = getDb()
    .prepare("INSERT INTO music (name, filename, mime_type, created_at) VALUES (?, ?, ?, ?)")
    .run(name, req.file.filename, req.file.mimetype || "audio/mpeg", now);
  const row = getDb().prepare("SELECT * FROM music WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(musicPublic(row));
});

app.delete("/api/music/:id", (req, res) => {
  const id = Number(req.params.id);
  const row = getDb().prepare("SELECT * FROM music WHERE id = ?").get(id);
  if (!row) {
    res.status(404).json({ error: "音乐不存在" });
    return;
  }
  const used = getDb().prepare("SELECT id, title FROM poems WHERE music_id = ?").all(id);
  if (used.length > 0) {
    res.status(409).json({
      error: `音乐仍被诗词使用：${used.map((p) => p.title).join("、")}`,
      poems: used,
    });
    return;
  }
  getDb().prepare("DELETE FROM music WHERE id = ?").run(id);
  const filePath = path.join(UPLOAD_MUSIC, row.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  res.json({ ok: true });
});

app.get("/api/files/images/:name", (req, res) => {
  sendUpload(res, UPLOAD_IMAGES, req.params.name);
});

app.get("/api/files/music/:name", (req, res) => {
  sendUpload(res, UPLOAD_MUSIC, req.params.name);
});

function sendUpload(res, dir, name) {
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    res.status(400).json({ error: "文件名无效" });
    return;
  }
  const filePath = path.join(dir, name);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "文件不存在" });
    return;
  }
  res.sendFile(filePath);
}

app.use((err, _req, res, _next) => {
  const message = err.message || "服务器出错了";
  const status = /类型需为|File too large/.test(message) ? 400 : 500;
  res.status(status).json({ error: message.includes("File too large") ? "文件不能超过 20MB" : message });
});

const DIST = path.join(__dirname, "..", "web", "dist");
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(DIST, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`poetry-fill-game listening on ${PORT}`);
});
