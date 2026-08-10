import { createClient } from "@libsql/client";
import type { Client } from "@libsql/client";

let db: Client;

export function getDb(): Client {
  if (!db) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (url && authToken) {
      // Turso cloud (Vercel / production)
      db = createClient({ url, authToken });
    } else {
      // Fallback: local SQLite via libsql (same API, local file)
      db = createClient({ url: "file:./family.db" });
    }
    initDb();
  }
  return db;
}

async function initDb() {
  const db = getDb();
  await db.executeMultiple(`
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
  await migrateColumn("users", "is_active", "INTEGER NOT NULL DEFAULT 0");
  await migrateColumn("users", "role", "TEXT NOT NULL DEFAULT 'editor'");
  await migrateColumn("users", "name_zh", "TEXT DEFAULT NULL");
  await migrateColumn("users", "name_km", "TEXT DEFAULT NULL");
  await migrateColumn("redeem_codes", "max_uses", "INTEGER NOT NULL DEFAULT 1");
  await migrateColumn("redeem_codes", "use_count", "INTEGER NOT NULL DEFAULT 0");
  await migrateColumn("redeem_codes", "expires_at", "TEXT DEFAULT NULL");
  await migrateColumn("redeem_codes", "created_by", "INTEGER DEFAULT NULL");

  // Seed a default redeem code if none exist
  const codeResult = await db.execute("SELECT COUNT(*) as c FROM redeem_codes");
  if (codeResult.rows[0] && (codeResult.rows[0] as any).c === 0) {
    const defaultCode = process.env.DEFAULT_REDEEM_CODE || "LS-FAMILY2026";
    const maxUses = parseInt(process.env.DEFAULT_REDEEM_MAX_USES || "99");
    const expiryDays = parseInt(process.env.DEFAULT_REDEEM_EXPIRY_DAYS || "365");
    await db.execute({ sql: `INSERT INTO redeem_codes (code, max_uses, expires_at) VALUES (?, ?, datetime('now', '+' || ? || ' days'))`, args: [defaultCode, maxUses, expiryDays] });
  }
  // Activate any existing users and set default role for upgrades
  await db.execute("UPDATE users SET is_active = 1 WHERE is_active = 0");
  try { await db.execute("UPDATE users SET role = 'editor' WHERE role = '' OR role IS NULL"); } catch { /* ok */ }

  await migrateColumn("members", "branch_id", "INTEGER DEFAULT NULL");
  await migrateColumn("members", "updated_at", "TEXT DEFAULT (datetime('now'))");
  await migrateColumn("members", "lang", "TEXT DEFAULT 'en'");
  await migrateColumn("members", "group_id", "TEXT DEFAULT ''");
  await migrateColumn("events", "updated_at", "TEXT DEFAULT (datetime('now'))");
  await migrateColumn("events", "lang", "TEXT DEFAULT 'en'");
  await migrateColumn("events", "group_id", "TEXT DEFAULT ''");
  await migrateColumn("branches", "lang", "TEXT DEFAULT 'en'");
  await migrateColumn("branches", "group_id", "TEXT DEFAULT ''");
  await migrateColumn("gallery", "lang", "TEXT DEFAULT 'en'");
  await migrateColumn("gallery", "group_id", "TEXT DEFAULT ''");
  await migrateColumn("family_values", "lang", "TEXT DEFAULT 'en'");
  await migrateColumn("family_values", "group_id", "TEXT DEFAULT ''");
  await migrateColumn("members", "in_memoriam", "INTEGER NOT NULL DEFAULT 0");
  await migrateColumn("members", "born_year", "INTEGER DEFAULT NULL");
  await migrateColumn("members", "dob", "TEXT DEFAULT NULL");
  await migrateColumn("members", "dod", "TEXT DEFAULT NULL");
}

/** Add a column to a table only if it doesn't already exist */
async function migrateColumn(table: string, column: string, definition: string) {
  const db = getDb();
  const result = await db.execute(`PRAGMA table_info(${table})`);
  const cols = result.rows as unknown as Array<{ name: string }>;
  if (!cols.some((c) => c.name === column)) {
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
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

// Helper: execute a query and return rows as typed array
async function query<T>(sql: string, args?: any[]): Promise<T[]> {
  const d = getDb();
  const result = await d.execute({ sql, args: args || [] });
  return result.rows as unknown as T[];
}

async function queryOne<T>(sql: string, args?: any[]): Promise<T | undefined> {
  const rows = await query<T>(sql, args);
  return rows[0];
}

async function execute(sql: string, args?: any[]): Promise<{ rowsAffected: number; lastInsertRowid: bigint | undefined }> {
  const d = getDb();
  const result = await d.execute({ sql, args: args || [] });
  return { rowsAffected: result.rowsAffected, lastInsertRowid: result.lastInsertRowid };
}

// CRUD operations
export async function getAllMembers(lang?: string): Promise<FamilyMember[]> {
  if (lang) return query<FamilyMember>("SELECT * FROM members WHERE lang = ? ORDER BY id ASC", [lang]);
  return query<FamilyMember>("SELECT * FROM members ORDER BY id ASC");
}

export async function getMemberById(id: number): Promise<FamilyMember | undefined> {
  return queryOne<FamilyMember>("SELECT * FROM members WHERE id = ?", [id]);
}

export async function createMember(data: MemberInput): Promise<FamilyMember> {
  const r = await execute(
    `INSERT INTO members (name, role, initials, bio, color, permissions, avatar, branch_id, lang, group_id, in_memoriam, born_year, dob, dod)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.name, data.role, data.initials, data.bio, data.color, data.permissions, data.avatar, data.branch_id ?? null, data.lang || "en", data.group_id || "", data.in_memoriam ? 1 : 0, data.born_year || null, data.dob || null, data.dod || null]
  );
  return (await getMemberById(Number(r.lastInsertRowid)))!;
}

