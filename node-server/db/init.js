/**
 * SQLite 数据库初始化
 * 表结构对应原 Spring Boot 业务数据模型
 */
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const DB_PATH = process.env.DB_PATH || './data/race.db'
const dbDir = path.dirname(path.resolve(__dirname, '..', DB_PATH))

// 确保数据目录存在
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(path.resolve(__dirname, '..', DB_PATH))

// 开启 WAL 模式提高并发性能
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ─── 建表 DDL ──────────────────────────────────────────────────────────────
db.exec(`
  -- 用户表
  CREATE TABLE IF NOT EXISTS user (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,
    email      TEXT,
    avatar_image_url TEXT,
    weather_image_url TEXT,
    login_time TEXT,
    logout_time TEXT,
    count      INTEGER DEFAULT 0,
    created_at TEXT    DEFAULT (datetime('now','localtime')),
    updated_at TEXT    DEFAULT (datetime('now','localtime'))
  );

  -- 会话表（AI 对话 session）
  CREATE TABLE IF NOT EXISTS session (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT    NOT NULL,
    session_key TEXT   NOT NULL,
    thread_id  TEXT,
    created_at TEXT    DEFAULT (datetime('now','localtime'))
  );

  -- 聊天记录表
  CREATE TABLE IF NOT EXISTS chat_record (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT    NOT NULL,
    user_id    INTEGER NOT NULL,
    content    TEXT,
    thread_id  TEXT,
    created_at TEXT    DEFAULT (datetime('now','localtime')),
    updated_at TEXT    DEFAULT (datetime('now','localtime'))
  );

  -- 图片生成记录表
  CREATE TABLE IF NOT EXISTS image_link (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    user_id    INTEGER NOT NULL,
    image_url  TEXT,
    thread_id  TEXT,
    created_at TEXT    DEFAULT (datetime('now','localtime')),
    updated_at TEXT    DEFAULT (datetime('now','localtime'))
  );

  -- 步数记录表
  CREATE TABLE IF NOT EXISTS step_record (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    steps      INTEGER DEFAULT 0,
    step_date  TEXT    NOT NULL,
    rank       INTEGER DEFAULT 0,
    ai_evaluation TEXT,
    thread_id  TEXT,
    created_at TEXT    DEFAULT (datetime('now','localtime')),
    updated_at TEXT    DEFAULT (datetime('now','localtime')),
    UNIQUE(user_id, step_date)
  );

  -- 轨迹记录表
  CREATE TABLE IF NOT EXISTS track_record (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id       TEXT    NOT NULL UNIQUE,
    user_id        INTEGER NOT NULL,
    latitude       REAL    NOT NULL,
    longitude      REAL    NOT NULL,
    record_time    TEXT    NOT NULL,
    total_distance INTEGER DEFAULT 0,
    created_at     TEXT    DEFAULT (datetime('now','localtime'))
  );
`)

module.exports = db
