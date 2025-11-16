# Backend Authentication Setup Guide

## Current Status

The backend uses **JWT (JSON Web Tokens)** for authentication. Based on testing, the auth endpoints may not be fully implemented yet.

## Backend Authentication Service

The backend uses:
- **JWT (JSON Web Tokens)** - Standard token-based authentication
- **Email verification** - For account verification
- **Express.js middleware** - For token validation

## Required Backend Endpoints

The frontend expects these endpoints to be implemented:

### 1. User Registration
```
POST /api/v1/auth/register
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name" (optional)
}

Expected Response:
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "level": 1,
    "score": 0,
    "verifiedL1": false,
    "verifiedL2": false,
    "verifiedL3": false
  }
}
```

### 2. User Login
```
POST /api/v1/auth/login
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "password123"
}

Expected Response:
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "level": 1,
    "score": 0,
    "verifiedL1": false,
    "verifiedL2": false,
    "verifiedL3": false
  }
}
```

### 3. Get Current User
```
GET /api/v1/auth/me
Authorization: Bearer {jwt_token}

Expected Response:
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "level": 1,
  "score": 0,
  "verifiedL1": false,
  "verifiedL2": false,
  "verifiedL3": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 4. Token Refresh (Optional)
```
POST /api/v1/auth/refresh
Authorization: Bearer {jwt_token}

Expected Response:
{
  "token": "new_jwt_token_here"
}
```

## Backend Implementation Requirements

### 1. JWT Library
The backend should use a JWT library like:
- `jsonwebtoken` (Node.js)
- `@nestjs/jwt` (NestJS)
- Or any JWT library compatible with your framework

### 2. Password Hashing
Passwords should be hashed using:
- `bcrypt` or `bcryptjs`
- `argon2` (more secure)
- Never store plain text passwords

### 3. Middleware for Protected Routes
Create middleware to verify JWT tokens:

```typescript
// Example Express.js middleware
import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};
```

### 4. Environment Variables
The backend needs:
```env
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d  # Token expiration time
```

## Testing Authentication

### Test Registration
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### Test Protected Route
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Frontend Integration

The frontend is already configured to:
1. ✅ Store JWT tokens in Chrome storage
2. ✅ Include tokens in Authorization header
3. ✅ Handle authentication errors
4. ✅ Redirect to login when unauthorized

## Troubleshooting

### Issue: "Route not found" or "Not implemented yet"
**Solution:** The backend auth endpoints need to be implemented. Check the backend repository for auth routes.

### Issue: "Invalid token" errors
**Solution:** 
- Verify `JWT_SECRET` is set in backend `.env`
- Check token expiration time
- Ensure token is being sent in `Authorization: Bearer {token}` format

### Issue: CORS errors
**Solution:** Backend must allow Chrome extension origins:
```typescript
app.use(cors({
  origin: ['chrome-extension://*', 'http://localhost:*'],
  credentials: true
}));
```

## Next Steps

1. **Implement Backend Auth Endpoints**
   - Create registration endpoint
   - Create login endpoint
   - Create user profile endpoint
   - Add JWT middleware

2. **Test Authentication Flow**
   - Test registration
   - Test login
   - Test protected routes
   - Test token expiration

3. **Update Frontend if Needed**
   - Adjust endpoint paths if backend uses different routes
   - Handle different response formats
   - Add error handling for specific backend errors

## Alternative: If Backend Uses Different Endpoints

If your backend uses different endpoint paths (e.g., `/api/v1/users/register` instead of `/api/v1/auth/register`), update the frontend:

Edit `src/lib/api/auth.ts`:
```typescript
export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    // Change 'auth/login' to your backend's actual endpoint
    const response = await api.post<AuthResponse>('users/login', credentials, {
      requireAuth: false,
    })
    await setAuthToken(response.token)
    return response
  },
  // ... update other endpoints
}
```

