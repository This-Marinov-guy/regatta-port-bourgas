// Client-readable mirror of the server-side NEXT_PUBLIC_MYPOS_DISABLED kill-switch.
// NEXT_PUBLIC_MYPOS_DISABLED is server-only, so we expose a NEXT_PUBLIC_ copy that Next.js
// inlines into the client bundle. Keep NEXT_PUBLIC_MYPOS_DISABLED in sync with
// NEXT_PUBLIC_MYPOS_DISABLED in your env files.
export const NEXT_PUBLIC_MYPOS_DISABLED =
  process.env.NEXT_PUBLIC_MYPOS_DISABLED === 'true'

// Optimistic initial value for `paymentsEnabled` state. The authoritative value
// still comes from GET /api/payments/status (which also verifies the myPOS keys
// are present and valid); this just avoids a flash of the disabled UI on mount.

export const PAYMENTS_ENABLED_DEFAULT = !NEXT_PUBLIC_MYPOS_DISABLED
