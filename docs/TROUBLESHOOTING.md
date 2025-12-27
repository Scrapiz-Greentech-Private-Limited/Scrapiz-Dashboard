# Troubleshooting Guide

## Table of Contents
1. [Authentication Issues](#authentication-issues)
2. [API Connection Issues](#api-connection-issues)
3. [Data Loading Issues](#data-loading-issues)
4. [Performance Issues](#performance-issues)
5. [Build and Deployment Issues](#build-and-deployment-issues)
6. [Database Issues](#database-issues)
7. [Common Error Messages](#common-error-messages)
8. [Debug Tools](#debug-tools)

## Authentication Issues

### Cannot Login - Invalid Credentials

**Symptoms**:
- Login fails with "Invalid credentials" error
- Correct email and password don't work

**Possible Causes**:
1. Incorrect email or password
2. Account doesn't have staff privileges
3. Account is inactive
4. Backend authentication service down

**Solutions**:

1. **Verify Credentials**:
   ```bash
   # Check user in Django admin or database
   python manage.py shell
   >>> from authentication.models import User
   >>> user = User.objects.get(email='admin@example.com')
   >>> print(f"Is staff: {user.is_staff}, Is active: {user.is_active}")
   ```

2. **Reset Password**:
   ```bash
   python manage.py changepassword admin@example.com
   ```

3. **Grant Staff Privileges**:
   ```bash
   python manage.py shell
   >>> from authentication.models import User
   >>> user = User.objects.get(email='admin@example.com')
   >>> user.is_staff = True
   >>> user.is_superuser = True
   >>> user.save()
   ```

4. **Check Backend Status**:
   ```bash
   curl http://localhost:8000/api/authentication/login/
   ```

### Session Expired Immediately After Login

**Symptoms**:
- Login successful but immediately logged out
- "Session expired" message appears

**Possible Causes**:
1. JWT token not being stored
2. Token expiration time too short
3. Browser blocking localStorage
4. CORS issues preventing token storage

**Solutions**:

1. **Check Browser Console**:
   - Open DevTools (F12)
   - Check Console for errors
   - Look for localStorage errors

2. **Verify Token Storage**:
   ```javascript
   // In browser console
   localStorage.getItem('authToken')
   ```

3. **Check JWT Expiration**:
   ```python
   # In Django settings
   JWT_EXPIRATION_HOURS = 24  # Increase if too short
   ```

4. **Clear Browser Data**:
   - Clear cookies and cache
   - Try incognito mode
   - Try different browser

### Token Expired Error

**Symptoms**:
- "Token expired" or "Invalid token" errors
- Logged out unexpectedly

**Possible Causes**:
1. JWT token expired
2. Token invalidated on backend
3. System time mismatch

**Solutions**:

1. **Login Again**:
   - Simply log in again to get new token

2. **Implement Token Refresh**:
   ```typescript
   // Add token refresh logic
   const refreshToken = async () => {
     const response = await apiClient.post('/auth/refresh');
     localStorage.setItem('authToken', response.data.token);
   };
   ```

3. **Check System Time**:
   ```bash
   # Ensure server time is correct
   date
   timedatectl
   ```

## API Connection Issues

### CORS Errors

**Symptoms**:
- "CORS policy" errors in console
- API requests blocked by browser
- "Access-Control-Allow-Origin" errors

**Possible Causes**:
1. Backend CORS not configured
2. Frontend URL not in allowed origins
3. Incorrect request headers

**Solutions**:

1. **Check Django CORS Settings**:
   ```python
   # settings.py
   CORS_ALLOWED_ORIGINS = [
       "http://localhost:9002",
       "https://admin.scrapiz.in",
   ]
   
   CORS_ALLOW_CREDENTIALS = True
   ```

2. **Verify Frontend URL**:
   - Ensure exact URL match (including protocol)
   - No trailing slashes
   - Check port numbers

3. **Install CORS Headers**:
   ```bash
   pip install django-cors-headers
   ```

4. **Restart Django Server**:
   ```bash
   python manage.py runserver
   ```

### Network Request Failed

**Symptoms**:
- "Network request failed" errors
- API calls timeout
- No response from backend

**Possible Causes**:
1. Backend server not running
2. Incorrect API URL
3. Firewall blocking requests
4. Network connectivity issues

**Solutions**:

1. **Verify Backend is Running**:
   ```bash
   curl http://localhost:8000/api/health
   ```

2. **Check API URL**:
   ```bash
   # In .env.local
   echo $NEXT_PUBLIC_API_BASE_URL
   ```

3. **Test Network Connectivity**:
   ```bash
   ping api.scrapiz.in
   curl -I https://api.scrapiz.in
   ```

4. **Check Firewall**:
   ```bash
   # On Linux
   sudo ufw status
   sudo ufw allow 8000
   ```

### 401 Unauthorized Errors

**Symptoms**:
- All API requests return 401
- "Unauthorized" errors
- Redirected to login repeatedly

**Possible Causes**:
1. No auth token in request
2. Invalid or expired token
3. Token not in correct format

**Solutions**:

1. **Check Token in Request**:
   ```javascript
   // In browser DevTools Network tab
   // Check Authorization header
   Authorization: Bearer <token>
   ```

2. **Verify Token Format**:
   ```typescript
   // Should be: Bearer <jwt_token>
   const token = localStorage.getItem('authToken');
   console.log('Token:', token);
   ```

3. **Check API Interceptor**:
   ```typescript
   // Verify axios interceptor adds token
   apiClient.interceptors.request.use((config) => {
     const token = localStorage.getItem('authToken');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });
   ```

### 500 Internal Server Error

**Symptoms**:
- API returns 500 errors
- "Internal server error" messages
- Backend crashes

**Possible Causes**:
1. Backend code error
2. Database connection issue
3. Missing environment variables
4. Unhandled exceptions

**Solutions**:

1. **Check Backend Logs**:
   ```bash
   # Django development server
   # Check terminal output
   
   # Production
   sudo journalctl -u gunicorn -n 50
   tail -f /var/log/django/error.log
   ```

2. **Check Database Connection**:
   ```bash
   python manage.py dbshell
   ```

3. **Verify Environment Variables**:
   ```bash
   python manage.py shell
   >>> from django.conf import settings
   >>> print(settings.DATABASE_URL)
   ```

4. **Enable Debug Mode (Development Only)**:
   ```python
   # settings.py
   DEBUG = True  # Only in development!
   ```

## Data Loading Issues

### Data Not Displaying

**Symptoms**:
- Empty tables or lists
- Loading spinner never stops
- "No data" messages

**Possible Causes**:
1. API returning empty data
2. Data fetching error
3. Incorrect data parsing
4. Permission issues

**Solutions**:

1. **Check Network Tab**:
   - Open DevTools → Network
   - Check API response
   - Verify data structure

2. **Check Console for Errors**:
   ```javascript
   // Look for errors in console
   console.error messages
   ```

3. **Verify API Response**:
   ```bash
   curl -H "Authorization: Bearer <token>" \
     https://api.scrapiz.in/api/inventory/ordernos/
   ```

4. **Check Data Parsing**:
   ```typescript
   // Add logging
   const data = await OrderService.getAll();
   console.log('Received data:', data);
   ```

### Infinite Loading State

**Symptoms**:
- Loading spinner never stops
- Page stuck in loading state
- No error messages

**Possible Causes**:
1. API request never completes
2. Error not caught properly
3. Loading state not updated
4. Request timeout

**Solutions**:

1. **Add Request Timeout**:
   ```typescript
   const response = await apiClient.get('/endpoint', {
     timeout: 10000 // 10 seconds
   });
   ```

2. **Check Error Handling**:
   ```typescript
   try {
     const data = await fetchData();
     setData(data);
   } catch (error) {
     console.error('Error:', error);
   } finally {
     setLoading(false); // Always set loading to false
   }
   ```

3. **Add Loading Timeout**:
   ```typescript
   useEffect(() => {
     const timeout = setTimeout(() => {
       setLoading(false);
       setError('Request timeout');
     }, 30000);
     
     return () => clearTimeout(timeout);
   }, []);
   ```

### Stale Data

**Symptoms**:
- Data doesn't update after changes
- Old data displayed
- Refresh required to see changes

**Possible Causes**:
1. No data refetch after mutation
2. Aggressive caching
3. State not updating

**Solutions**:

1. **Refetch After Mutation**:
   ```typescript
   const handleUpdate = async () => {
     await updateData();
     await refetchData(); // Refetch after update
   };
   ```

2. **Clear Cache**:
   ```typescript
   // Clear API cache
   apiCache.clear();
   ```

3. **Force Refresh**:
   ```typescript
   // Add refresh button
   <Button onClick={() => refetch()}>Refresh</Button>
   ```


## Performance Issues

### Slow Page Load

**Symptoms**:
- Pages take long to load
- Slow initial render
- Large bundle size

**Possible Causes**:
1. Large JavaScript bundle
2. Unoptimized images
3. Too many API calls
4. No code splitting

**Solutions**:

1. **Analyze Bundle Size**:
   ```bash
   npm run build
   # Check .next/analyze output
   ```

2. **Implement Code Splitting**:
   ```typescript
   // Use dynamic imports
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <Spinner />,
   });
   ```

3. **Optimize Images**:
   ```typescript
   // Use Next.js Image component
   import Image from 'next/image';
   
   <Image
     src="/image.jpg"
     width={500}
     height={300}
     alt="Description"
   />
   ```

4. **Reduce API Calls**:
   ```typescript
   // Batch requests
   const [users, orders] = await Promise.all([
     UserService.getAllUsers(),
     OrderService.getAllOrders(),
   ]);
   ```

### Slow API Responses

**Symptoms**:
- API calls take > 2 seconds
- Timeout errors
- Database slow queries

**Possible Causes**:
1. Missing database indexes
2. N+1 query problem
3. Large dataset without pagination
4. Slow network

**Solutions**:

1. **Add Database Indexes**:
   ```python
   class Order(models.Model):
       user = models.ForeignKey(User, on_delete=models.CASCADE, db_index=True)
       status = models.CharField(max_length=20, db_index=True)
       created_at = models.DateTimeField(auto_now_add=True, db_index=True)
   ```

2. **Use select_related/prefetch_related**:
   ```python
   # Bad: N+1 queries
   orders = Order.objects.all()
   for order in orders:
       print(order.user.name)  # Separate query for each user
   
   # Good: Single query with join
   orders = Order.objects.select_related('user').all()
   ```

3. **Implement Pagination**:
   ```python
   # Django REST Framework
   from rest_framework.pagination import PageNumberPagination
   
   class StandardResultsSetPagination(PageNumberPagination):
       page_size = 50
       page_size_query_param = 'page_size'
       max_page_size = 100
   ```

4. **Add Caching**:
   ```python
   from django.core.cache import cache
   
   def get_categories():
       categories = cache.get('categories')
       if not categories:
           categories = Category.objects.all()
           cache.set('categories', categories, 3600)  # 1 hour
       return categories
   ```

### Memory Issues

**Symptoms**:
- Browser tab crashes
- "Out of memory" errors
- Slow performance over time

**Possible Causes**:
1. Memory leaks
2. Large data in state
3. Event listeners not cleaned up
4. Too many components rendered

**Solutions**:

1. **Clean Up Effects**:
   ```typescript
   useEffect(() => {
     const interval = setInterval(() => {
       // Do something
     }, 1000);
     
     // Cleanup
     return () => clearInterval(interval);
   }, []);
   ```

2. **Virtualize Long Lists**:
   ```typescript
   import { FixedSizeList } from 'react-window';
   
   <FixedSizeList
     height={600}
     itemCount={items.length}
     itemSize={50}
   >
     {({ index, style }) => (
       <div style={style}>{items[index]}</div>
     )}
   </FixedSizeList>
   ```

3. **Memoize Expensive Computations**:
   ```typescript
   const expensiveValue = useMemo(() => {
     return computeExpensiveValue(data);
   }, [data]);
   ```

## Build and Deployment Issues

### Build Failures

**Symptoms**:
- `npm run build` fails
- TypeScript errors
- Module not found errors

**Possible Causes**:
1. TypeScript errors
2. Missing dependencies
3. Environment variables not set
4. Syntax errors

**Solutions**:

1. **Check TypeScript Errors**:
   ```bash
   npx tsc --noEmit
   ```

2. **Install Missing Dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Set Environment Variables**:
   ```bash
   # Create .env.local
   cp .env.local.example .env.local
   # Edit with your values
   ```

4. **Check Syntax**:
   ```bash
   npm run lint
   ```

### Deployment Failures

**Symptoms**:
- Deployment fails on Vercel/hosting platform
- Application doesn't start
- 500 errors in production

**Possible Causes**:
1. Environment variables not set
2. Build command incorrect
3. Port conflicts
4. Missing dependencies

**Solutions**:

1. **Verify Environment Variables**:
   - Check all required variables are set in deployment platform
   - Verify variable names match exactly

2. **Check Build Logs**:
   ```bash
   # Vercel
   vercel logs <deployment-url>
   ```

3. **Test Production Build Locally**:
   ```bash
   npm run build
   npm start
   ```

4. **Check Dependencies**:
   ```bash
   # Ensure all dependencies are in package.json
   npm install --save <missing-package>
   ```

## Database Issues

### Connection Errors

**Symptoms**:
- "Connection refused" errors
- "Too many connections" errors
- Timeout errors

**Possible Causes**:
1. Database not running
2. Incorrect credentials
3. Network issues
4. Connection pool exhausted

**Solutions**:

1. **Check Database Status**:
   ```bash
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   ```

2. **Verify Credentials**:
   ```bash
   psql -U username -d database_name
   ```

3. **Check Connection Pool**:
   ```python
   # Django settings
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'CONN_MAX_AGE': 600,  # Connection pooling
       }
   }
   ```

4. **Increase Max Connections**:
   ```bash
   # PostgreSQL config
   max_connections = 200
   ```

### Migration Errors

**Symptoms**:
- Migration fails
- "Table already exists" errors
- "Column does not exist" errors

**Possible Causes**:
1. Conflicting migrations
2. Database out of sync
3. Migration dependencies incorrect

**Solutions**:

1. **Check Migration Status**:
   ```bash
   python manage.py showmigrations
   ```

2. **Fake Migration (if table exists)**:
   ```bash
   python manage.py migrate --fake app_name migration_name
   ```

3. **Reset Migrations (development only)**:
   ```bash
   python manage.py migrate app_name zero
   python manage.py migrate app_name
   ```

4. **Resolve Conflicts**:
   ```bash
   python manage.py makemigrations --merge
   ```

## Common Error Messages

### "Network Error"

**Meaning**: Request failed to reach server

**Check**:
1. Backend server is running
2. API URL is correct
3. CORS is configured
4. Firewall not blocking

### "401 Unauthorized"

**Meaning**: Authentication required or token invalid

**Check**:
1. Token exists in localStorage
2. Token format is correct (Bearer prefix)
3. Token not expired
4. User has required permissions

### "403 Forbidden"

**Meaning**: User doesn't have permission

**Check**:
1. User has staff/superuser status
2. Endpoint requires specific permissions
3. CORS origin is allowed

### "404 Not Found"

**Meaning**: Resource or endpoint doesn't exist

**Check**:
1. API endpoint URL is correct
2. Resource ID is valid
3. Backend route is configured

### "500 Internal Server Error"

**Meaning**: Server-side error

**Check**:
1. Backend logs for error details
2. Database connection
3. Environment variables
4. Code errors

### "CORS Policy Error"

**Meaning**: Cross-origin request blocked

**Check**:
1. CORS_ALLOWED_ORIGINS includes frontend URL
2. Exact URL match (protocol, port)
3. No trailing slashes
4. Django CORS middleware installed

## Debug Tools

### Browser DevTools

**Console**:
- View JavaScript errors
- Check API responses
- Test code snippets

**Network Tab**:
- Monitor API calls
- Check request/response headers
- View response data
- Check timing

**Application Tab**:
- View localStorage
- Check cookies
- Inspect service workers

**React DevTools**:
- Inspect component tree
- View props and state
- Profile performance

### Backend Debugging

**Django Debug Toolbar**:
```python
# Install
pip install django-debug-toolbar

# Add to INSTALLED_APPS
INSTALLED_APPS = [
    'debug_toolbar',
]

# Add middleware
MIDDLEWARE = [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]
```

**Python Debugger**:
```python
# Add breakpoint
import pdb; pdb.set_trace()

# Or use built-in
breakpoint()
```

**Logging**:
```python
import logging
logger = logging.getLogger(__name__)

logger.debug('Debug message')
logger.info('Info message')
logger.warning('Warning message')
logger.error('Error message')
```

### Testing Tools

**cURL**:
```bash
# Test API endpoint
curl -X POST https://api.scrapiz.in/api/authentication/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -v
```

**Postman**:
- Import API collection
- Test endpoints
- Save requests
- Share with team

**HTTPie**:
```bash
# User-friendly HTTP client
http POST https://api.scrapiz.in/api/authentication/login/ \
  email=test@example.com \
  password=password
```

## Getting Additional Help

### Documentation

1. Check this troubleshooting guide
2. Review API documentation
3. Check developer setup guide
4. Review security best practices

### Logs

1. Browser console logs
2. Network tab in DevTools
3. Backend server logs
4. Database logs
5. Nginx/Apache logs

### Community

1. Create GitHub issue with:
   - Error message
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Relevant logs

2. Contact team:
   - Slack channel
   - Email support
   - Team meeting

### Emergency Contacts

- **Production Issues**: [emergency-email]
- **Security Issues**: [security-email]
- **On-Call Engineer**: [phone-number]

---

**Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: Support Team
