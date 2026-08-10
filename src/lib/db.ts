import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "family.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initDb(db);
  }
  return db;
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'branch',
      description TEXT DEFAULT '',
      color TEXT DEFAULT 'bg-rose-500',
      lang TEXT DEFAULT 'en',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      initials TEXT NOT NULL,
      bio TEXT DEFAULT '',
      color TEXT DEFAULT 'bg-sky-500',
      avatar TEXT DEFAULT '',
      permissions TEXT DEFAULT 'read',
      branch_id INTEGER DEFAULT NULL,
      lang TEXT DEFAULT 'en',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      date TEXT NOT NULL,
      time TEXT DEFAULT '',
      location TEXT DEFAULT '',
      icon TEXT DEFAULT '\uD83D\uDCC5',
      color TEXT DEFAULT 'border-l-rose-500',
      lang TEXT DEFAULT 'en',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT NOT NULL DEFAULT 'everyday',
      image TEXT DEFAULT '',
      gradient TEXT DEFAULT 'from-rose-400 to-pink-500',
      lang TEXT DEFAULT 'en',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS family_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon TEXT NOT NULL DEFAULT 'Heart',
      gradient TEXT DEFAULT 'from-rose-400 to-pink-500',
      sort_order INTEGER DEFAULT 0,
      lang TEXT DEFAULT 'en',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // --- Safe column migrations: only add if column doesn't exist ---
  migrateColumn(db, "members", "branch_id", "INTEGER DEFAULT NULL");
  migrateColumn(db, "members", "updated_at", "TEXT DEFAULT (datetime('now'))");
  migrateColumn(db, "members", "lang", "TEXT DEFAULT 'en'");
  migrateColumn(db, "events", "updated_at", "TEXT DEFAULT (datetime('now'))");
  migrateColumn(db, "events", "lang", "TEXT DEFAULT 'en'");
  migrateColumn(db, "branches", "lang", "TEXT DEFAULT 'en'");
  migrateColumn(db, "gallery", "lang", "TEXT DEFAULT 'en'");
  migrateColumn(db, "family_values", "lang", "TEXT DEFAULT 'en'");
}

/** Add a column to a table only if it doesn't already exist */
function migrateColumn(db: Database.Database, table: string, column: string, definition: string) {
  const row = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!row.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// Types
export interface Branch {
  id: number;
  name: string;
  type: string;
  description: string;
  color: string;
  lang: string;
  created_at: string;
}

export type BranchInput = Omit<Branch, "id" | "created_at">;

export interface FamilyMember {
  id: number;
  name: string;
  role: string;
  initials: string;
  bio: string;
  color: string;
  avatar: string;
  permissions: "read" | "write";
  branch_id: number | null;
  lang: string;
  created_at: string;
  updated_at: string;
}

export type MemberInput = Omit<FamilyMember, "id" | "created_at" | "updated_at">;

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at: string;
}

// CRUD operations
export function getAllMembers(lang?: string): FamilyMember[] {
  const d = getDb();
  if (lang) return d.prepare("SELECT * FROM members WHERE lang = ? ORDER BY id ASC").all(lang) as FamilyMember[];
  return d.prepare("SELECT * FROM members ORDER BY id ASC").all() as FamilyMember[];
}

export function getMemberById(id: number): FamilyMember | undefined {
  return getDb().prepare("SELECT * FROM members WHERE id = ?").get(id) as FamilyMember | undefined;
}

export function createMember(data: MemberInput): FamilyMember {
  const d = getDb();
  const stmt = d.prepare(`
    INSERT INTO members (name, role, initials, bio, color, permissions, avatar, branch_id, lang)
    VALUES (@name, @role, @initials, @bio, @color, @permissions, @avatar, @branch_id, @lang)
  `);
  const result = stmt.run({ ...data, branch_id: data.branch_id ?? null, lang: (data as any).lang || "en" });
  return getMemberById(Number(result.lastInsertRowid))!;
}

