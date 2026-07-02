---
name: soalatihan-deployment
description: Reusable deployment patterns for SoaLatihan — Dockerfile multi-stage with Next.js standalone + Prisma client, docker-compose healthchecks, APP_PORT threading, Prisma migration fallback, native VPS deploy script, CLI admin creation
source: auto-skill
extracted_at: '2026-07-02T06:10:43.281Z'
---

# SoaLatihan Deployment Patterns

Established during Phase 4 (Release Agent — Deployment Documentation & README). Apply these when modifying deployment config, Docker files, env setup, or native VPS scripts.

## 1. Prisma Migration Fallback in Dockerfile CMD

**Rule:** The Dockerfile CMD uses `prisma migrate deploy 2>/dev/null || prisma db push` as a fallback, because the project has no Prisma migration files yet (only `schema.prisma`).

**Why:** `prisma migrate deploy` requires existing migration files in `prisma/migrations/`. The project uses `prisma db push` during development (schema-to-DB sync without migration history). In production Docker, if no migrations exist, `migrate deploy` fails silently (stderr suppressed) and `db push` takes over. Without this fallback, the container would crash on first boot.

**How to apply:**
```dockerfile
CMD ["sh", "-c", "prisma migrate deploy 2>/dev/null || prisma db push; exec node server.js"]
```
- The `2>/dev/null` suppresses the "no migrations found" error message
- `exec node server.js` replaces the shell process with Node (PID 1) for proper signal handling
- If migration files ARE added later, `migrate deploy` will succeed and `db push` is skipped
- `prisma` and `tsx` are installed globally in the runner stage: `RUN npm install -g prisma tsx`

## 2. Next.js Standalone Docker Build with Prisma Client Files

**Rule:** The Dockerfile uses `output: "standalone"` (set in `next.config.mjs`) to produce a minimal `.next/standalone` directory. The runner stage copies a specific set of files — including Prisma client artifacts that are NOT part of the standalone output.

**Why:** Next.js standalone mode traces imports and bundles only what's needed into `.next/standalone/`, excluding `node_modules` except for truly required packages. However, Prisma's generated client lives in `node_modules/.prisma` and `node_modules/@prisma`, which standalone mode does NOT include. Without explicitly copying these, the app crashes at runtime with "Cannot find module @prisma/client".

**Prerequisites (must exist before Dockerfile works):**
- `next.config.mjs` must have `output: "standalone"`
- `package.json` must have `"scripts": { "build": "next build", "start": "next start", "postinstall": "prisma generate" }`

**Runner stage file copy list (all required):**
```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./        # Next.js server + minimal node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static  # Static assets (JS/CSS chunks)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public              # Public assets (images, uploads dir)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma              # Schema for migrate/db-push at runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma   # Prisma client (generated)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma   # Prisma client engine
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts            # CLI scripts (create-admin.ts)
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json  # For npx tsx to resolve
```

**How to apply:**
- The `deps` stage runs `npm ci` (needs `package.json`, `package-lock.json`, and `prisma/` for `postinstall: prisma generate`)
- The `builder` stage copies full source, runs `npx prisma generate` then `npm run build`
- The `runner` stage uses a non-root user (`nextjs:nodejs`, uid 1001)
- `EXPOSE 3000` is declarative — actual port is controlled by `APP_PORT` env (see Section 3)

## 3. APP_PORT Variable Threading (Not PORT)

**Rule:** The project uses `APP_PORT` (not the conventional `PORT`) as the user-facing environment variable for the application port. This variable is threaded through `.env`, `docker-compose.yml`, the Dockerfile, and the native deploy script.

**Why:** The user explicitly required `APP_PORT` as the variable name. Next.js internally uses `PORT` for `node server.js`, so the Dockerfile sets `ENV PORT=3000` as a default, but docker-compose.yml overrides it with the `APP_PORT` value. This decouples the user-facing config name from Next.js's internal variable.

**How to apply:**
- `.env.example`: `APP_PORT=3000` with comment explaining custom port usage
- `docker-compose.yml` app service:
  ```yaml
  ports:
    - "${APP_PORT:-3000}:${APP_PORT:-3000}"
  environment:
    PORT: ${APP_PORT:-3000}    # Override Dockerfile's ENV PORT
  ```
  Both host and container port use `APP_PORT` — the container listens on the same port the host exposes.