export async function updateMember(id: number, data: Partial<MemberInput>): Promise<FamilyMember | undefined> {
  const existing = await getMemberById(id);
  if (!existing) return undefined;
  const merged = { ...existing, ...data, updated_at: new Date().toISOString(), branch_id: data.branch_id ?? existing.branch_id, group_id: data.group_id ?? existing.group_id, in_memoriam: data.in_memoriam !== undefined ? (data.in_memoriam ? 1 : 0) : existing.in_memoriam, born_year: data.born_year !== undefined ? (data.born_year || null) : existing.born_year, dob: data.dob !== undefined ? (data.dob || null) : existing.dob, dod: data.dod !== undefined ? (data.dod || null) : existing.dod };
  await execute(
    `UPDATE members SET name=?, role=?, initials=?, bio=?, color=?, permissions=?, avatar=?, branch_id=?, lang=?, group_id=?, in_memoriam=?, born_year=?, dob=?, dod=?, updated_at=? WHERE id=?`,
    [merged.name, merged.role, merged.initials, merged.bio, merged.color, merged.permissions, merged.avatar, merged.branch_id, merged.lang, merged.group_id, merged.in_memoriam, merged.born_year, merged.dob, merged.dod, merged.updated_at, id]
  );
  return getMemberById(id);
}

export async function getMembersByGroupId(groupId: string): Promise<FamilyMember[]> {
  return query<FamilyMember>("SELECT * FROM members WHERE group_id = ? ORDER BY id ASC", [groupId]);
}

export async function deleteMember(id: number): Promise<boolean> {
  const r = await execute("DELETE FROM members WHERE id = ?", [id]);
  return r.rowsAffected > 0;
}

// User auth operations
export async function getUserByEmail(email: string): Promise<User | undefined> {
  return queryOne<User>("SELECT * FROM users WHERE email = ?", [email]);
}

export async function createUser(name: string, email: string, password: string, isActive: number = 0, nameZh?: string, nameKm?: string): Promise<User> {
  const r = await execute("INSERT INTO users (name, email, password, is_active, name_zh, name_km) VALUES (?, ?, ?, ?, ?, ?)", [name, email, password, isActive, nameZh || null, nameKm || null]);
  return (await queryOne<User>("SELECT * FROM users WHERE id = ?", [Number(r.lastInsertRowid)]))!;
}

