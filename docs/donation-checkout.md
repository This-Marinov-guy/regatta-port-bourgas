# Donation checkout API

The machine-readable OpenAPI specification is in [`donation-checkout.openapi.yaml`](donation-checkout.openapi.yaml).
Once this site is deployed, the Swagger UI is available at `https://www.regattaportbourgas.org/api-docs/donations` and the raw YAML at `https://www.regattaportbourgas.org/api-docs/donations/openapi.yaml`.

Apply `supabase/migrations/20261028120000_create_donations.sql` and `supabase/migrations/20261028130000_add_name_to_donations.sql` before deploying the API. Donations use `MYPOS_CONFIGURATION_PACK_2` and `MYPOS_KEY_INDEX_2`, with the shared `MYPOS_ENVIRONMENT`, `NEXT_PUBLIC_SITE_URL`, and Supabase service-role settings described in `docs/registration-processing.md`. Registration payments continue using the original myPOS configuration.

## Create checkout

From `https://ycpb.netlify.app`, send a JSON `POST` to `/api/donations/checkout` on this app's host:

```json
{
  "amount": "25.00",
  "name": "Ivan Petrov",
  "note": "Optional message",
  "successUrl": "https://ycpb.netlify.app/donation/thank-you",
  "failureUrl": "https://ycpb.netlify.app/donation/try-again"
}
```

Only `amount` is required. It is a positive EUR amount with at most two decimal places, up to `999999.99`. `name` is optional and limited to 200 characters; it is saved in the database and prefilled at myPOS. If omitted or blank, the server tries to save the customer name from the signed myPOS payment notification. myPOS may omit those fields, so the name can remain null. `note` is optional, limited to 500 characters, and stored only in the database. The myPOS checkout item is labelled `50 Години Яхт Клуб "Порт Бургас"`. The redirect URLs are optional and must stay on the exact `https://ycpb.netlify.app` origin. When omitted, they default to `/?donation=success` and `/?donation=failure` there.

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

Redirect the customer's browser to `checkoutUrl`. It serves a signed, auto-submitting form for myPOS. The success or failure redirect adds `donationId` to the URL query so the calling site can check the outcome.

## Payment status

`GET /api/donations/{donationId}/status` returns the amount, currency, creation time, paid time, and one of `pending`, `paid`, or `rolled_back`. The myPOS signed server notification is the source of truth for `paid`. A customer arriving at the success URL may see `pending` briefly until that notification arrives; poll the status URL to confirm payment. A cancelled checkout remains `pending` unless myPOS later sends a rollback notification.

## Internal paid donation notification

On the first verified transition to `paid`, the app emails the organizers with the amount, donor name, transaction reference, payment time, and donation ID. The note remains in the database and is not included in the email. Set `DONATION_NOTIFICATION_EMAILS` to a comma-separated list to choose donation recipients; when unset, the existing `REGISTRATION_NOTIFICATION_EMAILS` list is used. The app uses the existing `SMTP_*` configuration. Duplicate myPOS notifications and rollbacks do not send another email. Mail delivery errors are logged and do not change the payment result.

Browser API requests from other origins are rejected. This is a public checkout API; the Origin header is a browser boundary, not a credential for server-to-server callers.