- `Dockerfile`: `ENV PORT=3000` (default, overridden by compose)
- `scripts/deploy-native.sh`: reads `APP_PORT` from `.env` via `source`, passes to PM2: `pm2 start npm --name "$APP_NAME" -- start -- -p "$APP_PORT"`
- Custom port usage: `APP_PORT=8080 docker compose up -d` or set in `.env`

## 4. Docker Compose Healthcheck + depends_on Condition

**Rule:** The `db` service has a `pg_isready` healthcheck, and the `app` service uses `depends_on: db: condition: service_healthy` — the app waits for the DB to be ready before starting.

**Why:** Without the healthcheck, `depends_on: db` only waits for the container to start, not for PostgreSQL to accept connections. The app's Prisma migration (`prisma migrate deploy` in CMD) would fail if it runs before PostgreSQL is ready. The healthcheck ensures `pg_isready` returns success before the app container starts.

**How to apply:**
```yaml
db:
  image: postgres:16-alpine
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-soalatihan} -d ${POSTGRES_DB:-soalatihan}"]
    interval: 10s
    timeout: 5s
    retries: 5

app:
  depends_on:
    db:
      condition: service_healthy
```
- `pg_isready` checks if PostgreSQL accepts connections for the specified user/db
- 5 retries × 10s interval = up to 50s wait (sufficient for cold PostgreSQL start)
- Both services use `restart: unless-stopped` and are on a shared bridge network

## 5. Docker Compose DATABASE_URL Override

**Rule:** The `app` service in `docker-compose.yml` sets `DATABASE_URL` in the `environment` section, overriding whatever is in `.env`. This ensures the app always connects to the `db` service hostname, not `localhost`.

**Why:** The `.env.example` has `DATABASE_URL=postgresql://...@db:5432/...` for Docker, but native deployment needs `@localhost:5432`. By overriding `DATABASE_URL` in the compose `environment` section (which takes precedence over `env_file`), the Docker setup always uses the correct `db` hostname even if the user forgot to change it in `.env`.

**How to apply:**
```yaml
app:
  env_file:
    - .env
  environment:
    DATABASE_URL: postgresql://${POSTGRES_USER:-soalatihan}:${POSTGRES_PASSWORD:-change-this-password}@db:5432/${POSTGRES_DB:-soalatihan}
```
- `env_file` loads all vars from `.env` first
- `environment` overrides specific vars — `DATABASE_URL` is recomposed from `POSTGRES_*` vars with `db` as host
- Native deployment: user sets `DATABASE_URL` with `localhost` directly in `.env` (no override)

## 6. Uploads Volume Mount (Docker Compose)

**Rule:** The `app` service mounts `./public/uploads:/app/public/uploads` as a bind mount, and the Dockerfile creates `/app/public/uploads/questions` with correct ownership.

**Why:** Uploaded question images must persist across container rebuilds. Without the volume mount, uploads are lost when the container is recreated (`docker compose up -d --build`). The bind mount maps the host directory directly, so files are visible on the host filesystem.

**How to apply:**
```yaml
app:
  volumes:
    - ./public/uploads:/app/public/uploads
```
```dockerfile
RUN mkdir -p /app/public/uploads/questions && \
    chown -R nextjs:nodejs /app/public/uploads
```
- The Dockerfile creates the `questions` subdirectory and sets ownership to `nextjs:nodejs`
- The bind mount overlays the host directory — if the host dir doesn't exist, Docker creates it as root (may need `chown` on host)
- PostgreSQL data uses a named volume (`pgdata`), not a bind mount — managed by Docker

## 7. CLI Admin Creation Script Pattern

**Rule:** `scripts/create-admin.ts` creates the first admin user via CLI, supporting both interactive prompts and CLI arguments. Uses `bcryptjs` (same as the app), validates username/email uniqueness, and creates with `role: "ADMIN"`.

**Why:** After a fresh deployment, there's no admin account to log in with. The API's user creation endpoint requires authentication (admin-only), creating a chicken-and-egg problem. The CLI script bypasses the API and writes directly to the DB via Prisma.

