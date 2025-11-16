# Frontend-Backend API Alignment

This document ensures the frontend is aligned with the [Aphasia Backend API](https://github.com/Aphasia-ETH/Aphasia-Backend).

## ✅ Aligned Endpoints

### Review Endpoints
- ✅ `POST /api/v1/reviews/l1` - Create L1 review
- ✅ `POST /api/v1/reviews/l2` - Create L2 review  
- ✅ `POST /api/v1/reviews/l3` - Create L3 review (individual)
- ✅ `POST /api/v1/reviews/l3-batch` - Create L3 review (batch optimized)
- ✅ `GET /api/v1/reviews/product/:productId` - Get product reviews
- ✅ `GET /api/v1/reviews/content/:reviewId` - Get review content from IPFS

### Batch Management Endpoints
- ✅ `GET /api/v1/batch/status` - Get batch processing status
- ✅ `POST /api/v1/batch/force` - Force batch attestation

### IPFS Endpoints
- ✅ `POST /api/v1/ipfs/upload` - Upload content to IPFS

### Authentication Endpoints
- ✅ `POST /api/v1/auth/login` - User login (Email + JWT)
- ✅ `POST /api/v1/auth/register` - User registration
- ✅ `GET /api/v1/auth/me` or `GET /api/v1/user/profile` - Get user profile

## Implementation Details

### Review Creation
The frontend automatically routes to the correct endpoint based on review level:
- L1 → `/api/v1/reviews/l1`
- L2 → `/api/v1/reviews/l2`
- L3 → `/api/v1/reviews/l3` (or `/api/v1/reviews/l3-batch` for batch optimization)

### Batch Optimization
The backend uses Merkle Tree batching to reduce costs by 99%:
- Batches every 100 reviews or 1 hour
- Frontend can check status via `batchApi.getStatus()`
- Frontend can force batch via `batchApi.forceBatch()` (requires auth)

### IPFS Integration
Content is stored on IPFS via Pinata:
- Frontend can upload content via `ipfsApi.upload()`
- Returns IPFS hash for storage in database

### Authentication
- Uses Email + JWT (as per backend)
- JWT token stored in Chrome storage
- Token automatically included in authenticated requests

## Usage Examples

### Check Batch Status
```typescript
import { batchApi } from '@/lib/api'

const status = await batchApi.getStatus()
console.log(`Pending reviews: ${status.data?.pendingCount}`)
```

### Force Batch Processing
```typescript
import { batchApi } from '@/lib/api'

await batchApi.forceBatch()
```

### Upload to IPFS
```typescript
import { ipfsApi } from '@/lib/api'

const result = await ipfsApi.upload({
  content: 'Review content here',
  metadata: { level: 3 }
})
console.log(`IPFS Hash: ${result.data?.ipfsHash}`)
```

## Configuration

Ensure `.env` is set correctly:
```env
VITE_API_BASE_URL=http://localhost:3000
```

For production:
```env
VITE_API_BASE_URL=https://api.aphasia.eth
```

## Notes

- All review creation endpoints require authentication
- Batch endpoints require authentication for force operations
- IPFS upload requires authentication
- The frontend handles various response formats for backward compatibility

