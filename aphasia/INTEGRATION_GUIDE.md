# Frontend-Backend Integration Guide

## Overview

The Aphasia Chrome Extension frontend is now fully integrated with the Aphasia Backend API. This guide explains how to configure and use the integration.

## Configuration

### 1. Set API Base URL

Create a `.env` file in the `aphasia/` directory:

```bash
cp .env.example .env
```

Edit `.env` and set your backend API URL:

```env
VITE_API_BASE_URL=http://localhost:3000
```

For production:
```env
VITE_API_BASE_URL=https://api.aphasia.eth
```

### 2. Build the Extension

After setting the API URL, rebuild the extension:

```bash
npm run build
```

## API Integration Features

### ✅ Authentication
- **Login**: `POST /api/v1/auth/login`
- **Signup**: `POST /api/v1/auth/register`
- **JWT Token Management**: Automatically stored in Chrome storage
- **User Profile**: Fetched from `GET /api/v1/auth/me`

### ✅ Reviews
- **Fetch Reviews**: `GET /api/v1/reviews/product/:productId`
- **Create L1 Review**: `POST /api/v1/reviews/l1`
- **Create L2 Review**: `POST /api/v1/reviews/l2`
- **Create L3 Review**: `POST /api/v1/reviews/l3`
- **Create L3 Batch Review**: `POST /api/v1/reviews/l3-batch`

### ✅ User Management
- **Get Profile**: `GET /api/v1/user/profile`
- **Update Profile**: `PATCH /api/v1/user/profile`
- **Get Stats**: `GET /api/v1/user/stats`

## How It Works

### Authentication Flow

1. User enters credentials in Login/Signup form
2. Frontend calls `authApi.login()` or `authApi.signup()`
3. Backend returns JWT token and user data
4. Token is stored in Chrome storage (`aphasia-token`)
5. Token is automatically included in all subsequent API requests
6. User data is cached in Chrome storage for quick access

### Review Creation Flow

1. User selects review level (L1/L2/L3)
2. System checks user verification status:
   - L1: Always available
   - L2: Requires `verifiedL2` to be true
   - L3: Requires `verifiedL3` to be true
3. User types review content
4. Frontend calls `reviewsApi.createReview()`
5. Backend processes review and returns confirmation
6. Review appears in the list immediately

### Data Fetching

- **Reviews**: Fetched on component mount from `reviewsApi.getProductReviews()`
- **User Profile**: Fetched on mount and cached in Chrome storage
- **Error Handling**: Falls back to cached data if API fails
- **Loading States**: Shows spinners during API calls

## API Service Layer

The API integration is handled by the service layer in `src/lib/api/`:

- **`config.ts`**: API configuration and token management
- **`client.ts`**: HTTP client with error handling
- **`auth.ts`**: Authentication API methods
- **`reviews.ts`**: Reviews API methods
- **`user.ts`**: User profile API methods

### Example Usage

```typescript
import { authApi, reviewsApi, userApi } from '@/lib/api'

// Login
const response = await authApi.login({ email, password })

// Get reviews
const reviews = await reviewsApi.getProductReviews('product-id')

// Create review
const newReview = await reviewsApi.createReview({
  productId: 'product-id',
  content: 'Great product!',
  level: 1
})

// Get user profile
const user = await userApi.getProfile()
```

## Error Handling

All API calls include comprehensive error handling:

- **Network Errors**: Displayed as toast notifications
- **API Errors**: Show backend error messages
- **401 Unauthorized**: Token expired/invalid (should trigger re-login)
- **404 Not Found**: Graceful fallback to cached data
- **500 Server Errors**: User-friendly error messages

## Chrome Storage

The extension uses Chrome storage for:

- **`aphasia-token`**: JWT authentication token
- **`aphasia-user`**: Cached user profile data
- **`aphasia-auth`**: Authentication status flag
- **`aphasia-settings`**: User preferences
- **`aphasia-route`**: Current route state

## Testing the Integration

### 1. Start Backend Server

```bash
cd ../Aphasia-Backend
npm run dev
```

Backend should be running on `http://localhost:3000`

### 2. Load Extension in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `aphasia/dist` directory

### 3. Test Authentication

1. Click extension icon
2. Try signing up with a new account
3. Or login with existing credentials
4. Verify user profile loads correctly

### 4. Test Reviews

1. Navigate to the Reviews page
2. Select a review level (L1/L2/L3)
3. Type a review and submit
4. Verify review appears in the list
5. Check backend logs for processing

## Troubleshooting

### API Connection Issues

**Problem**: "Network error occurred"
- **Solution**: Check that backend is running and `VITE_API_BASE_URL` is correct

### Authentication Fails

**Problem**: "Login failed" or 401 errors
- **Solution**: 
  - Verify backend auth endpoints are working
  - Check CORS settings in backend
  - Ensure JWT_SECRET is set in backend

### Reviews Not Loading

**Problem**: Reviews don't appear
- **Solution**:
  - Check browser console for errors
  - Verify `productId` is set correctly
  - Check backend logs for API calls
  - Ensure user is authenticated

### CORS Errors

**Problem**: CORS policy errors in console
- **Solution**: Backend must allow Chrome extension origin:
  ```typescript
  // In backend CORS config
  origin: ['chrome-extension://*']
  ```

## Next Steps

1. **Add Product Selection**: Allow users to select/change product
2. **Add Review Editing**: Enable editing of own reviews
3. **Add Review Deletion**: Allow users to delete their reviews
4. **Add Verification Flow**: UI for L2/L3 verification process
5. **Add Batch Status**: Show batch processing status for reviews
6. **Add Blockchain Links**: Display Hashscan links for verified reviews

## API Endpoints Reference

See `BACKEND_ANALYSIS.md` for complete API documentation.

## Support

For issues or questions:
- Check backend logs
- Check browser console
- Verify environment variables
- Review API documentation in backend repo
