# Optional registered scores (not yet provisioned)

ReadSigil currently deploys as static files. Guest progress and scores work entirely offline in this browser, and report export works without an account.

For actual optional account registration and cross-device result history:

1. Create a Supabase project owned by the site administrator. Enable verified-email authentication, configure allowed redirect/site domains and bot/rate-limit protections.
2. Run `supabase.sql` in the SQL editor. Confirm Row Level Security policies are enabled and test as two distinct users.
3. Configure `auth-config.js` with the project URL and **public/publishable anonymous key only**. Never put a service-role key, database password, signing key or server secret in the public repository.
4. Test email verification, sign-in, session expiry, score saves, history reads, and row isolation.
5. Communicate consent/privacy terms and retention/deletion mechanism before public launch.

These are **practice scores**. They are calculated in the browser, so authenticated storage by itself does not make them tamper-proof or suitable for recruitment/credentialing. For certified scores move scoring to a trusted server, require signed assessment sessions, and validate evidence/answers server-side.

Do not claim registered scores are available until the live project is provisioned and tested.
