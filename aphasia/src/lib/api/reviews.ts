import { api } from './client'

export type ReviewLevel = 1 | 2 | 3

export interface Review {
  id: string
  userId: string
  productId: string
  content: string
  ipfsHash?: string
  level: ReviewLevel
  hcsMessageId?: string
  contractTxId?: string
  batchId?: string
  merkleProof?: string
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    level: number
    score?: number
    achievement?: string
  }
}

export interface CreateReviewRequest {
  productId: string
  content: string
  level: ReviewLevel
  // Backend expects these fields:
  reviewId?: string  // Optional - backend can generate if not provided
  rating?: number    // Optional - default to 5 if not provided
  text?: string      // Alias for content
  authorId?: string  // Will be set from auth context
  reviewerWallet?: string  // Required for L3 reviews
}

export interface CreateReviewResponse {
  success?: boolean
  review?: Review
  data?: {
    review?: Review
    reviewId?: string
    text?: string
    content?: string
    id?: string
    batchId?: string
  }
  message?: string
}

export interface ProductReviewsResponse {
  success?: boolean
  data?: {
    productId: string
    reviews: Array<{
      reviewId: string
      productId: string
      rating?: number
      text: string
      authorId: string
      level: ReviewLevel
      timestamp: number
    }>
  }
  reviews?: Review[]  // Fallback for different response formats
  total?: number
  page?: number
  limit?: number
}

export interface ReviewContentResponse {
  content: string
  ipfsHash: string
}

export const reviewsApi = {
  // Create reviews by level
  createL1: async (data: CreateReviewRequest): Promise<CreateReviewResponse> => {
    return api.post<CreateReviewResponse>('reviews/l1', data, { requireAuth: true })
  },

  createL2: async (data: CreateReviewRequest): Promise<CreateReviewResponse> => {
    return api.post<CreateReviewResponse>('reviews/l2', data, { requireAuth: true })
  },

  createL3: async (data: CreateReviewRequest): Promise<CreateReviewResponse> => {
    return api.post<CreateReviewResponse>('reviews/l3', data, { requireAuth: true })
  },

  createL3Batch: async (data: CreateReviewRequest): Promise<CreateReviewResponse> => {
    return api.post<CreateReviewResponse>('reviews/l3-batch', data, { requireAuth: true })
  },

  // Get reviews
  getProductReviews: async (productId: string): Promise<ProductReviewsResponse> => {
    return api.get<ProductReviewsResponse>(`reviews/product/${productId}`)
  },

  getReviewContent: async (reviewId: string): Promise<ReviewContentResponse> => {
    return api.get<ReviewContentResponse>(`reviews/content/${reviewId}`)
  },

  // Generic create review (will route to appropriate endpoint based on level)
  createReview: async (data: CreateReviewRequest): Promise<CreateReviewResponse> => {
    // Generate reviewId if not provided
    const reviewId = data.reviewId || `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Prepare request body matching backend expectations
    const requestBody: any = {
      reviewId,
      productId: data.productId,
      text: data.text || data.content,
      rating: data.rating || 5, // Default rating to 5 if not provided
      authorId: data.authorId, // Should be set by caller from user context
    }
    
    // Add reviewerWallet for L3 reviews
    if (data.level === 3 && data.reviewerWallet) {
      requestBody.reviewerWallet = data.reviewerWallet
    }
    
    // Use appropriate endpoint
    const endpoint = data.level === 3 ? `reviews/l3-batch` : `reviews/l${data.level}`
    return api.post<CreateReviewResponse>(endpoint, requestBody, { requireAuth: true })
  },

  // Update review (backend endpoint needs to be implemented)
  updateReview: async (reviewId: string, data: { text?: string; rating?: number }): Promise<CreateReviewResponse> => {
    return api.patch<CreateReviewResponse>(`reviews/${reviewId}`, data, { requireAuth: true })
  },

  // Delete review (backend endpoint needs to be implemented)
  deleteReview: async (reviewId: string): Promise<{ success: boolean; message?: string }> => {
    return api.delete<{ success: boolean; message?: string }>(`reviews/${reviewId}`, { requireAuth: true })
  },
}

// Batch Management API
export interface BatchStatusResponse {
  success: boolean
  data?: {
    pendingCount: number
    lastBatchTime?: string
    nextBatchTime?: string
    batchSize: number
    batchInterval: number
  }
  message?: string
}

export const batchApi = {
  getStatus: async (): Promise<BatchStatusResponse> => {
    return api.get<BatchStatusResponse>('batch/status')
  },

  forceBatch: async (): Promise<{ success: boolean; message?: string }> => {
    return api.post<{ success: boolean; message?: string }>('batch/force', {}, { requireAuth: true })
  },
}

// IPFS API
export interface IPFSUploadRequest {
  content: string
  metadata?: Record<string, any>
}

export interface IPFSUploadResponse {
  success: boolean
  data?: {
    ipfsHash: string
    pinataUrl?: string
  }
  message?: string
}

export const ipfsApi = {
  upload: async (data: IPFSUploadRequest): Promise<IPFSUploadResponse> => {
    return api.post<IPFSUploadResponse>('ipfs/upload', data, { requireAuth: true })
  },
}

