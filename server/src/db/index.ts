import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { config } from '../config.js';
import * as schema from './schema.js';

export const client = createClient({
  url: config.DB_URL,
});

export const db = drizzle(client, { schema });

export async function initDatabase(): Promise<void> {
  // Enforce foreign key constraints in SQLite
  await client.execute('PRAGMA foreign_keys = ON;');

  // Create tables idempotently
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      display_name TEXT,
      selected_contexts TEXT NOT NULL DEFAULT '[]',
      discreet_mode INTEGER NOT NULL DEFAULT 0,
      onboarding_complete INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_consents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      consent_type TEXT NOT NULL,
      granted INTEGER NOT NULL DEFAULT 1,
      granted_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_modules (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      module_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'suggested',
      rationale TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      client_updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS symptom_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_date TEXT NOT NULL,
      event_time TEXT,
      symptom TEXT NOT NULL,
      severity INTEGER,
      mood INTEGER,
      energy INTEGER,
      sleep_quality INTEGER,
      daily_impact_encrypted TEXT,
      notes_encrypted TEXT,
      medications_encrypted TEXT,
      contexts TEXT NOT NULL DEFAULT '[]',
      recorded_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      client_updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS medication_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name_encrypted TEXT NOT NULL,
      dose TEXT,
      taken_at TEXT NOT NULL,
      notes_encrypted TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      client_updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_date TEXT NOT NULL,
      provider_name TEXT,
      specialty TEXT,
      questions_encrypted TEXT,
      notes_encrypted TEXT,
      follow_up_plan_encrypted TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      client_updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS screening_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      screening_type TEXT NOT NULL,
      state TEXT NOT NULL,
      due_date TEXT,
      completed_date TEXT,
      notes_encrypted TEXT,
      clinician_plan_encrypted TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      client_updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS consultation_summaries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      what_changed TEXT NOT NULL DEFAULT '',
      main_concerns TEXT NOT NULL DEFAULT '',
      first_noticed TEXT NOT NULL DEFAULT '',
      daily_impact TEXT NOT NULL DEFAULT '',
      relevant_records TEXT NOT NULL DEFAULT '',
      questions_for_doctor TEXT NOT NULL DEFAULT '',
      selected_entry_ids TEXT NOT NULL DEFAULT '[]',
      generated_text TEXT NOT NULL DEFAULT '',
      edited_text TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS share_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      summary_id TEXT NOT NULL REFERENCES consultation_summaries(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      scope TEXT NOT NULL DEFAULT 'read_summary',
      expires_at TEXT NOT NULL,
      max_views INTEGER NOT NULL DEFAULT 5,
      view_count INTEGER NOT NULL DEFAULT 0,
      revoked_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rules_registry (
      rule_id TEXT PRIMARY KEY,
      version TEXT NOT NULL,
      status TEXT NOT NULL,
      title TEXT NOT NULL,
      min_entries INTEGER NOT NULL,
      required_inputs TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL
    );
  `);

  // Seed rules registry from shared registry if not present
  const { RULE_REGISTRY } = await import('@rechersion/shared');
  const now = new Date().toISOString();
  for (const rule of RULE_REGISTRY) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO rules_registry (rule_id, version, status, title, min_entries, required_inputs, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?);`,
      args: [
        rule.ruleId,
        rule.version,
        rule.status,
        rule.title,
        rule.minEntries,
        JSON.stringify(rule.requiredInputs),
        now,
      ],
    });
  }
}