**How to apply:**
```bash
# Interactive mode
npx tsx scripts/create-admin.ts

# CLI args mode
npx tsx scripts/create-admin.ts \
  --username admin --password secret --name "Admin" --email admin@example.com
```
- Uses a standalone `PrismaClient` instance (not the app's singleton) — directly `new PrismaClient()`
- Password masking in interactive mode uses `process.stdin.on("data")` to replace typed chars with backspaces
- Username uniqueness checked via `prisma.user.findUnique({ where: { username } })` before insert
- Email is optional (`email || null`), but if provided, uniqueness is also checked
- Password validation: minimum 6 characters
- Disconnects Prisma in `.finally()` to prevent hanging process
- In Docker: `docker compose exec app npx tsx scripts/create-admin.ts`

## 8. Native VPS Deploy Script Pattern

**Rule:** `scripts/deploy-native.sh` automates the full native deployment: validate `.env` → npm install → Prisma migrate → build → PM2 registration. Reads `APP_PORT` dynamically from `.env`.

**Why:** Native VPS deployment (without Docker) has many manual steps. The script encapsulates them into a single command with colored output and error handling (`set -euo pipefail`).

**Script structure:**
1. **Pre-flight:** Check `node` and `npm` exist
2. **Validate .env:** `source "$ENV_FILE"` then check required vars (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`); read `APP_PORT` with default 3000
3. **npm install:** Full install (not `ci` — VPS may not have lockfile in sync)
4. **Prisma migrate:** `npx prisma migrate deploy 2>/dev/null || npx prisma db push` (same fallback as Dockerfile)
5. **Build:** `npm run build`
6. **PM2:** Stop/delete existing process if running, then `pm2 start npm --name "$APP_NAME" -- start -- -p "$APP_PORT"`

**How to apply:**
- Script is executable: `chmod +x scripts/deploy-native.sh`
- PM2 process name: `soalatihan-app` (hardcoded constant)
- The `-- -p "$APP_PORT"` passes the port to `next start` which forwards to `node server.js`
- `pm2 save` persists the process list for auto-restart on reboot
- `pm2 startup` must be run separately to enable boot-time auto-start
- For updates: re-run the script (it stops/deletes existing PM2 process first)

## 9. Nginx Reverse Proxy with Adaptive Port

**Rule:** The Nginx config uses `proxy_pass http://127.0.0.1:3000` — the port must match `APP_PORT` from `.env`. If the user changes `APP_PORT`, they must also update the Nginx config.

**Why:** Nginx sits in front of the Next.js app and forwards HTTP traffic. The app listens on `APP_PORT` (set via PM2 or Docker), and Nginx proxies to that port. There's no automatic sync — the user must manually keep them in sync.

**How to apply:**
```nginx
location / {
    proxy_pass http://127.0.0.1:3000;  # Must match APP_PORT in .env
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $http_scheme;
}
client_max_body_size 50M;  # For question import (CSV/JSON/XML files)
```
- `client_max_body_size 50M` is required for the content import feature (large CSV/JSON files)
- Static caching for `/_next/static/` with `expires 365d`
- Cloudflare Tunnel alternative: no Nginx needed, `cloudflared` proxies directly to `localhost:APP_PORT`

## 10. Environment Variable Inventory

The complete set of env vars used by the project:

| Variable | Used By | Default | Purpose |
|----------|---------|---------|---------|
| `APP_PORT` | docker-compose, deploy script, Dockerfile (as PORT) | 3000 | Public/local port |
| `DATABASE_URL` | Prisma (`lib/prisma.ts`) | — | PostgreSQL connection string |
| `POSTGRES_USER` | docker-compose (db service) | soalatihan | DB container user |
| `POSTGRES_PASSWORD` | docker-compose (db service) | change-this-password | DB container password |
| `POSTGRES_DB` | docker-compose (db service) | soalatihan | DB container database name |
| `NEXTAUTH_SECRET` | NextAuth + `lib/admin/config.ts` (AES key) | — | JWT signing + encryption key |
| `NEXTAUTH_URL` | NextAuth | http://localhost:3000 | Public deployment URL |
| `NODE_ENV` | Next.js | production | Runtime environment |

**Critical:** `NEXTAUTH_SECRET` serves dual purpose — it's both the NextAuth JWT signing secret AND the master key for AES-256-GCM encryption of AppConfig values (via `crypto.scryptSync(secret, "soalatihan-salt", 32)` in `lib/admin/config.ts`). Changing it after data is encrypted will make existing encrypted AppConfig values unreadable.

## File Inventory (Phase 4)

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage production build (deps → builder → runner) |
| `Dockerfile.dev` | Dev image with hot reload (`npm run dev`) |
| `docker-compose.yml` | 2 services: app + db (postgres:16-alpine) |
| `.env.example` | All env vars with comments, uses `APP_PORT` |
| `scripts/create-admin.ts` | CLI admin user creation (interactive + args) |
| `scripts/deploy-native.sh` | Native VPS deployment automation (PM2) |
| `DEPLOY.md` | Comprehensive guide: Native, Docker, Maintenance |
