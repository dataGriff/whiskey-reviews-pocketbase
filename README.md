# 🥃 Whiskey Reviews

A full-stack whiskey review application built on [PocketBase](https://pocketbase.io).

## Screenshots

### Whiskey browse (home page)
![Whiskey Reviews home page](https://github.com/user-attachments/assets/0787a4c7-8e4b-4ee4-b3be-c597c23e716b)

### Whiskey detail with review
![Whiskey detail with user review](https://github.com/user-attachments/assets/eff3a64e-6a57-437e-b3f4-c165c23cf9e5)

---

## Features

- **Browse whiskeys** – public inventory of whiskies with ratings and reviews
- **User accounts** – register/login with a public username
- **Write reviews** – authenticated users rate (1–5 ⭐) and review any whiskey
- **Whiskey admins** – users with the `whiskey_admin` flag can add new whiskeys
- **Pre-seeded inventory** – 10 world-famous whiskies loaded on first boot via migrations
- **Deployable on Coolify** – single Dockerfile, persistent volume for data

---

## Stack

| Layer    | Technology                     |
|----------|-------------------------------|
| Backend  | PocketBase 0.23.4             |
| Frontend | Vanilla HTML/CSS/JS (served by PocketBase from `pb_public/`) |
| Database | SQLite (managed by PocketBase) |
| Deploy   | Docker / Coolify              |

---

## Collections

| Collection | Access                                                |
|------------|-------------------------------------------------------|
| `users`    | Built-in auth. `whiskey_admin` bool field added.      |
| `whiskeys` | List/View: **public**. Create/Update/Delete: admin.   |
| `reviews`  | List/View: **public**. Create: auth user. Update/Delete: own record. |

---

## Local Development

### Requirements

- Docker & Docker Compose

### Run

```bash
docker compose up --build
```

Open <http://localhost:8080> for the app and <http://localhost:8080/_/> for the PocketBase admin panel.

On first boot the migrations automatically:
1. Add the `whiskey_admin` field to the `users` collection
2. Create the `whiskeys` and `reviews` collections
3. Seed the database with 10 famous whiskies

### Create your first admin user

1. Open <http://localhost:8080/_/> and follow the setup wizard to create a superadmin.
2. Register a normal account at <http://localhost:8080/#/register>.
3. In the PocketBase admin panel → **Collections → users** → find your record → tick **whiskey_admin** → save.

Your account can now add whiskies via the **+ Add Whiskey** link in the navbar.

---

## Deploy on Coolify

1. Connect your repository in Coolify and select **Dockerfile** as the build pack.
2. Set the **Exposed Port** to `8080`.
3. Add a **persistent volume** mapped to `/pb/pb_data` so your data survives redeploys.
4. Optionally enable **Preview Deployments** in Coolify to get a unique URL per pull request.

> **Note:** Each preview deployment gets its own fresh database and runs migrations automatically, making it safe for testing schema changes.

---

## Project Layout

```
whiskey-reviews-pocketbase/
├── pb_migrations/
│   ├── 1731000000_init_collections.js   # Schema: users role, whiskeys, reviews
│   └── 1731000001_seed_whiskeys.js      # Seed: 10 famous whiskies
├── pb_public/
│   ├── index.html                       # SPA shell
│   ├── css/style.css                    # Amber-themed styles
│   └── js/app.js                        # Router + PocketBase SDK logic
├── Dockerfile
├── docker-compose.yml
└── README.md
```
