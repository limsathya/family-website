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
      is_active INTEGER NOT NULL DEFAULT 0,
      role TEXT NOT NULL DEFAULT 'editor',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS redeem_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      used_by INTEGER DEFAULT NULL,
      used_at TEXT DEFAULT NULL,
      max_uses INTEGER NOT NULL DEFAULT 1,
      use_count INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT DEFAULT NULL,
      created_by INTEGER DEFAULT NULL,
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
      group_id TEXT DEFAULT '',
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
      group_id TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS family_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon TEXT NOT NULL DEFAULT 'Heart',
      gradient TEXT DEFAULT 'from-rose-400 to-pink-500',
      sort_order INTEGER DEFAULT 0,
      lang TEXT DEFAULT 'en',
      group_id TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // --- Safe column migrations ---
  migrateColumn(db, "users", "is_active", "INTEGER NOT NULL DEFAULT 0");
  migrateColumn(db, "users", "role", "TEXT NOT NULL DEFAULT 'editor'");
  migrateColumn(db, "users", "name_zh", "TEXT DEFAULT NULL");
  migrateColumn(db, "users", "name_km", "TEXT DEFAULT NULL");
  migrateColumn(db, "redeem_codes", "max_uses", "INTEGER NOT NULL DEFAULT 1");
  migrateColumn(db, "redeem_codes", "use_count", "INTEGER NOT NULL DEFAULT 0");
  migrateColumn(db, "redeem_codes", "expires_at", "TEXT DEFAULT NULL");
  migrateColumn(db, "redeem_codes", "created_by", "INTEGER DEFAULT NULL");

  // Seed a default redeem code if none exist
  const codeCount = (db.prepare("SELECT COUNT(*) as c FROM redeem_codes").get() as { c: number }).c;
  if (codeCount === 0) {
    const defaultCode = process.env.DEFAULT_REDEEM_CODE || "LS-FAMILY2026";
    const maxUses = parseInt(process.env.DEFAULT_REDEEM_MAX_USES || "99");
    const expiryDays = parseInt(process.env.DEFAULT_REDEEM_EXPIRY_DAYS || "365");
    db.prepare(`INSERT INTO redeem_codes (code, max_uses, expires_at) VALUES (?, ?, datetime('now', '+' || ? || ' days'))`).run(defaultCode, maxUses, expiryDays);
  }
  // Activate any existing users and set default role for upgrades
  db.prepare("UPDATE users SET is_active = 1 WHERE is_active = 0").run();
  try { db.exec("UPDATE users SET role = 'editor' WHERE role = '' OR role IS NULL"); } catch { /* ok */ }

  migrateColumn(db, "members", "branch_id", "INTEGER DEFAULT NULL");
  migrateColumn(db, "members", "updated_at", "TEXT DEFAULT (datetime('now'))");
  migrateColumn(db, "members", "lang", "TEXT DEFAULT 'en'");
  migrateColumn(db, "members", "group_id", "TEXT DEFAULT ''");
  migrateColumn(db, "events", "updated_at", "TEXT DEFAULT (datetime('now'))");
  migrateColumn(db, "events", "lang", "TEXT DEFAULT 'en'");
  migrateColumn(db, "events", "group_id", "TEXT DEFAULT ''");
  migrateColumn(db, "branches", "lang", "TEXT DEFAULT 'en'");
  migrateColumn(db, "branches", "group_id", "TEXT DEFAULT ''");
  migrateColumn(db, "gallery", "lang", "TEXT DEFAULT 'en'");
  migrateColumn(db, "gallery", "group_id", "TEXT DEFAULT ''");
  migrateColumn(db, "family_values", "lang", "TEXT DEFAULT 'en'");
  migrateColumn(db, "family_values", "group_id", "TEXT DEFAULT ''");
  migrateColumn(db, "members", "in_memoriam", "INTEGER NOT NULL DEFAULT 0");
  migrateColumn(db, "members", "born_year", "INTEGER DEFAULT NULL");
  migrateColumn(db, "members", "dob", "TEXT DEFAULT NULL");
  migrateColumn(db, "members", "dod", "TEXT DEFAULT NULL");
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
  group_id: string;
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
  group_id: string;
  in_memoriam: number;
  born_year: number | null;
  dob: string | null;
  dod: string | null;
  created_at: string;
  updated_at: string;
}