export async function activateUser(userId: number): Promise<void> {
  await execute("UPDATE users SET is_active = 1 WHERE id = ?", [userId]);
}

// Redeem code operations
export async function getRedeemCode(code: string): Promise<RedeemCode | undefined> {
  return queryOne<RedeemCode>("SELECT * FROM redeem_codes WHERE code = ?", [code]);
}

export async function markRedeemCodeUsed(code: string, userId: number): Promise<void> {
  await execute("UPDATE redeem_codes SET used_by = ?, used_at = datetime('now'), use_count = use_count + 1 WHERE code = ?", [userId, code]);
}

export async function createRedeemCode(code: string, maxUses: number = 1, expiresAt: string | null = null, createdBy: number | null = null): Promise<RedeemCode> {
  const r = await execute("INSERT INTO redeem_codes (code, max_uses, expires_at, created_by) VALUES (?, ?, ?, ?)", [code, maxUses, expiresAt, createdBy]);
  return (await queryOne<RedeemCode>("SELECT * FROM redeem_codes WHERE id = ?", [Number(r.lastInsertRowid)]))!;
}

export async function getAllRedeemCodes(): Promise<RedeemCode[]> {
  return query<RedeemCode>("SELECT * FROM redeem_codes ORDER BY created_at DESC");
}

export async function deleteRedeemCode(id: number): Promise<boolean> {
  const r = await execute("DELETE FROM redeem_codes WHERE id = ?", [id]);
  return r.rowsAffected > 0;
}

// User management
export async function getAllUsers(): Promise<User[]> {
  return query<User>("SELECT * FROM users ORDER BY created_at DESC");
}

export async function getUserById(id: number): Promise<User | undefined> {
  return queryOne<User>("SELECT * FROM users WHERE id = ?", [id]);
}

export async function updateUserRole(id: number, role: string): Promise<boolean> {
  const r = await execute("UPDATE users SET role = ? WHERE id = ?", [role, id]);
  return r.rowsAffected > 0;
}

export async function updateUserProfile(id: number, data: { name?: string; name_zh?: string | null; name_km?: string | null }): Promise<User | undefined> {
  const user = await getUserById(id);
  if (!user) return undefined;
  await execute("UPDATE users SET name = ?, name_zh = ?, name_km = ? WHERE id = ?", [
    data.name ?? user.name, data.name_zh !== undefined ? data.name_zh : user.name_zh, data.name_km !== undefined ? data.name_km : user.name_km, id
  ]);
  return getUserById(id);
}

export async function toggleUserActive(id: number): Promise<boolean> {
  const user = await getUserById(id);
  if (!user) return false;
  const newState = user.is_active ? 0 : 1;
  const r = await execute("UPDATE users SET is_active = ? WHERE id = ?", [newState, id]);
  return r.rowsAffected > 0;
}

