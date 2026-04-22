import type { Client } from '@libsql/client'
import fs from 'fs'
import path from 'path'

const MIGRATIONS_DIR = path.join(__dirname, 'migrations')

export async function runMigrations(db: Client): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      run_at   TEXT NOT NULL
    )
  `)

  const { rows } = await db.execute('SELECT filename FROM _migrations')
  const already = new Set(rows.map(r => String(r[0])))

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    if (already.has(file)) continue
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
    await db.execute(sql)
    await db.execute({
      sql: 'INSERT INTO _migrations (filename, run_at) VALUES (?, ?)',
      args: [file, new Date().toISOString()],
    })
  }
}