export type MemberInput = Omit<FamilyMember, "id" | "created_at" | "updated_at">;

export interface User {
  id: number;
  name: string;
  name_zh: string | null;
  name_km: string | null;
  email: string;
  password: string;
  is_active: number;
  role: string;
  created_at: string;
}

export interface RedeemCode {
  id: number;
  code: string;
  used_by: number | null;
  used_at: string | null;
  max_uses: number;
  use_count: number;
  expires_at: string | null;
  created_by: number | null;
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
    INSERT INTO members (name, role, initials, bio, color, permissions, avatar, branch_id, lang, group_id, in_memoriam, born_year, dob, dod)
    VALUES (@name, @role, @initials, @bio, @color, @permissions, @avatar, @branch_id, @lang, @group_id, @in_memoriam, @born_year, @dob, @dod)
  `);
  const result = stmt.run({ ...data, branch_id: data.branch_id ?? null, lang: data.lang || "en", group_id: data.group_id || "", in_memoriam: data.in_memoriam ? 1 : 0, born_year: data.born_year || null, dob: data.dob || null, dod: data.dod || null });
  return getMemberById(Number(result.lastInsertRowid))!;
}

export function updateMember(id: number, data: Partial<MemberInput>): FamilyMember | undefined {
  const d = getDb();
  const existing = getMemberById(id);
  if (!existing) return undefined;
  const merged = { ...existing, ...data, updated_at: new Date().toISOString(), branch_id: data.branch_id ?? existing.branch_id, group_id: data.group_id ?? existing.group_id, in_memoriam: data.in_memoriam !== undefined ? (data.in_memoriam ? 1 : 0) : existing.in_memoriam, born_year: data.born_year !== undefined ? (data.born_year || null) : existing.born_year, dob: data.dob !== undefined ? (data.dob || null) : existing.dob, dod: data.dod !== undefined ? (data.dod || null) : existing.dod };
  d.prepare(`
    UPDATE members SET name=@name, role=@role, initials=@initials, bio=@bio, color=@color, permissions=@permissions, avatar=@avatar, branch_id=@branch_id, lang=@lang, group_id=@group_id, in_memoriam=@in_memoriam, born_year=@born_year, dob=@dob, dod=@dod, updated_at=@updated_at
    WHERE id=@id
  `).run(merged);
  return getMemberById(id);
}

export function getMembersByGroupId(groupId: string): FamilyMember[] {
  return getDb().prepare("SELECT * FROM members WHERE group_id = ? ORDER BY id ASC").all(groupId) as FamilyMember[];
}

export function deleteMember(id: number): boolean {
  return getDb().prepare("DELETE FROM members WHERE id = ?").run(id).changes > 0;
}

// User auth operations
export function getUserByEmail(email: string): User | undefined {
  return getDb().prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined;
}

export function createUser(name: string, email: string, password: string, isActive: number = 0, nameZh?: string, nameKm?: string): User {
  const d = getDb();
  const result = d.prepare("INSERT INTO users (name, email, password, is_active, name_zh, name_km) VALUES (?, ?, ?, ?, ?, ?)").run(name, email, password, isActive, nameZh || null, nameKm || null);
  return d.prepare("SELECT * FROM users WHERE id = ?").get(Number(result.lastInsertRowid)) as User;
}

export function activateUser(userId: number): void {
  getDb().prepare("UPDATE users SET is_active = 1 WHERE id = ?").run(userId);
}

// Redeem code operations
export function getRedeemCode(code: string): RedeemCode | undefined {
  return getDb().prepare("SELECT * FROM redeem_codes WHERE code = ?").get(code) as RedeemCode | undefined;
}

export function markRedeemCodeUsed(code: string, userId: number): void {
  getDb().prepare("UPDATE redeem_codes SET used_by = ?, used_at = datetime('now'), use_count = use_count + 1 WHERE code = ?").run(userId, code);
}

export function createRedeemCode(code: string, maxUses: number = 1, expiresAt: string | null = null, createdBy: number | null = null): RedeemCode {
  const d = getDb();
  const result = d.prepare("INSERT INTO redeem_codes (code, max_uses, expires_at, created_by) VALUES (?, ?, ?, ?)").run(code, maxUses, expiresAt, createdBy);
  return d.prepare("SELECT * FROM redeem_codes WHERE id = ?").get(Number(result.lastInsertRowid)) as RedeemCode;
}

export function getAllRedeemCodes(): RedeemCode[] {
  return getDb().prepare("SELECT * FROM redeem_codes ORDER BY created_at DESC").all() as RedeemCode[];
}

export function deleteRedeemCode(id: number): boolean {
  return getDb().prepare("DELETE FROM redeem_codes WHERE id = ?").run(id).changes > 0;
}

// User management
export function getAllUsers(): User[] {
  return getDb().prepare("SELECT * FROM users ORDER BY created_at DESC").all() as User[];
}

export function getUserById(id: number): User | undefined {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

export function updateUserRole(id: number, role: string): boolean {
  return getDb().prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id).changes > 0;
}

export function updateUserProfile(id: number, data: { name?: string; name_zh?: string | null; name_km?: string | null }): User | undefined {
  const d = getDb();
  const user = getUserById(id);
  if (!user) return undefined;
  d.prepare("UPDATE users SET name = ?, name_zh = ?, name_km = ? WHERE id = ?").run(
    data.name ?? user.name,
    data.name_zh !== undefined ? data.name_zh : user.name_zh,
    data.name_km !== undefined ? data.name_km : user.name_km,
    id
  );
  return getUserById(id);
}

export function toggleUserActive(id: number): boolean {
  const user = getUserById(id);
  if (!user) return false;
  const newState = user.is_active ? 0 : 1;
  return getDb().prepare("UPDATE users SET is_active = ? WHERE id = ?").run(newState, id).changes > 0;
}

export function deleteUser(id: number): boolean {
  return getDb().prepare("DELETE FROM users WHERE id = ?").run(id).changes > 0;
}

// Chat messages
export interface ChatMessage {
  id: number;
  user_id: number;
  user_name: string;
  message: string;
  created_at: string;
}

export interface ChatMessageWithNames extends ChatMessage {
  name_zh: string | null;
  name_km: string | null;
}

export function getChatMessages(limit: number = 50): ChatMessage[] {
  return getDb().prepare("SELECT * FROM chat_messages ORDER BY id DESC LIMIT ?").all(limit) as ChatMessage[];
}

export function getChatMessagesWithNames(limit: number = 100): ChatMessageWithNames[] {
  return getDb().prepare(`
    SELECT cm.*, u.name_zh, u.name_km
    FROM chat_messages cm
    LEFT JOIN users u ON u.id = cm.user_id
    ORDER BY cm.id DESC LIMIT ?
  `).all(limit) as ChatMessageWithNames[];
}

export function createChatMessage(userId: number, userName: string, message: string): ChatMessage {
  const d = getDb();
  const result = d.prepare("INSERT INTO chat_messages (user_id, user_name, message) VALUES (?, ?, ?)").run(userId, userName, message);
  return d.prepare("SELECT * FROM chat_messages WHERE id = ?").get(Number(result.lastInsertRowid)) as ChatMessage;
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
  group_id: string;
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
    INSERT INTO events (title, description, date, time, location, icon, color, lang, group_id)
    VALUES (@title, @description, @date, @time, @location, @icon, @color, @lang, @group_id)
  `);
  const result = stmt.run({ ...data, lang: data.lang || "en", group_id: data.group_id || "" });
  return getEventById(Number(result.lastInsertRowid))!;
}

