/**
 * Usage: node scripts/hash-studio-credentials.mjs <username> <password>
 *
 * Outputs the SHA-256 hashes to store in:
 *   STUDIO_USER_HASH
 *   STUDIO_PASSWORD_HASH
 *
 * Store these hashes in 1Password and reference them via op:// in .env.local
 * and as environment variables in Vercel. Never store the raw credentials anywhere.
 */

import { createHash } from 'crypto'

const [,, user, pwd] = process.argv

if (!user || !pwd) {
  console.error('Usage: node scripts/hash-studio-credentials.mjs <username> <password>')
  process.exit(1)
}

const userHash = createHash('sha256').update(user).digest('hex')
const pwdHash  = createHash('sha256').update(pwd).digest('hex')

console.log('\nAdd these to 1Password and Vercel env vars:\n')
console.log(`STUDIO_USER_HASH=${userHash}`)
console.log(`STUDIO_PASSWORD_HASH=${pwdHash}`)
console.log('\nDo NOT store the raw username or password anywhere.')
