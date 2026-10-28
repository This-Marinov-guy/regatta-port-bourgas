# Donation checkout API

The machine-readable OpenAPI specification is in [`donation-checkout.openapi.yaml`](donation-checkout.openapi.yaml).
Once this site is deployed, the Swagger UI is available at `https://www.regattaportbourgas.org/api-docs/donations` and the raw YAML at `https://www.regattaportbourgas.org/api-docs/donations/openapi.yaml`.

Apply `supabase/migrations/20261028120000_create_donations.sql` and `supabase/migrations/20261028130000_add_name_to_donations.sql` before deploying the API. Donations use `STRIPE_DONATIONS_SECRET_KEY` and `STRIPE_DONATIONS_WEBHOOK_SECRET`. Set `NEXT_PUBLIC_SITE_URL` to the public HTTPS origin of this app and configure the Supabase service-role settings described in `docs/registration-processing.md`. Registration payments continue using the original myPOS configuration. Existing pending myPOS donation checkouts can still complete while the old notification credentials remain configured.

Use the **Cold Lake Technologies** Stripe account (`acct_1SplQNCWBeUhnnF9`) for donations. Register a **snapshot** webhook destination in the same Stripe mode and account as `STRIPE_DONATIONS_SECRET_KEY`. Its URL is `https://www.regattaportbourgas.org/api/stripe/donations/webhook`; subscribe to `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Use that destination's signing secret for `STRIPE_DONATIONS_WEBHOOK_SECRET`. Test and live mode have separate API keys, webhook destinations, and signing secrets. Hosted Stripe Checkout needs no publishable key in this app.

## Create checkout

From `https://ycpb.netlify.app`, send a JSON `POST` to `/api/donations/checkout` on this app's host. The browser sets `Origin: https://ycpb.netlify.app` automatically for this cross-origin request; do not set it in frontend code. The Swagger UI is hosted on the API domain, so its "Try it out" requests are rejected by the origin check.

```json
{
  "amount": "25.00",
  "name": "Ivan Petrov",
  "note": "Optional message",
  "successUrl": "https://ycpb.netlify.app/donation/thank-you",
  "failureUrl": "https://ycpb.netlify.app/donation/try-again"
}
```

Only `amount` is required. It is a EUR amount from `0.50` to `999999.99`, with at most two decimal places. `name` is optional and limited to 200 characters; it is saved in the database. If omitted or blank, the server tries to save the payer name from Stripe's signed checkout event. Stripe may omit it, so the name can remain null. `note` is optional, limited to 500 characters, and stored only in the database. The Stripe Checkout item is labelled `50 години Яхт Клуб "Порт Бургас"`, and checkout is displayed in Bulgarian. The redirect URLs are optional and must stay on the exact `https://ycpb.netlify.app` origin. When omitted, they default to `/?donation=success` and `/?donation=failure` there.

The API returns HTTP 201 with:

```json
{
  "donationId": "uuid",
  "checkoutUrl": "https://this-app.example/api/donations/uuid/checkout",
  "statusUrl": "https://this-app.example/api/donations/uuid/status",
  "status": "pending",
  "amount": "25.00",
  "currency": "EUR"
}
```

Redirect the customer's browser to `checkoutUrl`. It returns a `303` redirect to the Stripe-hosted Checkout Session. The success or failure redirect adds `donationId` to the URL query so the calling site can check the outcome. An expired checkout requires a new `POST /api/donations/checkout`.

## Payment status

`GET /api/donations/{donationId}/status` returns the amount, currency, creation time, paid time, and one of `pending`, `paid`, or `rolled_back`. A signed Stripe Checkout event with `payment_status=paid` is the source of truth for new donations. A customer arriving at the success URL may see `pending` briefly until the event arrives; poll the status URL to confirm payment. A cancelled or expired Stripe checkout remains `pending`. `rolled_back` is retained for legacy myPOS donation reversals.

## Internal paid donation notification

On the first verified transition to `paid`, the app emails the organizers with the amount, donor name, transaction reference, payment time, and donation ID. The note remains in the database and is not included in the email. Set `DONATION_NOTIFICATION_EMAILS` to a comma-separated list to choose donation recipients; when unset, the existing `REGISTRATION_NOTIFICATION_EMAILS` list is used. The app uses the existing `SMTP_*` configuration. Duplicate Stripe events do not send another email. Mail delivery errors are logged and do not change the payment result.

Browser API requests from other origins are rejected. This is a public checkout API; the Origin header is a browser boundary, not a credential for server-to-server callers.
