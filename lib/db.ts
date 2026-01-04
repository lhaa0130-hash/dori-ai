import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'missions.db');

// 데이터 디렉토리 생성
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initializeTables(db);
  }
  return db;
}

function initializeTables(database: Database.Database) {
  // missions 테이블: 미션 정의
  database.exec(`
    CREATE TABLE IF NOT EXISTS missions (
      code TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      reset_type TEXT NOT NULL, -- 'daily' or 'weekly'
      is_active INTEGER DEFAULT 1, -- 1: 활성, 0: 비활성
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // user_mission_claims 테이블: 사용자별 미션 수령 내역
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_mission_claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      mission_code TEXT NOT NULL,
      period_key TEXT NOT NULL, -- 'YYYY-MM-DD' for daily, 'YYYY-Www' for weekly
      claimed_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, mission_code, period_key)
    )
  `);

  // user_missions 테이블: 사용자별 미션 완료/수령 상태 추적
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_missions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      mission_code TEXT NOT NULL,
      date_yyyymmdd TEXT NOT NULL, -- 'YYYYMMDD' format for KST
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'completed' | 'claimed'
      completed_at TEXT,
      claimed_at TEXT,
      UNIQUE(user_id, mission_code, date_yyyymmdd)
    )
  `);

  // 인덱스 추가
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_missions_user_id ON user_missions(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_missions_date ON user_missions(date_yyyymmdd);
    CREATE INDEX IF NOT EXISTS idx_user_missions_code ON user_missions(mission_code);
  `);

  // point_ledger 테이블: 포인트 지급 내역 (auditable)
  database.exec(`
    CREATE TABLE IF NOT EXISTS point_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      delta INTEGER NOT NULL,
      reason TEXT NOT NULL, -- e.g. 'mission_claim'
      mission_code TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 인덱스 생성
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_mission_claims_user_id ON user_mission_claims(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_mission_claims_mission_code ON user_mission_claims(mission_code);
    CREATE INDEX IF NOT EXISTS idx_user_mission_claims_period_key ON user_mission_claims(period_key);
    CREATE INDEX IF NOT EXISTS idx_point_ledger_user_id ON point_ledger(user_id);
    CREATE INDEX IF NOT EXISTS idx_point_ledger_created_at ON point_ledger(created_at);
  `);

  // 기본 미션 seed 데이터
  seedMissions(database);
}

function seedMissions(database: Database.Database) {
  const missions = [
    {
      code: 'DAILY_CHECKIN',
      title: '출석 체크',
      points: 10,
      reset_type: 'daily',
    },
    {
      code: 'WRITE_POST_1',
      title: '글 쓰기 1회',
      points: 10,
      reset_type: 'daily',
    },
    {
      code: 'WRITE_COMMENT_3',
      title: '댓글 쓰기 3회',
      points: 10,
      reset_type: 'daily',
    },
    {
      code: 'WEEKLY_BONUS',
      title: 'Weekly Bonus',
      points: 10,
      reset_type: 'weekly',
    },
  ];

  const stmt = database.prepare(`
    INSERT OR REPLACE INTO missions (code, title, points, reset_type, is_active, updated_at)
    VALUES (?, ?, ?, ?, 1, datetime('now'))
  `);

  const insertMany = database.transaction((missions) => {
    for (const mission of missions) {
      stmt.run(
        mission.code,
        mission.title,
        mission.points,
        mission.reset_type
      );
    }
  });

  insertMany(missions);
}