export function updateEvent(id: number, data: Partial<EventInput>): FamilyEvent | undefined {
  const d = getDb();
  const existing = getEventById(id);
  if (!existing) return undefined;
  const merged = { ...existing, ...data, updated_at: new Date().toISOString(), group_id: data.group_id ?? existing.group_id };
  d.prepare(`
    UPDATE events SET title=@title, description=@description, date=@date, time=@time, location=@location, icon=@icon, color=@color, lang=@lang, group_id=@group_id, updated_at=@updated_at
    WHERE id=@id
  `).run(merged);
  return getEventById(id);
}

export function getEventsByGroupId(groupId: string): FamilyEvent[] {
  return getDb().prepare("SELECT * FROM events WHERE group_id = ? ORDER BY id ASC").all(groupId) as FamilyEvent[];
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
  group_id: string;
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
    INSERT INTO gallery (title, description, category, image, gradient, lang, group_id)
    VALUES (@title, @description, @category, @image, @gradient, @lang, @group_id)
  `);
  const result = stmt.run({ ...data, lang: data.lang || "en", group_id: data.group_id || "" });
  return d.prepare("SELECT * FROM gallery WHERE id = ?").get(Number(result.lastInsertRowid)) as GalleryItem;
}

export function updateGalleryItem(id: number, data: Partial<GalleryInput>): GalleryItem | undefined {
  const d = getDb();
  const existing = d.prepare("SELECT * FROM gallery WHERE id = ?").get(id) as GalleryItem | undefined;
  if (!existing) return undefined;
  const merged = { ...existing, ...data, group_id: data.group_id ?? existing.group_id ?? "" };
  d.prepare("UPDATE gallery SET title=@title, description=@description, category=@category, image=@image, gradient=@gradient, lang=@lang, group_id=@group_id WHERE id=@id").run(merged);
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
  group_id: string;
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
    INSERT INTO family_values (title, description, icon, gradient, sort_order, lang, group_id)
    VALUES (@title, @description, @icon, @gradient, @sort_order, @lang, @group_id)
  `);
  const result = stmt.run({ ...data, lang: data.lang || "en", group_id: data.group_id || "" });
  return d.prepare("SELECT * FROM family_values WHERE id = ?").get(Number(result.lastInsertRowid)) as FamilyValue;
}

