import { register } from 'node:module'

// Activate the "@/..." -> "src/..." resolver before the entry module loads.
register('./alias-loader.mjs', import.meta.url)
