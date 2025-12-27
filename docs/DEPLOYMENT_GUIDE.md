# Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Platforms](#deployment-platforms)
4. [Vercel Deployment](#vercel-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Backend Deployment](#backend-deployment)
7. [Post-Deployment](#post-deployment)
8. [Rollback Procedures](#rollback-procedures)
9. [Monitoring](#monitoring)

## Overview

This guide covers deploying the Admin Dashboard to production. The application consists of two main components:

1. **Frontend**: Next.js application (Admin Dashboard)
2. **Backend**: Django REST API

### Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│              CDN / Load Balancer                │
│         (Vercel / Cloudflare / AWS)             │
└────────────┬────────────────────────────────────┘
             │
             ├─────────────────┬──────────────────┐
             │                 │                  │
    ┌────────▼────────┐ ┌─────▼──────┐  ┌───────▼────────┐
    │  Next.js App    │ │ Django API │  │   PostgreSQL   │
    │  (Frontend)     │ │ (Backend)  │  │   Database     │
    └─────────────────┘ └────────────┘  └────────────────┘
```

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Code reviewed and approved
- [ ] All features tested in staging

### Configuration

- [ ] Environment variables configured
- [ ] API endpoints verified
- [ ] CORS settings updated
- [ ] Database migrations ready
- [ ] Static files configured

### Security

- [ ] Secrets rotated for production
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Authentication tested

### Performance

- [ ] Bundle size optimized
- [ ] Images optimized
- [ ] Caching configured
- [ ] Database indexed
- [ ] CDN configured

### Documentation

- [ ] Deployment steps documented
- [ ] Environment variables documented
- [ ] Rollback procedure documented
- [ ] Monitoring setup documented

## Deployment Platforms

### Recommended Platforms

**Frontend (Next.js)**:
- **Vercel** (Recommended) - Native Next.js support
- **Netlify** - Good alternative
- **AWS Amplify** - AWS integration
- **Docker** - Self-hosted option

**Backend (Django)**:
- **AWS EC2** - Full control
- **Heroku** - Easy deployment
- **DigitalOcean** - Cost-effective
- **Docker** - Containerized deployment

## Vercel Deployment

### Prerequisites

- Vercel account
- GitHub/GitLab repository
- Environment variables ready

### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Select the `admin-dashboard` directory as root

### Step 2: Configure Build Settings

**Framework Preset**: Next.js

**Build Command**:
```bash
npm run build
```

**Output Directory**:
```
.next
```

**Install Command**:
```bash
npm install
```

### Step 3: Set Environment Variables

In Vercel dashboard, add environment variables:

```
NEXT_PUBLIC_API_BASE_URL=https://api.scrapiz.in/api
NEXT_PUBLIC_FRONTEND_SECRET=your_production_secret
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Verify deployment at provided URL

### Step 5: Configure Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain: `admin.scrapiz.in`
3. Configure DNS records as instructed
4. Wait for SSL certificate provisioning

### Vercel CLI Deployment

Install Vercel CLI:
```bash
npm install -g vercel
```

Deploy:
```bash
cd admin-dashboard
vercel --prod
```

## Docker Deployment

### Frontend Dockerfile

Create `admin-dashboard/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Build and Run

```bash
# Build image
docker build -t admin-dashboard:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=https://api.scrapiz.in/api \
  -e NEXT_PUBLIC_FRONTEND_SECRET=your_secret \
  admin-dashboard:latest
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build: ./admin-dashboard
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE_URL=https://api.scrapiz.in/api
      - NEXT_PUBLIC_FRONTEND_SECRET=${FRONTEND_SECRET}
    restart: unless-stopped

  backend:
    build: ./server
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SECRET_KEY=${SECRET_KEY}
      - DEBUG=False
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=scrapiz_prod
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    restart: unless-stopped

volumes:
  postgres_data:
```

Run with Docker Compose:
```bash
docker-compose up -d
```


## Backend Deployment

### AWS EC2 Deployment

#### Step 1: Launch EC2 Instance

1. Choose Ubuntu 22.04 LTS AMI
2. Select instance type (t3.medium recommended)
3. Configure security group:
   - Port 22 (SSH)
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Port 8000 (Django - temporary)

#### Step 2: Connect and Setup

```bash
# Connect to instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install python3-pip python3-venv nginx postgresql postgresql-contrib -y

# Install Redis
sudo apt install redis-server -y
```

#### Step 3: Setup Application

```bash
# Clone repository
git clone <repository-url>
cd server

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
nano .env  # Edit with production values
```

#### Step 4: Setup Database

```bash
# Create database
sudo -u postgres psql
CREATE DATABASE scrapiz_prod;
CREATE USER scrapiz_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE scrapiz_prod TO scrapiz_user;
\q

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

#### Step 5: Setup Gunicorn

Install Gunicorn:
```bash
pip install gunicorn
```

Create systemd service `/etc/systemd/system/gunicorn.service`:

```ini
[Unit]
Description=Gunicorn daemon for Django
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/server
ExecStart=/home/ubuntu/server/venv/bin/gunicorn \
    --workers 3 \
    --bind unix:/home/ubuntu/server/gunicorn.sock \
    server.wsgi:application

[Install]
WantedBy=multi-user.target
```

Start Gunicorn:
```bash
sudo systemctl start gunicorn
sudo systemctl enable gunicorn
```

#### Step 6: Setup Nginx

Create Nginx configuration `/etc/nginx/sites-available/scrapiz`:

```nginx
server {
    listen 80;
    server_name api.scrapiz.in;

    location = /favicon.ico { access_log off; log_not_found off; }
    
    location /static/ {
        root /home/ubuntu/server;
    }

    location /media/ {
        root /home/ubuntu/server;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/home/ubuntu/server/gunicorn.sock;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/scrapiz /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 7: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d api.scrapiz.in

# Auto-renewal is configured automatically
```

#### Step 8: Setup Celery (if using)

Create systemd service `/etc/systemd/system/celery.service`:

```ini
[Unit]
Description=Celery Service
After=network.target

[Service]
Type=forking
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/server
ExecStart=/home/ubuntu/server/venv/bin/celery -A server worker --loglevel=info

[Install]
WantedBy=multi-user.target
```

Start Celery:
```bash
sudo systemctl start celery
sudo systemctl enable celery
```

### Heroku Deployment

#### Prerequisites

- Heroku account
- Heroku CLI installed

#### Step 1: Prepare Application

Create `Procfile` in server directory:
```
web: gunicorn server.wsgi --log-file -
```

Create `runtime.txt`:
```
python-3.11.0
```

#### Step 2: Deploy

```bash
# Login to Heroku
heroku login

# Create app
heroku create scrapiz-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set SECRET_KEY=your_secret_key
heroku config:set DEBUG=False
heroku config:set ALLOWED_HOSTS=scrapiz-api.herokuapp.com

# Deploy
git push heroku main

# Run migrations
heroku run python manage.py migrate

# Create superuser
heroku run python manage.py createsuperuser
```

## Post-Deployment

### Verification Steps

#### Frontend Verification

1. **Access Application**
   - Navigate to `https://admin.scrapiz.in`
   - Verify page loads correctly

2. **Test Authentication**
   - Login with admin credentials
   - Verify JWT token is stored
   - Check protected routes are accessible

3. **Test API Integration**
   - Verify data loads from backend
   - Test CRUD operations
   - Check error handling

4. **Test Responsive Design**
   - Test on mobile device
   - Test on tablet
   - Test on desktop

#### Backend Verification

1. **Health Check**
   ```bash
   curl https://api.scrapiz.in/health
   ```

2. **API Endpoints**
   ```bash
   # Test login
   curl -X POST https://api.scrapiz.in/api/authentication/login/ \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@scrapiz.in","password":"password"}'
   ```

3. **Database Connection**
   ```bash
   python manage.py dbshell
   ```

4. **Static Files**
   - Verify static files are served correctly
   - Check admin panel loads with styles

### Performance Testing

#### Load Testing

Use Apache Bench:
```bash
ab -n 1000 -c 10 https://admin.scrapiz.in/
```

Use Artillery:
```bash
npm install -g artillery
artillery quick --count 10 --num 100 https://admin.scrapiz.in/
```

#### Monitoring Response Times

```bash
curl -w "@curl-format.txt" -o /dev/null -s https://admin.scrapiz.in/
```

Create `curl-format.txt`:
```
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_appconnect:  %{time_appconnect}\n
time_pretransfer:  %{time_pretransfer}\n
time_redirect:  %{time_redirect}\n
time_starttransfer:  %{time_starttransfer}\n
----------\n
time_total:  %{time_total}\n
```

### Security Hardening

#### Frontend Security Headers

Add to `next.config.ts`:

```typescript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

#### Backend Security

Update Django settings:

```python
# Security settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

## Rollback Procedures

### Frontend Rollback (Vercel)

#### Via Dashboard

1. Go to Vercel dashboard
2. Select project
3. Go to "Deployments"
4. Find previous working deployment
5. Click "..." → "Promote to Production"

#### Via CLI

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>
```

### Backend Rollback

#### Git-based Rollback

```bash
# Find commit to rollback to
git log --oneline

# Rollback to specific commit
git revert <commit-hash>
git push origin main

# Or reset (use with caution)
git reset --hard <commit-hash>
git push -f origin main
```

#### Database Rollback

```bash
# Rollback last migration
python manage.py migrate app_name previous_migration_name

# Or rollback all migrations for an app
python manage.py migrate app_name zero
```

### Emergency Rollback

If critical issue occurs:

1. **Immediate Action**
   - Revert to last known good deployment
   - Notify team of rollback
   - Document the issue

2. **Investigation**
   - Check logs for errors
   - Identify root cause
   - Create fix in development

3. **Resolution**
   - Test fix thoroughly
   - Deploy fix to staging
   - Deploy to production after verification

## Monitoring

### Application Monitoring

#### Frontend Monitoring

**Vercel Analytics**:
- Automatically enabled for Vercel deployments
- View in Vercel dashboard

**Google Analytics**:
```typescript
// Add to app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

#### Backend Monitoring

**Django Logging**:

```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': '/var/log/django/error.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}
```

**Sentry Integration**:

```bash
pip install sentry-sdk
```

```python
# settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[DjangoIntegration()],
    traces_sample_rate=1.0,
    send_default_pii=True
)
```

### Infrastructure Monitoring

#### Server Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Monitor resources
htop  # CPU and memory
iotop  # Disk I/O
nethogs  # Network usage
```

#### Log Monitoring

```bash
# View application logs
sudo journalctl -u gunicorn -f

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View system logs
sudo tail -f /var/log/syslog
```

### Alerts

Setup alerts for:
- High error rates (> 5%)
- Slow response times (> 2s)
- High CPU usage (> 80%)
- High memory usage (> 90%)
- Disk space low (< 10% free)
- SSL certificate expiration (< 30 days)

## Maintenance

### Regular Tasks

**Daily**:
- Check error logs
- Monitor performance metrics
- Verify backups completed

**Weekly**:
- Review security logs
- Check disk space
- Update dependencies (if needed)

**Monthly**:
- Security updates
- Performance optimization
- Database maintenance
- SSL certificate check

### Backup Strategy

#### Database Backups

```bash
# Automated daily backup
0 2 * * * pg_dump scrapiz_prod > /backups/db_$(date +\%Y\%m\%d).sql
```

#### Application Backups

```bash
# Backup application files
tar -czf /backups/app_$(date +%Y%m%d).tar.gz /home/ubuntu/server
```

#### Backup Retention

- Daily backups: Keep 7 days
- Weekly backups: Keep 4 weeks
- Monthly backups: Keep 12 months

---

**Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: DevOps Team
