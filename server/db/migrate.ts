import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const MIGRATIONS_DIR = path.join(__dirname, 'migrations')

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      run_at   TEXT NOT NULL
    )
  `)

  const already = new Set(
    (db.prepare('SELECT filename FROM _migrations').all() as { filename: string }[])
      .map(r => r.filename)
  )

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()

  const insert = db.prepare('INSERT INTO _migrations (filename, run_at) VALUES (?, ?)')

  for (const file of files) {
    if (already.has(file)) continue
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
    db.exec(sql)
    insert.run(file, new Date().toISOString())
  }
}
