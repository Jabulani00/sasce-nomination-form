## Admin Login Credentials

Use the following credentials to access the SASCE Admin Panel (`login.html`).

### Allowed Admin Emails
- wana@sasce.net
- matseke@sasce.net
- admin@sasce.net
- jabula7@outlook.com

### Password
- Password@01

### Notes
- Credentials are defined (obfuscated with base64) in `auth-credentials.js` and loaded by `login.html`.
- The login system enforces up to 5 failed attempts before a 15-minute lockout.
- Successful login creates a session in `localStorage` under `sasce_admin_session`.



