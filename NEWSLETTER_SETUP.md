# ReadSigil email subscription — deployment checklist

The site is static, hosted on GitHub Pages. This feature uses the **existing** Supabase Auth project `vxtchhnnfwiyniwphfpf` to verify ownership of the subscriber's email. It **does not** store addresses in GitHub or an open database table, and it does not require a new key.

## What the implementation does
- `subscribe.html` gives readers an email subscription and management page without blocking the rest of the site.
- The page requests a Supabase email magic link; opening that link verifies the email. Management requests do not auto-create new accounts.
- The visitor confirms subscription or unsubscribe. The site saves `readsigil_newsletter_opt_in` and `readsigil_newsletter_changed_at` in that verified Auth user's metadata.
- There is no public subscribers endpoint. Existing/readers' addresses are not visible to other visitors.
- No automated newsletter delivery is configured. This is a **verified registration list**, not a sending service.

## Preconditions / acceptance gates BEFORE merging to production
1. In Supabase Authentication > URL Configuration, check **Site URL** and explicitly allow `https://readsigil.com/subscribe.html` as an email redirect. Allow staging URL too if using one.
2. Check that Supabase Email OTP/magic-link delivery works using an inbox you control, and review provider sending limits / bot protection / CAPTCHA. Do not use a service-role key in a public static file.
3. Confirm the Supabase project's active status (on Free it may pause with inactivity), email sending configuration, and email templates/branding.
4. Test brand-new signup, already-registered Case Lab address, verification link expiration, repeat signup, unsubscribing, and opening the link on another device. The email link needs to return a session `access_token` in its hash (implicit flow). If the project uses PKCE or template changes, implement and test the appropriate code-exchange handler instead.
5. **Identity consideration:** newsletter sign-up also creates a Supabase Auth account for that address. Case Lab currently expects a password for sign-in; provide a password-set/recovery path before a broader launch, or migrate newsletter signups into a dedicated table with a confirmation-service backend. This is intentionally staged in a PR rather than shipped untested.
6. Validate CSP, contrast, keyboard/tab navigation, mobile viewport and success/failure copy.

## Admin subscriber list
The following SQL is for the **private Supabase SQL editor only**, not the browser, and includes only verified, currently opted-in addresses:

```sql
select email,
       raw_user_meta_data->>'readsigil_newsletter_changed_at' as consent_updated_at
from auth.users
where email_confirmed_at is not null
  and raw_user_meta_data->>'readsigil_newsletter_opt_in' = 'true'
order by email;
```

Do not publish or commit exports of this data. For sending, connect a proper email service with consent-managed lists, bounce suppression and unsubscribe controls; set the sender identity and confirm lawful notice/retention. The site does **not** send `The Signal` by email just because this PR is merged.

## Privacy & operational checklist
- Only email, subscription status, update timestamp and site source are saved as Auth profile metadata.
- Deletion requests go to `privacy@readsigil.com`; ensure that inbox is operational.
- Manage/unsubscribe requires an email ownership check; no direct public database reads or writes are exposed.
- Monitor Auth email delivery errors and project pausing; include this flow in release smoke tests.
