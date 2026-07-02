# SoaLatihan — Deployment Guide

> Panduan lengkap deploy SoaLatihan ke VPS (Ubuntu 22.04 / Debian 12).
> Dua skenario: **Native VPS** (PM2) dan **Docker Compose**.

---

## Daftar Isi

- [Prasyarat](#prasyarat)
- [Scenario A: Native VPS Deployment](#scenario-a-native-vps-deployment)
  - [A.1. Persiapan Server](#a1-persiapan-server)
  - [A.2. Konfigurasi .env](#a2-konfigurasi-env)
  - [A.3. Menjalankan Deploy Script](#a3-menjalankan-deploy-script)
  - [A.4. Membuat Akun Admin Pertama](#a4-membuat-akun-admin-pertama)
  - [A.5. Reverse Proxy dengan Nginx](#a5-reverse-proxy-dengan-nginx)
  - [A.6. Konfigurasi Domain dengan Cloudflare Tunnel](#a6-konfigurasi-domain-dengan-cloudflare-tunnel)
- [Scenario B: Docker Compose Deployment](#scenario-b-docker-compose-deployment)
  - [B.1. Persiapan](#b1-persiapan)
  - [B.2. Konfigurasi .env](#b2-konfigurasi-env)
  - [B.3. Build & Run](#b3-build--run)
  - [B.4. Membuat Akun Admin (Docker)](#b4-membuat-akun-admin-docker)
  - [B.5. Custom Port (Docker)](#b5-custom-port-docker)
  - [B.6. Menghentikan Docker Compose](#b6-menghentikan-docker-compose)
- [Scenario C: Maintenance & Troubleshooting](#scenario-c-maintenance--troubleshooting)
  - [C.1. Backup Database](#c1-backup-database)
  - [C.2. Restore Database](#c2-restore-database)
  - [C.3. Rolling Update (Native)](#c3-rolling-update-native)
  - [C.4. Rolling Update (Docker)](#c4-rolling-update-docker)
  - [C.5. Update Environment Variables](#c5-update-environment-variables)
  - [C.6. Common Errors & Solutions](#c6-common-errors--solutions)

---

## Prasyarat

| Item | Minimum | Recommended |
|------|---------|-------------|
| OS | Ubuntu 22.04 / Debian 12 | Same |
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Storage | 10 GB | 20 GB |
| Node.js | 20+ | 20 LTS |
| PostgreSQL | 16+ | 16 |
| Akses | Root / sudo user | Same |

### Aplikasi yang harus di-install:

```bash
# Node.js 20 LTS (Native deployment only)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 (Native deployment only)
sudo npm install -g pm2

# Nginx (Reverse proxy — both scenarios)
sudo apt-get install -y nginx

# Docker + Docker Compose (Docker deployment only)
curl -fsSL https://get.docker.com | sh

# PostgreSQL (Native deployment only)
sudo apt-get install -y postgresql postgresql-contrib
```

---

## Scenario A: Native VPS Deployment

Pilihan untuk VPS tanpa Docker. Menggunakan PM2 sebagai process manager.

### A.1. Persiapan Server

```bash
# Clone repository
git clone <your-repo-url> /opt/soalatihan
cd /opt/soalatihan

# Install PostgreSQL (if not already installed)
sudo apt-get install -y postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql <<'SQL'
CREATE USER soalatihan WITH PASSWORD 'change-this-password';
CREATE DATABASE soalatihan OWNER soalatihan;
GRANT ALL PRIVILEGES ON DATABASE soalatihan TO soalatihan;
SQL

# Enable PostgreSQL on boot
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### A.2. Konfigurasi .env

```bash
cp .env.example .env
nano .env
```

Edit nilai-nilai berikut:

```env
# Application Port — change this to deploy on a different port
APP_PORT=3000

# Database — use localhost for native deployment (NOT "db")
DATABASE_URL=postgresql://soalatihan:your-secure-password@localhost:5432/soalatihan

# PostgreSQL container credentials (not used for native, but keep for reference)
POSTGRES_USER=soalatihan
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=soalatihan

# NextAuth — generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-generated-secret-here

# Public URL — change to your domain or server IP
NEXTAUTH_URL=http://your-server-ip:3000

NODE_ENV=production
```

**Important for native deployment:** In `DATABASE_URL`, use `localhost` as the host (not `db` which is the Docker service name).

### A.3. Menjalankan Deploy Script

```bash
chmod +x scripts/deploy-native.sh
./scripts/deploy-native.sh
```

Script ini otomatis menjalankan:

1. **Validasi .env** — memastikan semua variable wajib terisi
2. **Membaca APP_PORT** — secara dinamis dari .env (default: 3000)
3. **npm install** — install semua dependencies
4. **Prisma migrate** — sinkronisasi schema database (`migrate deploy` atau `db push` jika belum ada migration)
5. **Next.js build** — compile production build
6. **PM2 registration** — daftarkan aplikasi sebagai `soalatihan-app`

Output yang diharapkan:

```
[OK] Node.js version: v20.x.x
[OK] npm version: 10.x.x
[INFO] Step 1/6: Validating .env file...
[OK] .env validated — APP_PORT=3000
[INFO] Step 2/6: Installing npm dependencies...
[OK] Dependencies installed
[INFO] Step 3/6: Running Prisma migration...
[OK] Database synced
[INFO] Step 4/6: Building Next.js project...
[OK] Build complete
[INFO] Step 5/6: Configuring PM2...
[OK] PM2 process 'soalatihan-app' registered on port 3000
[INFO] Step 6/6: Deployment Summary
  ┌──────────────────────────────────────────────┐
  │  SoaLatihan Native Deployment Complete!       │
  ├──────────────────────────────────────────────┤
  │  App Name    : soalatihan-app
  │  Port        : 3000
  │  URL         : http://localhost:3000
  └──────────────────────────────────────────────┘
```

#### PM2 Auto-start on Boot

```bash
# Generate startup script
pm2 startup systemd

# Follow the instructions printed by the command above,
# then save the current process list:
pm2 save
```

### A.4. Membuat Akun Admin Pertama

```bash
# Interactive mode (will prompt for all fields)
npx tsx scripts/create-admin.ts

# Or via CLI arguments
npx tsx scripts/create-admin.ts \
  --username admin \
  --password "your-secure-password" \
  --name "Admin Utama" \
  --email admin@example.com
```

Output:

```
=== SoaLatihan — Create Admin User ===

✅ Admin user created successfully!
   ID        : 1
   Name      : Admin Utama
   Username  : admin
   Email     : admin@example.com
   Role      : ADMIN
   Active    : true
```

### A.5. Reverse Proxy dengan Nginx

Nginx berfungsi sebagai reverse proxy, meneruskan HTTP traffic ke aplikasi Next.js.

```bash
sudo nano /etc/nginx/sites-available/soalatihan
```

Isi dengan konfigurasi berikut (sesuaikan `APP_PORT` jika bukan 3000):

```nginx
server {
    listen 80;
    server_name soalatihan.example.com;  # Ganti dengan domain/IP Anda

    # Reverse proxy ke Next.js app
    location / {
        proxy_pass http://127.0.0.1:3000;  # Ganti port jika APP_PORT berbeda
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $http_scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Upload size limit (untuk import soal CSV/JSON)
    client_max_body_size 50M;

    # Static file caching
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # WebSocket support (untuk Next.js HMR jika dev mode)
    location /_next/webpack-hmr {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Aktifkan dan reload Nginx:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/soalatihan /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Enable on boot
sudo systemctl enable nginx
```

### A.6. Konfigurasi Domain dengan Cloudflare Tunnel

Cloudflare Tunnel memberi HTTPS gratis tanpa perlu SSL certificate manual.

```bash
# Install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# Login ke Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create soalatihan

# Configure tunnel — route traffic to local app port
cat > ~/.cloudflared/config.yml <<'EOF'
tunnel: soalatihan
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: soalatihan.example.com
    service: http://localhost:3000
  - service: http_status:404
EOF

# Create DNS record
cloudflared tunnel route dns soalatihan soalatihan.example.com

# Run as service
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

Dengan Cloudflare Tunnel:
- **Tidak perlu** SSL certificate di server (HTTPS ditangani Cloudflare)
- **Tidak perlu** expose port 80/443 ke publik
- Nginx opsional (Cloudflare Tunnel bisa langsung proxy ke `localhost:3000`)

---

## Scenario B: Docker Compose Deployment

Pilihan tercepat — satu command untuk seluruh stack.

### B.1. Persiapan

```bash
# Clone repository
git clone <your-repo-url> /opt/soalatihan
cd /opt/soalatihan

# Pastikan Docker dan Docker Compose terinstall
docker --version
docker compose version
```

### B.2. Konfigurasi .env

```bash
cp .env.example .env
nano .env
```

Untuk Docker Compose, gunakan `db` sebagai host di `DATABASE_URL`:

```env
# Application Port
APP_PORT=3000

# Database — "db" is the Docker Compose service name
DATABASE_URL=postgresql://soalatihan:change-this-password@db:5432/soalatihan

# PostgreSQL credentials
POSTGRES_USER=soalatihan
POSTGRES_PASSWORD=change-this-password
POSTGRES_DB=soalatihan

# NextAuth
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

NODE_ENV=production
```

### B.3. Build & Run

```bash
# Build dan jalankan semua service
docker compose up -d

# Cek status
docker compose ps

# Lihat logs
docker compose logs -f app
docker compose logs -f db
```

Aplikasi akan tersedia di `http://localhost:3000` (atau port yang Anda set di `APP_PORT`).

### B.4. Membuat Akun Admin (Docker)

```bash
# Jalankan create-admin.ts di dalam container
docker compose exec app npx tsx scripts/create-admin.ts \
  --username admin \
  --password "your-secure-password" \
  --name "Admin Utama" \
  --email admin@example.com
```

### B.5. Custom Port (Docker)

```bash
# Deploy di port 8080
APP_PORT=8080 docker compose up -d

# Atau set di .env
# APP_PORT=8080
# lalu: docker compose up -d
```

### B.6. Menghentikan Docker Compose

```bash
# Stop (data tetap tersimpan di volume)
docker compose down

# Stop dan hapus data (DESTRUCTIVE — semua data DB hilang)
docker compose down -v
```

---

## Scenario C: Maintenance & Troubleshooting

### C.1. Backup Database

#### Native (pg_dump)

```bash
# Full backup
pg_dump -U soalatihan -d soalatihan -F c -f /backup/soalatihan_$(date +%Y%m%d_%H%M%S).dump

# Compressed backup
pg_dump -U soalatihan -d soalatihan | gzip > /backup/soalatihan_$(date +%Y%m%d).sql.gz
```

#### Docker

```bash
# Backup via Docker
docker compose exec db pg_dump -U soalatihan -d soalatihan -F c -f /tmp/backup.dump
docker compose cp db:/tmp/backup.dump /backup/soalatihan_$(date +%Y%m%d).dump
```

#### Automated Backup (Cron)

```bash
# Edit crontab
crontab -e

# Tambahkan baris berikut (backup setiap hari jam 3 pagi)
0 3 * * * pg_dump -U soalatihan -d soalatihan | gzip > /backup/soalatihan_$(date +\%Y\%m\%d).sql.gz

# Untuk Docker:
# 0 3 * * * docker compose -f /opt/soalatihan/docker-compose.yml exec -T db pg_dump -U soalatihan soalatihan | gzip > /backup/soalatihan_$(date +\%Y\%m\%d).sql.gz
```

### C.2. Restore Database

#### Native

```bash
# Restore dari custom format dump
pg_restore -U soalatihan -d soalatihan -c /backup/soalatihan_20240101.dump

# Restore dari SQL dump
gunzip -c /backup/soalatihan_20240101.sql.gz | psql -U soalatihan -d soalatihan
```

#### Docker

```bash
# Copy dump ke container
docker cp /backup/soalatihan_20240101.dump soalatihan-db-1:/tmp/backup.dump

# Restore
docker compose exec db pg_restore -U soalatihan -d soalatihan -c /tmp/backup.dump
```

### C.3. Rolling Update (Native)

```bash
cd /opt/soalatihan

# 1. Pull latest code
git pull origin main

# 2. Re-run deploy script (zero-downtime restart)
./scripts/deploy-native.sh

# Atau manual:
npm install
npx prisma migrate deploy 2>/dev/null || npx prisma db push
npm run build
pm2 reload soalatihan-app
```

> **Note:** `pm2 reload` melakukan graceful restart (zero-downtime). Gunakan `pm2 restart` jika reload bermasalah.

### C.4. Rolling Update (Docker)

```bash
cd /opt/soalatihan

# Pull latest code
git pull origin main

# Rebuild dan restart (app only, db tetap jalan)
docker compose up -d --build app

# Atau full rebuild
docker compose up -d --build
```

### C.5. Update Environment Variables

#### Native

```bash
# Edit .env
nano /opt/soalatihan/.env

# Restart aplikasi
pm2 restart soalatihan-app
```

#### Docker

```bash
# Edit .env
nano /opt/soalatihan/.env

# Restart untuk membaca .env baru
docker compose up -d
```

### C.6. Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL tidak berjalan | `sudo systemctl start postgresql` (Native) atau `docker compose up -d db` (Docker) |
| `ECONNREFUSED 127.0.0.1:3000` | Aplikasi tidak berjalan | `pm2 restart soalatihan-app` (Native) atau `docker compose up -d app` (Docker) |
| `NEXTAUTH_SECRET is not configured` | NEXTAUTH_SECRET kosong di .env | Generate: `openssl rand -base64 32`, lalu isi di .env |
| `PrismaClientInitializationError` | DATABASE_URL salah atau DB tidak siap | Cek DATABASE_URL di .env; pastikan host `localhost` (native) atau `db` (Docker) |
| `502 Bad Gateway` (Nginx) | App tidak running di PORT yang diharapkan Nginx | Cek `APP_PORT` di .env, sesuaikan `proxy_pass` di Nginx config |
| `Permission denied: /app/public/uploads` | Folder uploads tidak writable | `chmod -R 755 /opt/soalatihan/public/uploads` (Native) atau cek volume mount (Docker) |
| `prisma migrate deploy` error | Migration history mismatch | Jalankan `npx prisma migrate reset --force` (HATI-HATI: menghapus semua data) |
| `pm2: command not found` | PM2 belum diinstall | `sudo npm install -g pm2` |
| `docker: command not found` | Docker belum diinstall | `curl -fsSL https://get.docker.com \| sh` |
| Port sudah digunakan | Port lain sudah pakai APP_PORT | Ubah `APP_PORT` di .env ke port lain, atau `lsof -i :3000` untuk cek |
| `relation "User" does not exist` | Database belum di-migrate | Native: `npx prisma db push` — Docker: `docker compose exec app npx prisma db push` |
| Upload file gagal (413) | Nginx body size limit | Tambah `client_max_body_size 50M;` di Nginx config |

---

## Quick Reference

| Task | Native | Docker |
|------|--------|--------|
| Deploy | `./scripts/deploy-native.sh` | `docker compose up -d` |
| Custom port | `APP_PORT=8080` di .env | `APP_PORT=8080` di .env |
| Start | `pm2 start soalatihan-app` | `docker compose start` |
| Stop | `pm2 stop soalatihan-app` | `docker compose stop` |
| Restart | `pm2 restart soalatihan-app` | `docker compose restart app` |
| Logs | `pm2 logs soalatihan-app` | `docker compose logs -f app` |
| Status | `pm2 status` | `docker compose ps` |
| Create admin | `npx tsx scripts/create-admin.ts` | `docker compose exec app npx tsx scripts/create-admin.ts` |
| DB migrate | `npx prisma migrate deploy` | `docker compose exec app npx prisma migrate deploy` |
| DB backup | `pg_dump -U soalatihan soalatihan` | `docker compose exec db pg_dump -U soalatihan soalatihan` |
