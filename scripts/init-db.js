import 'dotenv/config'
import { initDb, closeDb } from '../server/db.js'

console.log('Initializing database…')
await initDb()
await closeDb()
console.log('Database ready.')
