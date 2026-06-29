# N_COLE Interpress — DevOps Documentation

---

## Docker Setup

### Build a single service
```bash
docker build -t ncole-backend ./backend
docker build -t ncole-customers ./customers --build-arg VITE_API_URL=http://localhost:4000/api/v1
```

### Run full stack (development)
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Run full stack (production)
```bash
# Ensure all required env vars are set
export POSTGRES_PASSWORD=your_strong_password
export ACCESS_TOKEN_SECRET=your_64_char_secret
export REFRESH_TOKEN_SECRET=your_other_64_char_secret
export GEMINI_API_KEY=your_gemini_key
export CORS_ORIGIN=https://ncoleinterpress.com

docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Useful Docker commands
```bash
# View all container statuses
docker-compose ps

# View backend logs in real time
docker-compose logs -f backend

# Execute command in running container
docker-compose exec backend npx prisma migrate deploy
docker-compose exec postgres psql -U ncole -d ncole_interpress

# Stop and remove containers (keeps volumes)
docker-compose down

# Stop, remove containers AND volumes (DESTROYS ALL DATA)
docker-compose down -v
```

---

## GitHub Actions

### Required Repository Secrets

Set in GitHub → Settings → Secrets and Variables → Actions:

```
# Render (backend deployment)
RENDER_API_KEY          = your Render API key
RENDER_SERVICE_ID       = your Render service ID
BACKEND_URL             = https://your-backend.onrender.com

# Vercel (frontend deployment)
VERCEL_TOKEN            = your Vercel token
VERCEL_ORG_ID           = your Vercel org ID
VERCEL_PROJECT_STOREFRONT = Vercel project ID for storefront
VERCEL_PROJECT_CUSTOMERS  = Vercel project ID for customers
VERCEL_PROJECT_VENDORS    = Vercel project ID for vendors
VERCEL_PROJECT_ADMIN      = Vercel project ID for admin
VERCEL_PROJECT_RIDER      = Vercel project ID for rider

# Shared
VITE_API_URL            = https://your-backend.onrender.com/api/v1
PRODUCTION_DATABASE_URL = postgresql://user:pass@host:5432/ncole_interpress
```

### Branch Protection (recommended settings)

For `main` branch:
- Require status checks: `backend`, `frontend (Storefront)`, `frontend (Customer Portal)`, ...
- Require pull request reviews: 1 reviewer minimum
- Dismiss stale reviews on new commits
- Require conversation resolution before merging

---

## Deployment Process

### First deployment

1. **Provision database**: Create PostgreSQL instance on Render, Supabase, or Neon
2. **Deploy backend**:
   - Create Render Web Service
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npx prisma migrate deploy && node dist/server.js`
   - Add all environment variables
3. **Deploy frontends** (one Vercel project per portal):
   - Import from GitHub, set root directory
   - Add `VITE_API_URL` environment variable
4. **Configure DNS** (optional): Point subdomains to Vercel projects
5. **Seed initial admin**: `npm run prisma:seed` (update seed.ts with admin credentials)

### Subsequent deployments

Push to `main` branch → GitHub Actions handles everything automatically.

---

## Monitoring & Observability

### Health endpoint
```bash
GET /health
# Response: { "status": "ok", "ts": "2026-01-01T00:00:00.000Z" }
```

### Log locations (Docker)
```bash
# Application logs
docker volume inspect ncole-backend-logs

# Nginx access/error logs
docker volume inspect ncole-nginx-logs

# Direct file access
docker-compose exec backend cat /app/logs/combined.log
docker-compose exec backend cat /app/logs/error.log
```

### Activity log queries (admin SQL)
```sql
-- Recent logins
SELECT * FROM activity_logs WHERE action = 'LOGIN' ORDER BY created_at DESC LIMIT 50;

-- Failed actions today
SELECT * FROM activity_logs WHERE created_at >= NOW() - INTERVAL '24 hours' ORDER BY created_at DESC;

-- Audit trail for a specific order
SELECT * FROM activity_logs WHERE entity = 'Order' AND entity_id = '<order_id>';
```

---

## Backup & Recovery

### Automated backup (daily at 2am via cron)
```bash
crontab -e
# Add:
0 2 * * * POSTGRES_HOST=localhost POSTGRES_USER=ncole POSTGRES_PASSWORD=xxx POSTGRES_DB=ncole_interpress /path/to/scripts/backup.sh
```

### Manual backup
```bash
./scripts/backup.sh
# Creates: /backups/ncole_backup_YYYYMMDD_HHMMSS.sql.gz
```

### Restore
```bash
./scripts/restore.sh /backups/ncole_backup_20260101_020000.sql.gz
# Will prompt for confirmation before overwriting
```

### Backup retention
Default: 7 days. Configure via `BACKUP_RETENTION_DAYS` environment variable.

### Disaster Recovery Plan

1. **Data loss discovered**: Immediately stop writes to prevent further corruption
2. **Identify last good backup**: `ls -la /backups/ncole_backup_*.sql.gz`
3. **Provision new DB instance** (if hardware failure): Create fresh PostgreSQL instance
4. **Restore backup**: `./scripts/restore.sh <backup_file>`
5. **Run any pending migrations**: `npx prisma migrate deploy`
6. **Verify data integrity**: Spot-check key tables
7. **Resume traffic**: Update `DATABASE_URL` and restart backend

**Recovery Time Objective (RTO)**: ~30 minutes  
**Recovery Point Objective (RPO)**: ~24 hours (daily backups)

---

## Security Checklist

- [ ] `ACCESS_TOKEN_SECRET` is at least 64 random characters
- [ ] `REFRESH_TOKEN_SECRET` is at least 64 random characters, different from access secret
- [ ] `POSTGRES_PASSWORD` is strong and not reused
- [ ] `GEMINI_API_KEY` is restricted to this application in Google Cloud console
- [ ] CORS_ORIGIN contains only your actual frontend domains
- [ ] All `.env` files are in `.gitignore`
- [ ] No secrets in Docker images (use runtime environment variables)
- [ ] HTTPS/SSL configured (Let's Encrypt via Certbot or Render/Vercel native SSL)
- [ ] `npm audit` passes with no high/critical vulnerabilities
- [ ] Database not publicly accessible (private network only)
- [ ] Nginx rate limiting configured
- [ ] Regular backup schedule verified and tested
- [ ] Activity logs reviewed periodically for anomalies
