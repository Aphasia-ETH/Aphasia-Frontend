# Fixing "Localhost Endpoints Not Allowed" Error

## Problem
Chrome extensions have security restrictions that can block localhost requests even with proper permissions.

## Solution Steps

### 1. Rebuild the Extension
After manifest changes, you must rebuild:
```bash
cd aphasia
npm run build
```

### 2. Reload Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Find "Aphasia" extension
3. Click the **reload** button (circular arrow icon)
4. Or remove and re-add the extension

### 3. Verify Permissions
1. In `chrome://extensions/`, click "Details" on the Aphasia extension
2. Scroll to "Site access" or "Host permissions"
3. Verify that `http://localhost:*/*` is listed
4. If not, the manifest might not have been applied correctly

### 4. Check Backend CORS Configuration
Your backend must allow Chrome extension origins. In your backend CORS config:

```typescript
// Example Express CORS config
app.use(cors({
  origin: [
    'chrome-extension://*',
    'http://localhost:*',
    'http://127.0.0.1:*'
  ],
  credentials: true
}))
```

### 5. Test Backend Directly
Verify backend is accessible:
```bash
curl http://localhost:3000/health
# or
curl http://localhost:3000/api/v1/health
```

### 6. Check Extension Console
1. Open extension popup
2. Right-click → Inspect
3. Check Console tab for specific error messages
4. Check Network tab to see if requests are being blocked

## Alternative: Use Production API
If localhost continues to fail, you can use a production/staging API:

1. Create `.env` file in `aphasia/`:
```env
VITE_API_BASE_URL=https://your-api-domain.com
```

2. Rebuild:
```bash
npm run build
```

3. Reload extension

## Manifest V3 Requirements
The manifest has been updated to use wildcards:
- `http://localhost:*/*` (allows any port)
- `http://127.0.0.1:*/*` (allows any port)

This should allow connections to localhost on any port.

## Still Not Working?
1. Check Chrome version (Manifest V3 requires Chrome 88+)
2. Try disabling other extensions that might interfere
3. Check if antivirus/firewall is blocking localhost connections
4. Verify backend is actually running and accessible
5. Check backend logs for incoming requests

