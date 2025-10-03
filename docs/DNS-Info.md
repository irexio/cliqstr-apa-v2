“DNS Master Note” for Cliqstr (to keep for later)

Registrar / Nameservers: GoDaddy (authoritative DNS).

App (Frontend): Vercel → via CNAME/A in GoDaddy.

Email: InMotion → via MX + SPF + DKIM + DMARC TXT in GoDaddy.

Resend: Works because TXT/SPF/DKIM were also added in GoDaddy.

Twilio: Domain verified via TXT in GoDaddy.