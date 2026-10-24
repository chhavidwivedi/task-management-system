
import 'dotenv/config'
import pool from './db.js'

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user'
          CHECK (role IN ('user', 'admin')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT DEFAULT '',
        priority VARCHAR(20) NOT NULL DEFAULT 'Medium'
          CHECK (priority IN ('Low', 'Medium', 'High')),
        status VARCHAR(20) NOT NULL DEFAULT 'To Do'
          CHECK (status IN ('To Do', 'In Progress', 'Completed')),
        due_date DATE,
        created_by INTEGER NOT NULL REFERENCES users(id),
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_created_by
        ON tasks(created_by);

      CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to
        ON tasks(assigned_to);

      CREATE INDEX IF NOT EXISTS idx_tasks_status
        ON tasks(status);
    `)

    console.log('Database tables created successfully.')
  } catch (error) {
    console.error('Database setup failed:', error.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

await initDb()
