import { existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const SRC_ROOT = path.resolve(process.cwd(), 'src')
const CANDIDATE_SUFFIXES = ['.ts', '.tsx', '.js', '.mjs', '/index.ts', '/index.tsx']

// Resolve TypeScript path aliases ("@/..." -> "src/...") for one-off scripts
// run with `node --experimental-strip-types`, which does not read tsconfig paths.
export async function resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) {
    const base = path.join(SRC_ROOT, specifier.slice(2))
    const resolved = path.extname(base)
      ? base
      : CANDIDATE_SUFFIXES.map((suffix) => `${base}${suffix}`).find((candidate) =>
          existsSync(candidate)
        ) ?? `${base}.ts`

    return next(pathToFileURL(resolved).href, context)
  }

  return next(specifier, context)
}