export function updateValue(id: number, data: Partial<FamilyValueInput>): FamilyValue | undefined {
  const d = getDb();
  const existing = d.prepare("SELECT * FROM family_values WHERE id = ?").get(id) as FamilyValue | undefined;
  if (!existing) return undefined;
  const merged = { ...existing, ...data, group_id: data.group_id ?? existing.group_id };
  d.prepare("UPDATE family_values SET title=@title, description=@description, icon=@icon, gradient=@gradient, sort_order=@sort_order, lang=@lang, group_id=@group_id WHERE id=@id").run(merged);
  return d.prepare("SELECT * FROM family_values WHERE id = ?").get(id) as FamilyValue;
}

export function getValuesByGroupId(groupId: string): FamilyValue[] {
  return getDb().prepare("SELECT * FROM family_values WHERE group_id = ? ORDER BY id ASC").all(groupId) as FamilyValue[];
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
  const stmt = d.prepare("INSERT INTO branches (name, type, description, color, lang, group_id) VALUES (@name, @type, @description, @color, @lang, @group_id)");
  const result = stmt.run({ ...data, lang: data.lang || "en", group_id: data.group_id || "" });
  return getBranchById(Number(result.lastInsertRowid))!;
}

export function updateBranch(id: number, data: Partial<BranchInput>): Branch | undefined {
  const d = getDb();
  const existing = getBranchById(id);
  if (!existing) return undefined;
  const merged = { ...existing, ...data, group_id: data.group_id ?? existing.group_id };
  d.prepare("UPDATE branches SET name=@name, type=@type, description=@description, color=@color, lang=@lang, group_id=@group_id WHERE id=@id").run(merged);
  return getBranchById(id);
}

export function getBranchesByGroupId(groupId: string): Branch[] {
  return getDb().prepare("SELECT * FROM branches WHERE group_id = ? ORDER BY id ASC").all(groupId) as Branch[];
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
