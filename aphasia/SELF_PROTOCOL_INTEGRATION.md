# Self Protocol Integration Guide

## Overview

The frontend now uses **Self Protocol** for identity verification instead of traditional email/password authentication. Self Protocol uses zero-knowledge proofs to verify user identity using passport scanning, ensuring privacy and security.

## What Was Changed

### ✅ Removed
- **Content Script (Assistant Feature)**: Completely removed the AI assistant feature that appeared on web pages
- **Email/Password Auth**: Replaced with Self Protocol verification

### ✅ Added
- **Self Protocol SDK**: Installed `@selfxyz/qrcode`, `@selfxyz/core`, and `ethers`
- **SelfVerification Component**: QR code component for passport verification
- **Self Auth Integration**: Updated auth system to use Self Protocol

## Frontend Implementation

### Self Protocol Flow

1. **User clicks "Verify with Self Protocol"** on login/signup page
2. **QR Code is displayed** using `SelfQRcodeWrapper` component
3. **User scans QR code** with Self mobile app
4. **User verifies passport** using NFC on their phone
5. **Zero-knowledge proof is generated** and sent to backend
6. **Backend verifies proof** and returns JWT token
7. **User is authenticated** and logged in

### Frontend API Call

```typescript
POST /api/v1/self/verify
Content-Type: application/json

Request Body:
{
  "proof": { ... },           // Zero-knowledge proof from Self
  "pubSignals": { ... },      // Public signals from proof
  "userContextData": { ... } // Optional user context
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
    "verifiedL1": true,
    "verifiedL2": false,
    "verifiedL3": true  // Set to true after Self verification
  }
}
```

## Backend Implementation Required

### 1. Install Self Protocol Backend Package

```bash
npm install @selfxyz/core
```

### 2. Set Up Self Backend Verifier

```typescript
import { SelfBackendVerifier, DefaultConfigStore } from '@selfxyz/core'

const configStore = new DefaultConfigStore({
  minimumAge: 18,
  excludedCountries: ['IRN', 'PRK'], // Iran and North Korea
  ofac: true, // Check OFAC sanctions list
})

const verifier = new SelfBackendVerifier(
  'aphasia-identity-verification', // Must match frontend scope
  'http://localhost:3000/api/v1/self/verify', // Verification endpoint
  false, // Set to true for testing with mock passports
  new Map([[1, true], [2, true]]), // Allow passport (1) and EU ID (2)
  configStore,
  'uuid' // User ID format
)
```

### 3. Create Verification Endpoint

```typescript
// POST /api/v1/self/verify
app.post('/api/v1/self/verify', async (req, res) => {
  const { proof, pubSignals, userContextData } = req.body

  try {
    // Verify the proof
    const result = await verifier.verify(
      proof.attestationId,
      proof,
      pubSignals,
      userContextData
    )

    if (result.isValidDetails.isValid) {
      // Create or find user based on verification
      // For first-time users, create account
      // For existing users, update verification status
      
      const user = await findOrCreateUserFromSelfVerification(result)
      
      // Generate JWT token
      const token = generateJWT(user)
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email || `self-${user.id}@aphasia.eth`,
          name: user.name,
          level: user.level,
          score: user.score,
          verifiedL1: true,
          verifiedL2: user.verifiedL2,
          verifiedL3: true, // Self verification = L3
        }
      })
    } else {
      res.status(400).json({
        success: false,
        error: 'Verification failed',
        details: result.isValidDetails
      })
    }
  } catch (error) {
    console.error('Self verification error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Verification failed'
    })
  }
})
```

### 4. User Creation/Update Logic

```typescript
async function findOrCreateUserFromSelfVerification(verificationResult: any) {
  // Extract user identifier from verification
  const userId = verificationResult.userContextData?.userId || 
                 verificationResult.pubSignals?.userId ||
                 generateUUID()
  
  // Check if user exists
  let user = await db.user.findUnique({
    where: { selfId: userId }
  })
  
  if (!user) {
    // Create new user
    user = await db.user.create({
      data: {
        selfId: userId,
        email: `self-${userId}@aphasia.eth`,
        name: 'Self Verified User',
        level: 1,
        score: 0,
        verifiedL1: true,
        verifiedL2: false,
        verifiedL3: true, // Self verification = L3
      }
    })
  } else {
    // Update existing user's L3 verification
    user = await db.user.update({
      where: { id: user.id },
      data: {
        verifiedL3: true,
        level: Math.max(user.level, 3)
      }
    })
  }
  
  return user
}
```

## Configuration

### Frontend Configuration

The frontend is configured with:
- **App Name**: "Aphasia"
- **Scope**: "aphasia-identity-verification"
- **Endpoint**: `${API_BASE_URL}/api/v1/self/verify`
- **Disclosures**:
  - Minimum Age: 18
  - Nationality: Required
  - OFAC Check: Enabled
  - Excluded Countries: Iran, North Korea

### Backend Configuration

The backend must match:
- **Scope**: "aphasia-identity-verification" (must match frontend)
- **Endpoint**: `/api/v1/self/verify`
- **Allowed Attestation IDs**: Passport (1), EU ID Card (2)
- **User ID Format**: UUID

## Testing

### Using Mock Passports

1. In Self mobile app, tap the Passport button 5 times
2. Create a mock passport
3. Set `mockPassport: true` in backend verifier
4. Test verification flow

### Staging Environment

For testing, use Self staging:
- Endpoint: `https://playground.staging.self.xyz/verify`
- Update frontend `.env` if needed

## Security Considerations

1. **Proof Verification**: Always verify proofs server-side
2. **User Identification**: Use consistent user IDs from Self verification
3. **Token Generation**: Generate JWT tokens only after successful verification
4. **Rate Limiting**: Implement rate limiting on verification endpoint
5. **Error Handling**: Don't expose sensitive verification details in errors

## Migration Notes

- **Existing Users**: May need to verify with Self Protocol to access L3 features
- **Backward Compatibility**: Keep email/password as fallback option (currently still in UI)
- **User Data**: Store `selfId` in user table for linking Self identity

## Resources

- [Self Protocol Documentation](https://docs.self.xyz/)
- [Self QRCode SDK](https://docs.self.xyz/frontend-integration/qrcode-sdk)
- [Self Backend Verifier](https://docs.self.xyz/backend-integration/basic-integration)
- [Self Builder Group](https://t.me/selfbuilder) - Community support

## Next Steps

1. ✅ Frontend integration complete
2. ⏳ Backend needs to implement `/api/v1/self/verify` endpoint
3. ⏳ Backend needs to install `@selfxyz/core` package
4. ⏳ Backend needs to configure `SelfBackendVerifier`
5. ⏳ Database schema may need `selfId` field for users

