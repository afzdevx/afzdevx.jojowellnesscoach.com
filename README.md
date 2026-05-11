# Jojo Wellness — Personal Trainer Website

A full-stack marketing and client management site for a personal trainer. Built with vanilla HTML/CSS/JS and Supabase for auth and data persistence.

## Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Auth & DB | Supabase (PostgreSQL + Auth) |
| Hosting | GitHub Pages (custom domain via CNAME) |
| PWA | Web App Manifest (installable, standalone) |

## Project Structure

```
├── index.html                  # Landing page (hero, programs, about, gallery, contact)
├── auth/
│   ├── login.html
│   ├── signup.html
│   └── reset-password.html
├── dashboard/
│   ├── admin.html              # Trainer-facing dashboard
│   └── client.html             # Client-facing dashboard
└── resources/
    ├── CSS/                    # index.css, auth.css
    ├── JS/                     # index.js, auth.js, supabase-client.js, admin/client dashboards
    └── images/
```

### Supabase Configuration

The Supabase client reads credentials from [resources/JS/supabase-client.js](resources/JS/supabase-client.js). Before running locally, set your project URL and anon key there. **Do not commit real keys** — the `.gitignore` already excludes `.env` and key files.

## Features

- **Marketing site** — Hero, programs, about, gallery, and contact sections
- **Auth flow** — Sign up, log in, and password reset via Supabase Auth
- **Dual dashboards** — Separate views for the trainer (admin) and clients
- **PWA** — Installable as a standalone app on mobile (theme: `#ff751f`)
