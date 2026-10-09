# Security Policy

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Email **[security@agronavis.example]** with:

- what the problem is, and which part of the system it affects
- the steps to reproduce it
- what an attacker could do with it
- anything you already know about a fix

You will get an acknowledgement within **3 working days** and an assessment
within **10 working days**. If we accept the report we will tell you when a fix
is released, and we will credit you by name unless you would rather we did not.

Please give us a reasonable chance to fix a problem before describing it
publicly. We will not pursue legal action against anyone who reports in good
faith, stays within the scope below, and does not access or destroy other
people's data.

## Scope

**In scope**

- The Agronavis API (`agronavis-api.onrender.com`)
- The Android application
- This repository's source code and configuration
- The Supabase schema, including Row Level Security policies

**Out of scope**

- Third-party services we depend on — report those to their own teams:
  Supabase, Render, Mapbox, NASA POWER, OpenWeatherMap, Agmarknet
- Findings from automated scanners with no demonstrated impact
- Denial of service through traffic volume
- Missing hardening headers with no exploitable consequence
- Social engineering of our team or our users

## What we are most interested in

Given what this system holds, these matter most:

| Area                          | Why it matters                                                         |
| ----------------------------- | ---------------------------------------------------------------------- |
| **Cross-tenant data access**  | One farmer reading or changing another farmer's farms, fields or scans |
| **Authentication bypass**     | Reaching an endpoint without a valid token, or with someone else's     |
| **Service-role key exposure** | That key bypasses Row Level Security entirely                          |
| **Location privacy**          | Field boundaries are precise coordinates of someone's livelihood       |
| **Upload handling**           | The scanner accepts images; path traversal or decoder abuse            |

## How this system is defended

Context for anyone assessing it:

- The mobile app never connects to the database. Every read and write goes
  through the API, which is the only holder of the service-role key and the
  third-party keys.
- Access tokens are verified against Supabase's published signing keys on every
  request, and ownership of the row being touched is checked explicitly in the
  service layer.
- Row Level Security is enabled on every table as a second line of defence, not
  the first — the service-role key bypasses it by design.
- Only values safe to publish are compiled into the app. Anything secret is
  held server-side or injected at build time.
- Two-factor authentication is available, and the TOTP secret is encrypted at
  rest.

## Supported versions

Only the current release receives security fixes. See
[CHANGELOG.md](CHANGELOG.md) for what that is.