export function updateMember(id: number, data: Partial<MemberInput>): FamilyMember | undefined {
  const d = getDb();
  const existing = getMemberById(id);
  if (!existing) return undefined;
  const merged = { ...existing, ...data, updated_at: new Date().toISOString(), branch_id: data.branch_id ?? existing.branch_id };
  d.prepare(`
    UPDATE members SET name=@name, role=@role, initials=@initials, bio=@bio, color=@color, permissions=@permissions, avatar=@avatar, branch_id=@branch_id, lang=@lang, updated_at=@updated_at
    WHERE id=@id
  `).run(merged);
  return getMemberById(id);
}

export function deleteMember(id: number): boolean {
  return getDb().prepare("DELETE FROM members WHERE id = ?").run(id).changes > 0;
}

// User auth operations
export function getUserByEmail(email: string): User | undefined {
  return getDb().prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined;
}

export function createUser(name: string, email: string, password: string): User {
  const d = getDb();
  const result = d.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)").run(name, email, password);
  return d.prepare("SELECT * FROM users WHERE id = ?").get(Number(result.lastInsertRowid)) as User;
}

// Settings operations
export function getSetting(key: string): string | null {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  getDb().prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
}

// Event types
export interface FamilyEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  icon: string;
  color: string;
  lang: string;
  created_at: string;
  updated_at: string;
}

export type EventInput = Omit<FamilyEvent, "id" | "created_at" | "updated_at">;

export function getAllEvents(lang?: string): FamilyEvent[] {
  const d = getDb();
  if (lang) return d.prepare("SELECT * FROM events WHERE lang = ? ORDER BY date ASC").all(lang) as FamilyEvent[];
  return d.prepare("SELECT * FROM events ORDER BY date ASC").all() as FamilyEvent[];
}

export function getEventById(id: number): FamilyEvent | undefined {
  return getDb().prepare("SELECT * FROM events WHERE id = ?").get(id) as FamilyEvent | undefined;
}

export function createEvent(data: EventInput): FamilyEvent {
  const d = getDb();
  const stmt = d.prepare(`
    INSERT INTO events (title, description, date, time, location, icon, color, lang)
    VALUES (@title, @description, @date, @time, @location, @icon, @color, @lang)
  `);
  const result = stmt.run({ ...data, lang: (data as any).lang || "en" });
  return getEventById(Number(result.lastInsertRowid))!;
}

export function updateEvent(id: number, data: Partial<EventInput>): FamilyEvent | undefined {
  const d = getDb();
  const existing = getEventById(id);
  if (!existing) return undefined;
  const merged = { ...existing, ...data, updated_at: new Date().toISOString() };
  d.prepare(`
    UPDATE events SET title=@title, description=@description, date=@date, time=@time, location=@location, icon=@icon, color=@color, lang=@lang, updated_at=@updated_at
    WHERE id=@id
  `).run(merged);
  return getEventById(id);
}

export function deleteEvent(id: number): boolean {
  return getDb().prepare("DELETE FROM events WHERE id = ?").run(id).changes > 0;
}

// Gallery types & CRUD
export interface GalleryItem {
  id: number;
  title: string;
  description: string;
  category: string;
  image: string;
  gradient: string;
  lang: string;
  created_at: string;
}

export type GalleryInput = Omit<GalleryItem, "id" | "created_at">;

export function getAllGallery(lang?: string): GalleryItem[] {
  const d = getDb();
  if (lang) return d.prepare("SELECT * FROM gallery WHERE lang = ? ORDER BY id DESC").all(lang) as GalleryItem[];
  return d.prepare("SELECT * FROM gallery ORDER BY id DESC").all() as GalleryItem[];
}

export function createGalleryItem(data: GalleryInput): GalleryItem {
  const d = getDb();
  const stmt = d.prepare(`
    INSERT INTO gallery (title, description, category, image, gradient, lang)
    VALUES (@title, @description, @category, @image, @gradient, @lang)
  `);
  const result = stmt.run({ ...data, lang: (data as any).lang || "en" });
  return d.prepare("SELECT * FROM gallery WHERE id = ?").get(Number(result.lastInsertRowid)) as GalleryItem;
}

