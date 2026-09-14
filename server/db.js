const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "poems.db");
const UPLOAD_IMAGES = path.join(ROOT, "uploads", "images");
const UPLOAD_MUSIC = path.join(ROOT, "uploads", "music");
const SEED_IMAGES = path.join(ROOT, "seed-assets", "images");
const SEED_MUSIC = path.join(ROOT, "seed-assets", "music");

/** @type {import("node:sqlite").DatabaseSync | null} */
let db = null;

function ensureDirs() {
  for (const dir of [DATA_DIR, UPLOAD_IMAGES, UPLOAD_MUSIC]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copySeedFile(srcDir, destDir, filename) {
  const src = path.join(srcDir, filename);
  const dest = path.join(destDir, filename);
  if (!fs.existsSync(src)) {
    throw new Error(`缺少种子文件: ${src}`);
  }
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
  }
}

function seedIfEmpty(database) {
  const poemCount = database.prepare("SELECT COUNT(*) AS c FROM poems").get().c;
  if (poemCount > 0) {
    return;
  }

  const now = new Date().toISOString();
  const insertImage = database.prepare(
    "INSERT INTO images (name, filename, mime_type, created_at) VALUES (?, ?, ?, ?)"
  );
  const insertMusic = database.prepare(
    "INSERT INTO music (name, filename, mime_type, created_at) VALUES (?, ?, ?, ?)"
  );
  const insertPoem = database.prepare(
    "INSERT INTO poems (title, author, body, image_id, music_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  const assets = [
    {
      title: "静夜思",
      author: "李白",
      body: "床前明月光，\n疑是地上霜。\n举头望明月，\n低头思故乡。",
      imageName: "月夜窗前",
      imageFile: "jingyesi.gif",
      musicName: "月夜曲",
      musicFile: "jingyesi.wav",
    },
    {
      title: "春晓",
      author: "孟浩然",
      body: "春眠不觉晓，\n处处闻啼鸟。\n夜来风雨声，\n花落知多少。",
      imageName: "春日花鸟",
      imageFile: "chunxiao.gif",
      musicName: "晓莺曲",
      musicFile: "chunxiao.wav",
    },
    {
      title: "咏鹅",
      author: "骆宾王",
      body: "鹅，鹅，鹅，\n曲项向天歌。\n白毛浮绿水，\n红掌拨清波。",
      imageName: "池中白鹅",
      imageFile: "yonge.gif",
      musicName: "戏水曲",
      musicFile: "yonge.wav",
    },
    {
      title: "悯农",
      author: "李绅",
      body: "锄禾日当午，\n汗滴禾下土。\n谁知盘中餐，\n粒粒皆辛苦。",
      imageName: "田野正午",
      imageFile: "minnong.gif",
      musicName: "田园曲",
      musicFile: "minnong.wav",
    },
    {
      title: "登鹳雀楼",
      author: "王之涣",
      body: "白日依山尽，\n黄河入海流。\n欲穷千里目，\n更上一层楼。",
      imageName: "鹳雀夕照",
      imageFile: "dengguanquelou.gif",
      musicName: "登高曲",
      musicFile: "dengguanquelou.wav",
    },
  ];

  copySeedFile(SEED_IMAGES, UPLOAD_IMAGES, "default.gif");
  copySeedFile(SEED_MUSIC, UPLOAD_MUSIC, "default.wav");
  insertImage.run("水墨宣纸", "default.gif", "image/gif", now);
  insertMusic.run("默认古曲", "default.wav", "audio/wav", now);

  for (const item of assets) {
    copySeedFile(SEED_IMAGES, UPLOAD_IMAGES, item.imageFile);
    copySeedFile(SEED_MUSIC, UPLOAD_MUSIC, item.musicFile);
    const imageId = insertImage.run(item.imageName, item.imageFile, "image/gif", now).lastInsertRowid;
    const musicId = insertMusic.run(item.musicName, item.musicFile, "audio/wav", now).lastInsertRowid;
    insertPoem.run(item.title, item.author, item.body, imageId, musicId, now, now);
  }
}

function initDb() {
  ensureDirs();
  db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      filename TEXT NOT NULL UNIQUE,
      mime_type TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS music (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      filename TEXT NOT NULL UNIQUE,
      mime_type TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS poems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      body TEXT NOT NULL,
      image_id INTEGER,
      music_id INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (image_id) REFERENCES images(id),
      FOREIGN KEY (music_id) REFERENCES music(id)
    );
  `);
  seedIfEmpty(db);
  return db;
}

function getDb() {
  if (!db) {
    throw new Error("数据库尚未初始化");
  }
  return db;
}

module.exports = {
  initDb,
  getDb,
  ROOT,
  UPLOAD_IMAGES,
  UPLOAD_MUSIC,
  DB_PATH,
};
