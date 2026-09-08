import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'nippu-dev-secret-change-in-prod'
const TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60 // 90 days

export function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: TOKEN_TTL_SECONDS })
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const decoded = jwt.verify(header.slice(7), SECRET)
    req.household = decoded

    // Sliding session: once the token is past the midpoint of its lifetime,
    // reissue a fresh one on the response. An actively-used app therefore
    // never hits expiry — only ~90 days of continuous inactivity does.
    const remaining = decoded.exp - Math.floor(Date.now() / 1000)
    if (remaining < TOKEN_TTL_SECONDS / 2) {
      res.setHeader('X-Renewed-Token', sign({ householdId: decoded.householdId, householdName: decoded.householdName }))
    }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