export function updateGalleryItem(id: number, data: Partial<GalleryInput>): GalleryItem | undefined {
  const d = getDb();
  const existing = d.prepare("SELECT * FROM gallery WHERE id = ?").get(id) as GalleryItem | undefined;
  if (!existing) return undefined;
  const merged = { ...existing, ...data };
  d.prepare("UPDATE gallery SET title=@title, description=@description, category=@category, image=@image, gradient=@gradient, lang=@lang WHERE id=@id").run(merged);
  return d.prepare("SELECT * FROM gallery WHERE id = ?").get(id) as GalleryItem;
}

export function deleteGalleryItem(id: number): boolean {
  return getDb().prepare("DELETE FROM gallery WHERE id = ?").run(id).changes > 0;
}

// Family Values types & CRUD
export interface FamilyValue {
  id: number;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  sort_order: number;
  lang: string;
  created_at: string;
}

export type FamilyValueInput = Omit<FamilyValue, "id" | "created_at">;

export function getAllValues(lang?: string): FamilyValue[] {
  const d = getDb();
  if (lang) return d.prepare("SELECT * FROM family_values WHERE lang = ? ORDER BY sort_order ASC, id ASC").all(lang) as FamilyValue[];
  return d.prepare("SELECT * FROM family_values ORDER BY sort_order ASC, id ASC").all() as FamilyValue[];
}

export function createValue(data: FamilyValueInput): FamilyValue {
  const d = getDb();
  const stmt = d.prepare(`
    INSERT INTO family_values (title, description, icon, gradient, sort_order, lang)
    VALUES (@title, @description, @icon, @gradient, @sort_order, @lang)
  `);
  const result = stmt.run({ ...data, lang: (data as any).lang || "en" });
  return d.prepare("SELECT * FROM family_values WHERE id = ?").get(Number(result.lastInsertRowid)) as FamilyValue;
}

export function updateValue(id: number, data: Partial<FamilyValueInput>): FamilyValue | undefined {
  const d = getDb();
  const existing = d.prepare("SELECT * FROM family_values WHERE id = ?").get(id) as FamilyValue | undefined;
  if (!existing) return undefined;
  const merged = { ...existing, ...data };
  d.prepare("UPDATE family_values SET title=@title, description=@description, icon=@icon, gradient=@gradient, sort_order=@sort_order, lang=@lang WHERE id=@id").run(merged);
  return d.prepare("SELECT * FROM family_values WHERE id = ?").get(id) as FamilyValue;
}

export function deleteValue(id: number): boolean {
  return getDb().prepare("DELETE FROM family_values WHERE id = ?").run(id).changes > 0;
}

// Branch CRUD
export function getAllBranches(lang?: string): Branch[] {
  const d = getDb();
  if (lang) return d.prepare("SELECT * FROM branches WHERE lang = ? ORDER BY name ASC").all(lang) as Branch[];
  return d.prepare("SELECT * FROM branches ORDER BY name ASC").all() as Branch[];
}

export function getBranchById(id: number): Branch | undefined {
  return getDb().prepare("SELECT * FROM branches WHERE id = ?").get(id) as Branch | undefined;
}

export function createBranch(data: BranchInput): Branch {
  const d = getDb();
  const stmt = d.prepare("INSERT INTO branches (name, type, description, color, lang) VALUES (@name, @type, @description, @color, @lang)");
  const result = stmt.run({ ...data, lang: (data as any).lang || "en" });
  return getBranchById(Number(result.lastInsertRowid))!;
}

export function updateBranch(id: number, data: Partial<BranchInput>): Branch | undefined {
  const d = getDb();
  const existing = getBranchById(id);
  if (!existing) return undefined;
  const merged = { ...existing, ...data };
  d.prepare("UPDATE branches SET name=@name, type=@type, description=@description, color=@color, lang=@lang WHERE id=@id").run(merged);
  return getBranchById(id);
}

export function deleteBranch(id: number): boolean {
  const d = getDb();
  d.prepare("UPDATE members SET branch_id = NULL WHERE branch_id = ?").run(id);
  return d.prepare("DELETE FROM branches WHERE id = ?").run(id).changes > 0;
}

export function getMembersByBranch(branchId: number): FamilyMember[] {
  return getDb().prepare("SELECT * FROM members WHERE branch_id = ? ORDER BY id ASC").all(branchId) as FamilyMember[];
}

export function closeDb() {
  if (db) { db.close(); }
}
