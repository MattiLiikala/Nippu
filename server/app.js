import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import listRoutes from './routes/lists.js'
import recipeRoutes from './routes/recipes.js'

const app = express()
app.use(cors({ exposedHeaders: ['X-Renewed-Token'] }))
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/lists', listRoutes)
app.use('/api/recipes', recipeRoutes)

export default app
