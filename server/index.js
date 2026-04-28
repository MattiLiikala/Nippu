import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import listRoutes from './routes/lists.js'
import recipeRoutes from './routes/recipes.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/lists', listRoutes)
app.use('/api/recipes', recipeRoutes)

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  const dist = join(__dirname, '..', 'dist')
  app.use(express.static(dist))
  app.get('*', (_, res) => res.sendFile(join(dist, 'index.html')))
}

app.listen(PORT, () => console.log(`Nippu server running on :${PORT}`))
