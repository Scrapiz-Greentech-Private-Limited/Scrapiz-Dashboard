# Security Best Practices

## Table of Contents
1. [Authentication Security](#authentication-security)
2. [Authorization](#authorization)
3. [Data Protection](#data-protection)
4. [API Security](#api-security)
5. [Frontend Security](#frontend-security)
6. [Backend Security](#backend-security)
7. [Infrastructure Security](#infrastructure-security)
8. [Incident Response](#incident-response)

## Authentication Security

### JWT Token Management

**Storage**:
- Store JWT tokens in `localStorage` (current implementation)
- Alternative: Use `httpOnly` cookies for better security
- Never store tokens in URL parameters or session storage

**Token Lifecycle**:
```typescript
// Good: Clear token on logout
localStorage.removeItem('authToken');

// Good: Clear token on 401/403 errors
if (status === 401 || status === 403) {
  localStorage.removeItem('authToken');
}
```

**Token Format**:
```typescript
// Always use Bearer prefix
Authorization: `Bearer ${token}`
```

### Password Security

**Requirements**:
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers, special characters
- No common passwords
- No personal information

**Backend Validation**:
```python
# Django settings
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
```

### Session Management

**Timeout Configuration**:
```python
# Django settings
JWT_EXPIRATION_HOURS = 24  # Adjust based on security requirements
SESSION_COOKIE_AGE = 86400  # 24 hours
```

**Session Invalidation**:
- Logout clears all tokens
- Password change invalidates all sessions
- Account deletion invalidates all sessions

## Authorization

### Role-Based Access Control (RBAC)

**User Roles**:
- **Superuser**: Full system access
- **Staff**: Admin dashboard access
- **Regular User**: Client app access only

**Permission Checks**:
```python
# Backend: Check staff status
if not request.user.is_staff:
    return Response({'error': 'Staff privileges required'}, status=403)
```

```typescript
// Frontend: Hide UI elements
{user?.is_staff && (
  <AdminOnlyFeature />
)}
```

### API Endpoint Protection

**All admin endpoints must**:
1. Require authentication
2. Verify staff/superuser status
3. Log access attempts
4. Rate limit requests

## Data Protection

### Sensitive Data Handling

**Never Log**:
- Passwords
- JWT tokens
- Credit card numbers
- Personal identification numbers

**Encryption**:
- All data in transit: HTTPS/TLS
- Sensitive data at rest: Database encryption
- File uploads: Encrypted S3 buckets

### Personal Identifiable Information (PII)

**Minimize Collection**:
- Only collect necessary data
- Document data retention policies
- Implement data deletion on request

**GDPR Compliance**:
- Right to access
- Right to deletion
- Right to data portability
- Consent management

## API Security

### Request Validation

**Input Sanitization**:
```typescript
// Validate all inputs
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/<script>/gi, '');
};
```

**Rate Limiting**:
```python
# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}
```

### CORS Configuration

**Strict Origin Control**:
```python
# Only allow specific origins
CORS_ALLOWED_ORIGINS = [
    "https://admin.scrapiz.in",
    "https://app.scrapiz.in",
]

# Never use in production
CORS_ALLOW_ALL_ORIGINS = False
```

### API Keys and Secrets

**Frontend Secret**:
```typescript
// Use environment variables
const FRONTEND_KEY = process.env.NEXT_PUBLIC_FRONTEND_SECRET;

// Validate on backend
if (request.headers.get('x-auth-app') !== EXPECTED_KEY):
    return Response({'error': 'Invalid app key'}, status=403)
```

## Frontend Security

### XSS Prevention

**React Built-in Protection**:
```typescript
// Good: React escapes by default
<div>{userInput}</div>

// Dangerous: Avoid dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{__html: userInput}} />
```

**Content Security Policy**:
```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';"
  }
];
```

### CSRF Protection

**Django CSRF**:
```python
# Enabled by default
MIDDLEWARE = [
    'django.middleware.csrf.CsrfViewMiddleware',
]
```

**API Requests**:
```typescript
// Include CSRF token for state-changing operations
const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
```

### Secure Headers

**Next.js Configuration**:
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
```

## Backend Security

### Django Security Settings

**Production Configuration**:
```python
# settings.py
DEBUG = False
SECRET_KEY = os.environ.get('SECRET_KEY')  # Never hardcode
ALLOWED_HOSTS = ['api.scrapiz.in']

# Security middleware
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

### SQL Injection Prevention

**Use ORM**:
```python
# Good: Django ORM prevents SQL injection
User.objects.filter(email=user_email)

# Bad: Raw SQL with string formatting
cursor.execute(f"SELECT * FROM users WHERE email = '{user_email}'")

# If raw SQL needed, use parameterized queries
cursor.execute("SELECT * FROM users WHERE email = %s", [user_email])
```

### File Upload Security

**Validation**:
```python
# Validate file type
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Validate file size
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# Scan for malware (production)
# Use ClamAV or similar
```

**S3 Security**:
```python
# Private buckets
AWS_DEFAULT_ACL = 'private'
AWS_S3_OBJECT_PARAMETERS = {
    'CacheControl': 'max-age=86400',
}

# Signed URLs for access
from boto3 import client
s3 = client('s3')
url = s3.generate_presigned_url(
    'get_object',
    Params={'Bucket': bucket, 'Key': key},
    ExpiresIn=3600
)
```

## Infrastructure Security

### Server Hardening

**SSH Security**:
```bash
# Disable root login
PermitRootLogin no

# Use key-based authentication
PasswordAuthentication no

# Change default port
Port 2222
```

**Firewall Configuration**:
```bash
# UFW (Ubuntu)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Database Security

**PostgreSQL**:
```bash
# Strong password
CREATE USER scrapiz_user WITH PASSWORD 'strong_random_password';

# Limited permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO scrapiz_user;

# Network restrictions
# In pg_hba.conf
host    scrapiz_db    scrapiz_user    10.0.0.0/8    md5
```

**Backups**:
```bash
# Automated encrypted backups
pg_dump scrapiz_db | gpg --encrypt > backup_$(date +%Y%m%d).sql.gpg
```

### SSL/TLS Configuration

**Let's Encrypt**:
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.scrapiz.in

# Auto-renewal
sudo certbot renew --dry-run
```

**Nginx SSL Configuration**:
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
add_header Strict-Transport-Security "max-age=31536000" always;
```

## Incident Response

### Security Monitoring

**Log Everything**:
```python
# Django logging
LOGGING = {
    'version': 1,
    'handlers': {
        'file': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': '/var/log/django/security.log',
        },
    },
    'loggers': {
        'django.security': {
            'handlers': ['file'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}
```

**Monitor For**:
- Failed login attempts
- 401/403 errors
- Unusual API usage patterns
- Large file uploads
- SQL injection attempts

### Incident Response Plan

**1. Detection**:
- Automated alerts
- Log monitoring
- User reports

**2. Containment**:
- Isolate affected systems
- Revoke compromised credentials
- Block malicious IPs

**3. Investigation**:
- Review logs
- Identify attack vector
- Assess damage

**4. Recovery**:
- Patch vulnerabilities
- Restore from backups
- Reset credentials

**5. Post-Incident**:
- Document incident
- Update security measures
- Notify affected users (if required)

### Security Checklist

**Daily**:
- [ ] Review error logs
- [ ] Check failed login attempts
- [ ] Monitor API usage

**Weekly**:
- [ ] Review access logs
- [ ] Check for security updates
- [ ] Verify backup integrity

**Monthly**:
- [ ] Security audit
- [ ] Dependency updates
- [ ] Password rotation
- [ ] SSL certificate check

**Quarterly**:
- [ ] Penetration testing
- [ ] Security training
- [ ] Policy review
- [ ] Disaster recovery drill

## Security Resources

### Tools

- **OWASP ZAP**: Web application security scanner
- **Burp Suite**: Security testing
- **Snyk**: Dependency vulnerability scanning
- **SonarQube**: Code quality and security

### References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Django Security](https://docs.djangoproject.com/en/stable/topics/security/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [CWE Top 25](https://cwe.mitre.org/top25/)

---

**Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: Security Team
