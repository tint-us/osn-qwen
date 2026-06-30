# SoaLatihan — AI Development Team Template

Template dokumentasi, dan agent workflow untuk project **SoaLatihan**: platform latihan soal OSN Indonesia berbasis web dengan Next.js 15 + PostgreSQL + Docker.

## Struktur

```
soalatihan/
  AGENTS.md               ← Baca ini PERTAMA sebelum apapun
  README-AI.md            ← Dokumen ini
  README.md               ← Dokumentasi aplikasi (untuk manusia/GitHub)
  GUIDE.md                ← Panduan eksekusi step-by-step per agent
  DEPLOY.md               ← Panduan deploy VPS + Docker
  run-agents.sh           ← Auto-runner untuk Qwen Code
  docker-compose.yml
  Dockerfile
  .env.example
  prisma/
    schema.prisma
    migrations/
  docs/
    global/
      product-overview.md
      coding-standard.md
      architecture-principles.md
      database-schema.md
    features/
      _template/
        prd.md
        user-stories.md
        workflow.md
        business-rules.md
        edge-cases.md
        architecture/
          feature-architecture.md
          backend-architecture.md
          web-architecture.md
        backend/
          api-contract.md
        web/
          ui-flow.md
          component-guideline.md
        qa/
          test-scenario.md
          regression-checklist.md
        release/
          release-notes.md
          deployment-checklist.md
      auth/
      study-mode/
      exam-mode/
      content-processing/
      history-analytics/
      admin-dashboard/
```

## Cara Pakai

Copy folder template saat membuat modul baru:

```bash
cp -R docs/features/_template docs/features/[nama-modul]
```

Lalu jalankan agent sesuai urutan di `AGENTS.md`.

## Urutan Eksekusi Agent

```
Phase 1 → Dokumentasi Global (product-overview, coding-standard, architecture, database-schema)
Phase 2 → Dokumentasi Per Modul (auth → study-mode → exam-mode → content-processing → history-analytics → admin-dashboard)
Phase 3 → Implementasi (BE Developer → FE Developer → QA)
Phase 4 → Deployment (Release Agent → docker-compose.yml + Dockerfile + README.md)
```

Detail prompt per agent ada di `GUIDE.md`.

## Auto Runner (Qwen Code)

```bash
# Jalankan semua phase sekaligus
./run-agents.sh

# Per phase
./run-agents.sh --phase 1
./run-agents.sh --phase 2
./run-agents.sh --phase 3
./run-agents.sh --phase 4

# Mulai dari modul tertentu
./run-agents.sh --phase 2 --from exam-mode

# Dry run (lihat prompt tanpa eksekusi)
./run-agents.sh --dry-run
```
