import 'dotenv/config'
import { initDb } from './db.js'
import app from './app.js'

await initDb()

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Nippu server running on :${PORT}`))
