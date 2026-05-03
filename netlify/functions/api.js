import serverless from 'serverless-http'
import { initDb } from '../../server/db.js'
import app from '../../server/app.js'

let ready = false
const wrapped = serverless(app)

export async function handler(event, context) {
  if (!ready) {
    await initDb()
    ready = true
  }
  return wrapped(event, context)
}
