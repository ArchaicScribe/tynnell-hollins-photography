/**
 * Reads a required environment variable, throwing a clear error if it is
 * missing or empty. Use this at module load (e.g. when constructing an SDK
 * client) so a misconfigured deployment fails loudly with an obvious message
 * instead of passing `undefined` deep into an SDK and crashing cryptically.
 */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}