export async function deleteUser(id: number): Promise<boolean> {
  const r = await execute("DELETE FROM users WHERE id = ?", [id]);
  return r.rowsAffected > 0;
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

export async function getChatMessages(limit: number = 50): Promise<ChatMessage[]> {
  return query<ChatMessage>("SELECT * FROM chat_messages ORDER BY id DESC LIMIT ?", [limit]);
}

export async function getChatMessagesWithNames(limit: number = 100): Promise<ChatMessageWithNames[]> {
  return query<ChatMessageWithNames>(`SELECT cm.*, u.name_zh, u.name_km FROM chat_messages cm LEFT JOIN users u ON u.id = cm.user_id ORDER BY cm.id DESC LIMIT ?`, [limit]);
}

export async function createChatMessage(userId: number, userName: string, message: string): Promise<ChatMessage> {
  const r = await execute("INSERT INTO chat_messages (user_id, user_name, message) VALUES (?, ?, ?)", [userId, userName, message]);
  return (await queryOne<ChatMessage>("SELECT * FROM chat_messages WHERE id = ?", [Number(r.lastInsertRowid)]))!;
}

// Settings operations
export async function getSetting(key: string): Promise<string | null> {
  const row = await queryOne<{ value: string }>("SELECT value FROM settings WHERE key = ?", [key]);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await execute("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [key, value]);
}

// Event types
export interface FamilyEvent {
  id: number; title: string; description: string; date: string; time: string; location: string; icon: string; color: string; lang: string; group_id: string; created_at: string; updated_at: string;
}
export type EventInput = Omit<FamilyEvent, "id" | "created_at" | "updated_at">;

export async function getAllEvents(lang?: string): Promise<FamilyEvent[]> {
  if (lang) return query<FamilyEvent>("SELECT * FROM events WHERE lang = ? ORDER BY date ASC", [lang]);
  return query<FamilyEvent>("SELECT * FROM events ORDER BY date ASC");
}
export async function getEventById(id: number): Promise<FamilyEvent | undefined> { return queryOne<FamilyEvent>("SELECT * FROM events WHERE id = ?", [id]); }
export async function createEvent(data: EventInput): Promise<FamilyEvent> {
  const r = await execute("INSERT INTO events (title, description, date, time, location, icon, color, lang, group_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [data.title, data.description, data.date, data.time, data.location, data.icon, data.color, data.lang || "en", data.group_id || ""]);
  return (await getEventById(Number(r.lastInsertRowid)))!;
}
export async function updateEvent(id: number, data: Partial<EventInput>): Promise<FamilyEvent | undefined> {
  const existing = await getEventById(id); if (!existing) return undefined;
  const m = { ...existing, ...data, updated_at: new Date().toISOString(), group_id: data.group_id ?? existing.group_id };
  await execute("UPDATE events SET title=?, description=?, date=?, time=?, location=?, icon=?, color=?, lang=?, group_id=?, updated_at=? WHERE id=?", [m.title, m.description, m.date, m.time, m.location, m.icon, m.color, m.lang, m.group_id, m.updated_at, id]);
  return getEventById(id);
}
export async function getEventsByGroupId(groupId: string): Promise<FamilyEvent[]> { return query<FamilyEvent>("SELECT * FROM events WHERE group_id = ? ORDER BY id ASC", [groupId]); }
export async function deleteEvent(id: number): Promise<boolean> { const r = await execute("DELETE FROM events WHERE id = ?", [id]); return r.rowsAffected > 0; }

// Gallery
export interface GalleryItem { id: number; title: string; description: string; category: string; image: string; gradient: string; lang: string; group_id: string; created_at: string; }
export type GalleryInput = Omit<GalleryItem, "id" | "created_at">;
export async function getAllGallery(lang?: string): Promise<GalleryItem[]> {
  if (lang) return query<GalleryItem>("SELECT * FROM gallery WHERE lang = ? ORDER BY id DESC", [lang]);
  return query<GalleryItem>("SELECT * FROM gallery ORDER BY id DESC");
}
export async function createGalleryItem(data: GalleryInput): Promise<GalleryItem> {
  const r = await execute("INSERT INTO gallery (title, description, category, image, gradient, lang, group_id) VALUES (?, ?, ?, ?, ?, ?, ?)", [data.title, data.description, data.category, data.image, data.gradient, data.lang || "en", data.group_id || ""]);
  return (await queryOne<GalleryItem>("SELECT * FROM gallery WHERE id = ?", [Number(r.lastInsertRowid)]))!;
}
export async function updateGalleryItem(id: number, data: Partial<GalleryInput>): Promise<GalleryItem | undefined> {
  const existing = await queryOne<GalleryItem>("SELECT * FROM gallery WHERE id = ?", [id]); if (!existing) return undefined;
  const m = { ...existing, ...data, group_id: data.group_id ?? existing.group_id ?? "" };
  await execute("UPDATE gallery SET title=?, description=?, category=?, image=?, gradient=?, lang=?, group_id=? WHERE id=?", [m.title, m.description, m.category, m.image, m.gradient, m.lang, m.group_id, id]);
  return queryOne<GalleryItem>("SELECT * FROM gallery WHERE id = ?", [id]);
}
export async function deleteGalleryItem(id: number): Promise<boolean> { const r = await execute("DELETE FROM gallery WHERE id = ?", [id]); return r.rowsAffected > 0; }

// Family Values
export interface FamilyValue { id: number; title: string; description: string; icon: string; gradient: string; sort_order: number; lang: string; group_id: string; created_at: string; }
export type FamilyValueInput = Omit<FamilyValue, "id" | "created_at">;
export async function getAllValues(lang?: string): Promise<FamilyValue[]> {
  if (lang) return query<FamilyValue>("SELECT * FROM family_values WHERE lang = ? ORDER BY sort_order ASC, id ASC", [lang]);
  return query<FamilyValue>("SELECT * FROM family_values ORDER BY sort_order ASC, id ASC");
}
export async function createValue(data: FamilyValueInput): Promise<FamilyValue> {
  const r = await execute("INSERT INTO family_values (title, description, icon, gradient, sort_order, lang, group_id) VALUES (?, ?, ?, ?, ?, ?, ?)", [data.title, data.description, data.icon, data.gradient, data.sort_order, data.lang || "en", data.group_id || ""]);
  return (await queryOne<FamilyValue>("SELECT * FROM family_values WHERE id = ?", [Number(r.lastInsertRowid)]))!;
}
export async function updateValue(id: number, data: Partial<FamilyValueInput>): Promise<FamilyValue | undefined> {
  const existing = await queryOne<FamilyValue>("SELECT * FROM family_values WHERE id = ?", [id]); if (!existing) return undefined;
  const m = { ...existing, ...data, group_id: data.group_id ?? existing.group_id };
  await execute("UPDATE family_values SET title=?, description=?, icon=?, gradient=?, sort_order=?, lang=?, group_id=? WHERE id=?", [m.title, m.description, m.icon, m.gradient, m.sort_order, m.lang, m.group_id, id]);
  return queryOne<FamilyValue>("SELECT * FROM family_values WHERE id = ?", [id]);
}
export async function getValuesByGroupId(groupId: string): Promise<FamilyValue[]> { return query<FamilyValue>("SELECT * FROM family_values WHERE group_id = ? ORDER BY id ASC", [groupId]); }
export async function deleteValue(id: number): Promise<boolean> { const r = await execute("DELETE FROM family_values WHERE id = ?", [id]); return r.rowsAffected > 0; }

// Branch CRUD
export async function getAllBranches(lang?: string): Promise<Branch[]> {
  if (lang) return query<Branch>("SELECT * FROM branches WHERE lang = ? ORDER BY name ASC", [lang]);
  return query<Branch>("SELECT * FROM branches ORDER BY name ASC");
}
export async function getBranchById(id: number): Promise<Branch | undefined> { return queryOne<Branch>("SELECT * FROM branches WHERE id = ?", [id]); }
export async function createBranch(data: BranchInput): Promise<Branch> {
  const r = await execute("INSERT INTO branches (name, type, description, color, lang, group_id) VALUES (?, ?, ?, ?, ?, ?)", [data.name, data.type, data.description, data.color, data.lang || "en", data.group_id || ""]);
  return (await getBranchById(Number(r.lastInsertRowid)))!;
}
export async function updateBranch(id: number, data: Partial<BranchInput>): Promise<Branch | undefined> {
  const existing = await getBranchById(id); if (!existing) return undefined;
  const m = { ...existing, ...data, group_id: data.group_id ?? existing.group_id };
  await execute("UPDATE branches SET name=?, type=?, description=?, color=?, lang=?, group_id=? WHERE id=?", [m.name, m.type, m.description, m.color, m.lang, m.group_id, id]);
  return getBranchById(id);
}
export async function getBranchesByGroupId(groupId: string): Promise<Branch[]> { return query<Branch>("SELECT * FROM branches WHERE group_id = ? ORDER BY id ASC", [groupId]); }
export async function deleteBranch(id: number): Promise<boolean> {
  await execute("UPDATE members SET branch_id = NULL WHERE branch_id = ?", [id]);
  const r = await execute("DELETE FROM branches WHERE id = ?", [id]);
  return r.rowsAffected > 0;
}
export async function getMembersByBranch(branchId: number): Promise<FamilyMember[]> { return query<FamilyMember>("SELECT * FROM members WHERE branch_id = ? ORDER BY id ASC", [branchId]); }
