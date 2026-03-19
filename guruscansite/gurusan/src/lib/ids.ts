import crypto from 'crypto'
export function cuid() {
  return crypto.randomUUID().replace(/-/g, '')
}
export function now() {
  return Date.now()
}
