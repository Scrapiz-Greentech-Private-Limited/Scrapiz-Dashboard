# Environment Variables Documentation

## Overview

This document describes all environment variables used in the Admin Dashboard application. Environment variables are used to configure the application for different environments (development, staging, production) without changing the code.

## File Locations

### Admin Dashboard

- **Development**: `.env.local` (not committed to git)
- **Example**: `.env.local.example` (committed to git as template)
- **Production**: Set in deployment platform (Vercel, etc.)

### Django Backend

- **All Environments**: `server/.env` (not committed to git)
- **Example**: `server/.env.example` (committed to git as template)

## Admin Dashboard Variables

### Required Variables

#### `NEXT_PUBLIC_API_BASE_URL`

**Description**: Base URL for the Django backend API  
**Type**: String (URL)  
**Required**: Yes  
**Example**:
```env
# Development
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api

# Staging
NEXT_PUBLIC_API_BASE_URL=https://staging-api.scrapiz.in/api

# Production
NEXT_PUBLIC_API_BASE_URL=https://api.scrapiz.in/api
```

**Notes**:
- Must start with `NEXT_PUBLIC_` to be accessible in browser
- Should NOT include trailing slash
- Must include `/api` path segment

#### `NEXT_PUBLIC_FRONTEND_SECRET`

**Description**: Secret key for frontend authentication  
**Type**: String  
**Required**: Yes  
**Example**:
```env
NEXT_PUBLIC_FRONTEND_SECRET=Scrapiz#0nn$(tab!z
```

**Notes**:
- Used for additional security checks
- Should be a strong, unique string
- Must match backend configuration

### Optional Variables

#### Firebase Configuration (if using Firebase features)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**Notes**:
- Only required if using Firebase services
- Get these values from Firebase Console
- All must start with `NEXT_PUBLIC_` for client-side access

#### Analytics Configuration

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Description**: Google Analytics measurement ID  
**Type**: String  
**Required**: No (optional for analytics)

### Development-Only Variables

#### `NODE_ENV`

**Description**: Node environment  
**Type**: String (`development` | `production` | `test`)  
**Required**: Automatically set by Next.js  
**Example**:
```env
NODE_ENV=development
```

**Notes**:
- Automatically set by `npm run dev` (development)
- Automatically set by `npm run build` (production)
- Do not manually set in `.env.local`

## Django Backend Variables

### Database Configuration

#### `DATABASE_URL`

**Description**: PostgreSQL database connection string  
**Type**: String (URL)  
**Required**: Yes  
**Example**:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/scrapiz_db
```

**Format**: `postgresql://[user]:[password]@[host]:[port]/[database]`

### Django Settings

#### `SECRET_KEY`

**Description**: Django secret key for cryptographic signing  
**Type**: String  
**Required**: Yes  
**Example**:
```env
SECRET_KEY=django-insecure-your-secret-key-here
```

**Notes**:
- Must be kept secret
- Generate with: `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`
- Use different keys for each environment

#### `DEBUG`

**Description**: Enable/disable Django debug mode  
**Type**: Boolean (`True` | `False`)  
**Required**: Yes  
**Example**:
```env
# Development
DEBUG=True

# Production
DEBUG=False
```

**Notes**:
- MUST be `False` in production
- Exposes sensitive information when `True`

#### `ALLOWED_HOSTS`

**Description**: Comma-separated list of allowed hostnames  
**Type**: String (comma-separated)  
**Required**: Yes  
**Example**:
```env
# Development
ALLOWED_HOSTS=localhost,127.0.0.1

# Production
ALLOWED_HOSTS=api.scrapiz.in,admin.scrapiz.in
```

### CORS Configuration

#### `CORS_ALLOWED_ORIGINS`

**Description**: Comma-separated list of allowed origins for CORS  
**Type**: String (comma-separated URLs)  
**Required**: Yes  
**Example**:
```env
# Development
CORS_ALLOWED_ORIGINS=http://localhost:9002,http://localhost:3000

# Production
CORS_ALLOWED_ORIGINS=https://admin.scrapiz.in
```

