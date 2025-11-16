# Troubleshooting Guide

## Common Errors and Solutions

### 1. Authentication Endpoints Not Found (404)

**Error**: `404 Not Found` when trying to login/signup

**Cause**: The backend might not have auth endpoints implemented yet, or they're at different paths.

**Solution**: 
- Check the backend API documentation (`API_DOCUMENTATION.md` in backend repo)
- Verify the actual endpoint paths in the backend code
- The backend might use different paths like:
  - `/api/v1/users/register` instead of `/api/v1/auth/register`
  - `/api/v1/users/login` instead of `/api/v1/auth/login`

**Quick Fix**: Update `src/lib/api/auth.ts` with correct endpoint paths.

### 2. Network Error / CORS Error

**Error**: `Network error occurred` or CORS policy errors

**Cause**: 
- Backend server is not running
- CORS not configured for Chrome extension origin
- Wrong API base URL

**Solution**:
1. Ensure backend is running: `cd ../Aphasia-Backend && npm run dev`
2. Check `.env` file has correct `VITE_API_BASE_URL`
3. Backend CORS must allow Chrome extension origins:
   ```typescript
   // In backend CORS config
   origin: ['chrome-extension://*', 'http://localhost:*']
   ```

### 3. 401 Unauthorized

**Error**: `401 Unauthorized` when making authenticated requests

**Cause**: 
- JWT token expired or invalid
- Token not being sent correctly
- Backend JWT_SECRET mismatch

**Solution**:
- Check Chrome storage for `aphasia-token`
- Verify token is being included in Authorization header
- Try logging out and logging back in

### 4. API Base URL Not Set

**Error**: Requests going to wrong URL or defaulting to localhost

**Solution**:
1. Create `.env` file in `aphasia/` directory:
   ```bash
   echo "VITE_API_BASE_URL=http://localhost:3000" > .env
   ```
2. Rebuild the extension:
   ```bash
   npm run build
   ```
3. Reload extension in Chrome

### 5. Backend Endpoints Don't Match

**Error**: 404 errors for specific endpoints

**Check**: The backend might use different endpoint structures:

**Frontend expects:**
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `GET /api/v1/auth/me`
- `GET /api/v1/user/profile`
- `PATCH /api/v1/user/profile`

**Backend might use:**
- `POST /api/v1/users/login`
- `POST /api/v1/users/register`
- `GET /api/v1/users/me`
- etc.

**Solution**: Update endpoint paths in:
- `src/lib/api/auth.ts`
- `src/lib/api/user.ts`
- `src/lib/api/reviews.ts`

## Debugging Steps

### 1. Check Browser Console

Open Chrome DevTools (F12) and check:
- Console tab for JavaScript errors
- Network tab for failed API requests
- Application tab > Storage > Chrome Storage for token/user data

### 2. Check Backend Logs

Look at backend server console for:
- Incoming requests
- Error messages
- Database connection issues

### 3. Test API Directly

Use curl or Postman to test backend endpoints:

```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test if endpoint exists
curl http://localhost:3000/api/v1/auth/login
```

### 4. Verify Environment Variables

Check that `.env` file exists and has correct values:
```bash
cat aphasia/.env
```

### 5. Check Extension Console

1. Open extension popup
2. Right-click in popup → Inspect
3. Check Console for errors
4. Check Network tab for API calls

## Quick Diagnostic Checklist

- [ ] Backend server is running
- [ ] `.env` file exists with correct `VITE_API_BASE_URL`
- [ ] Extension has been rebuilt after `.env` changes
- [ ] Extension has been reloaded in Chrome
- [ ] Backend CORS allows Chrome extension origins
- [ ] Backend auth endpoints exist and match frontend calls
- [ ] JWT_SECRET is set in backend
- [ ] Database is connected and migrations are run

## Getting More Information

If you're seeing a specific error:

1. **Check the exact error message** in:
   - Browser console (F12)
   - Extension popup console (right-click popup → Inspect)
   - Backend server logs

2. **Check the Network tab** to see:
   - What URL is being called
   - What status code is returned
   - What error message is in the response

3. **Share the error details** including:
   - Full error message
   - Status code
   - Request URL
   - Response body (if any)

