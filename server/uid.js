import { randomBytes } from 'crypto'
export default () => randomBytes(8).toString('hex')
