import { copyFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(root, 'docs/donation-checkout.openapi.yaml')
const target = resolve(root, 'public/api-docs/donations/openapi.yaml')

await mkdir(dirname(target), { recursive: true })
await copyFile(source, target)
