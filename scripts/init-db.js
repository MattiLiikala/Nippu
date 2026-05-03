import 'dotenv/config'
import { initDb } from '../server/db.js'

console.log('Initializing database…')
await initDb()
console.log('Database ready.')