**Notes**:
- Must include protocol (http:// or https://)
- No trailing slashes
- Separate multiple origins with commas

### AWS S3 Configuration

#### `AWS_ACCESS_KEY_ID`

**Description**: AWS access key for S3  
**Type**: String  
**Required**: Yes (if using S3)  
**Example**:
```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
```

#### `AWS_SECRET_ACCESS_KEY`

**Description**: AWS secret access key for S3  
**Type**: String  
**Required**: Yes (if using S3)  
**Example**:
```env
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

#### `AWS_STORAGE_BUCKET_NAME`

**Description**: S3 bucket name for file storage  
**Type**: String  
**Required**: Yes (if using S3)  
**Example**:
```env
AWS_STORAGE_BUCKET_NAME=scrapiz-media
```

#### `AWS_S3_REGION_NAME`

**Description**: AWS region for S3 bucket  
**Type**: String  
**Required**: Yes (if using S3)  
**Example**:
```env
AWS_S3_REGION_NAME=ap-south-1
```

### Email Configuration

#### `EMAIL_HOST`

**Description**: SMTP server hostname  
**Type**: String  
**Required**: Yes (if using email)  
**Example**:
```env
EMAIL_HOST=smtp.gmail.com
```

#### `EMAIL_PORT`

**Description**: SMTP server port  
**Type**: Integer  
**Required**: Yes (if using email)  
**Example**:
```env
EMAIL_PORT=587
```

#### `EMAIL_HOST_USER`

**Description**: SMTP username  
**Type**: String  
**Required**: Yes (if using email)  
**Example**:
```env
EMAIL_HOST_USER=noreply@scrapiz.in
```

#### `EMAIL_HOST_PASSWORD`

**Description**: SMTP password  
**Type**: String  
**Required**: Yes (if using email)  
**Example**:
```env
EMAIL_HOST_PASSWORD=your_email_password
```

#### `EMAIL_USE_TLS`

**Description**: Use TLS for email  
**Type**: Boolean (`True` | `False`)  
**Required**: Yes (if using email)  
**Example**:
```env
EMAIL_USE_TLS=True
```

### Google OAuth Configuration

#### `GOOGLE_CLIENT_ID`

**Description**: Google OAuth client ID  
**Type**: String  
**Required**: Yes (if using Google OAuth)  
**Example**:
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

#### `GOOGLE_CLIENT_SECRET`

**Description**: Google OAuth client secret  
**Type**: String  
**Required**: Yes (if using Google OAuth)  
**Example**:
```env
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnop
```

### Redis Configuration (for Celery)

#### `REDIS_URL`

**Description**: Redis connection URL  
**Type**: String (URL)  
**Required**: Yes (if using Celery)  
**Example**:
```env
REDIS_URL=redis://localhost:6379/0
```

### JWT Configuration

#### `JWT_SECRET_KEY`

**Description**: Secret key for JWT token signing  
**Type**: String  
**Required**: Yes  
**Example**:
```env
JWT_SECRET_KEY=your-jwt-secret-key-here
```

**Notes**:
- Must be kept secret
- Use a strong, random string
- Different from Django SECRET_KEY

#### `JWT_EXPIRATION_HOURS`

**Description**: JWT token expiration time in hours  
**Type**: Integer  
**Required**: No (has default)  
**Example**:
```env
JWT_EXPIRATION_HOURS=24
```

**Default**: 24 hours


## Environment-Specific Configurations

### Development Environment

**File**: `.env.local`

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_FRONTEND_SECRET=Scrapiz#0nn$(tab!z

# Optional: Firebase (if needed)
NEXT_PUBLIC_FIREBASE_API_KEY=dev_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dev-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=dev-project-id
```

**Backend** (`server/.env`):
```env
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:9002,http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/scrapiz_dev
```

### Staging Environment

**Frontend** (Set in deployment platform):
```env
NEXT_PUBLIC_API_BASE_URL=https://staging-api.scrapiz.in/api
NEXT_PUBLIC_FRONTEND_SECRET=staging-secret-key
```

**Backend**:
```env
DEBUG=False
ALLOWED_HOSTS=staging-api.scrapiz.in
CORS_ALLOWED_ORIGINS=https://staging-admin.scrapiz.in
DATABASE_URL=postgresql://user:password@staging-db:5432/scrapiz_staging
```

### Production Environment

**Frontend** (Set in deployment platform):
```env
NEXT_PUBLIC_API_BASE_URL=https://api.scrapiz.in/api
NEXT_PUBLIC_FRONTEND_SECRET=production-secret-key
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Backend**:
```env
DEBUG=False
ALLOWED_HOSTS=api.scrapiz.in
CORS_ALLOWED_ORIGINS=https://admin.scrapiz.in
DATABASE_URL=postgresql://user:password@prod-db:5432/scrapiz_prod
```

## Security Best Practices

### 1. Never Commit Secrets

**DO NOT commit**:
- `.env.local`
- `server/.env`
- Any file containing actual secrets

**DO commit**:
- `.env.local.example`
- `server/.env.example`
- Documentation about required variables

### 2. Use Strong Secrets

Generate strong secrets:

```bash
# Generate random string (Unix/Mac)
openssl rand -base64 32

# Generate Django secret key
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# Generate UUID
python -c 'import uuid; print(uuid.uuid4())'
```

### 3. Rotate Secrets Regularly

- Change secrets periodically (every 90 days recommended)
- Change immediately if compromised
- Use different secrets for each environment

### 4. Limit Access

- Only give production secrets to necessary personnel
- Use secret management tools (AWS Secrets Manager, HashiCorp Vault)
- Never share secrets via email or chat

### 5. Environment Isolation

- Use completely different secrets for each environment
- Never use production secrets in development
- Test with staging secrets before production deployment

## Validation

### Frontend Validation

Check if all required variables are set:

```typescript
// src/lib/validateEnv.ts
export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_API_BASE_URL',
    'NEXT_PUBLIC_FRONTEND_SECRET',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

### Backend Validation

Django will raise errors for missing required settings on startup.

## Troubleshooting

### Variable Not Loading

**Problem**: Environment variable not accessible in code

**Solutions**:
1. Ensure variable name starts with `NEXT_PUBLIC_` for client-side access
2. Restart development server after adding new variables
3. Check `.env.local` file exists and is in root directory
4. Verify no typos in variable names

### CORS Errors

**Problem**: CORS errors when calling API

**Solutions**:
1. Check `CORS_ALLOWED_ORIGINS` includes frontend URL
2. Ensure URLs include protocol (http:// or https://)
3. Remove trailing slashes from URLs
4. Restart Django server after changing CORS settings

### Database Connection Errors

**Problem**: Cannot connect to database

**Solutions**:
1. Verify `DATABASE_URL` format is correct
2. Check database server is running
3. Verify credentials are correct
4. Check network connectivity to database server

### S3 Upload Errors

**Problem**: Cannot upload files to S3

**Solutions**:
1. Verify AWS credentials are correct
2. Check bucket name is correct
3. Verify IAM permissions allow S3 access
4. Check bucket region matches configuration

### Email Not Sending

**Problem**: Emails not being sent

**Solutions**:
1. Verify SMTP credentials are correct
2. Check email provider allows SMTP access
3. Verify port and TLS settings
4. Check for firewall blocking SMTP port

## Example Files

### `.env.local.example`

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_FRONTEND_SECRET=your_secret_here

# Optional: Firebase Configuration
# NEXT_PUBLIC_FIREBASE_API_KEY=
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=
# NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
# NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
# NEXT_PUBLIC_FIREBASE_APP_ID=

# Optional: Analytics
# NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

### `server/.env.example`

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/scrapiz_db

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:9002

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_STORAGE_BUCKET_NAME=your_bucket_name
AWS_S3_REGION_NAME=ap-south-1

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@example.com
EMAIL_HOST_PASSWORD=your_password
EMAIL_USE_TLS=True

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=your-jwt-secret
JWT_EXPIRATION_HOURS=24
```

## Quick Reference

### Frontend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | - | Backend API URL |
| `NEXT_PUBLIC_FRONTEND_SECRET` | Yes | - | Frontend secret key |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | No | - | Firebase API key |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | - | Google Analytics ID |

### Backend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SECRET_KEY` | Yes | - | Django secret key |
| `DEBUG` | Yes | False | Debug mode |
| `DATABASE_URL` | Yes | - | Database connection |
| `ALLOWED_HOSTS` | Yes | - | Allowed hostnames |
| `CORS_ALLOWED_ORIGINS` | Yes | - | CORS origins |
| `AWS_ACCESS_KEY_ID` | Conditional | - | AWS access key |
| `EMAIL_HOST` | Conditional | - | SMTP host |
| `GOOGLE_CLIENT_ID` | Conditional | - | OAuth client ID |
| `REDIS_URL` | Conditional | - | Redis connection |
| `JWT_SECRET_KEY` | Yes | - | JWT secret |

---

**Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: DevOps Team
