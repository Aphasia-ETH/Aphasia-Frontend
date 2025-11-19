import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  ThumbsUp, ThumbsDown, Paperclip, Send, Settings, Sparkles, Search, 
  TrendingUp, Clock, Star, X, ChevronDown, MessageCircle, ExternalLink, Shield, Edit, Trash2
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { reviewsApi, batchApi, ReviewLevel, ApiClientError, healthApi, BatchStatusResponse } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface User {
  id: string
  name: string
  avatar: string
  level: number
  score?: number
  achievement?: string
}

interface Comment {
  id: string
  user: User
  content: string
  timestamp: string
  likes: number
  dislikes: number
  isLiked: boolean
  isDisliked: boolean
  isAISummary?: boolean
  reviewLevel?: number  // The level of the review (L1, L2, L3)
  onChainVerified?: boolean  // Whether the review is verified on-chain
  transactionHash?: string  // Hedera transaction hash
  hcsSequence?: string  // HCS sequence number
  hederaTopicId?: string  // HCS topic ID
}

type SortOption = 'recent' | 'popular' | 'trending'

interface ReviewsProps {
  onNavigate?: (route: 'login' | 'signup' | 'settings') => void
}

export function Reviews({ onNavigate }: ReviewsProps) {
  const { user, isAuthenticated } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState({ 
    id: '', 
    name: 'Guest', 
    level: 1, 
    score: 1,
    verifiedL1: false,
    verifiedL2: false,
    verifiedL3: false,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [selectedLevel, setSelectedLevel] = useState<ReviewLevel>(1)
  const [productId, setProductId] = useState(() => {
    // Try to load from localStorage first
    if (typeof chrome !== 'undefined' && chrome.storage) {
      return 'default-product' // Will be loaded from storage in useEffect
    }
    return localStorage.getItem('aphasia-product-id') || 'default-product'
  })
  const [productName, setProductName] = useState('')
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [productInput, setProductInput] = useState('')
  const [batchStatus, setBatchStatus] = useState<BatchStatusResponse | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load user profile from auth context
  useEffect(() => {
    if (user) {
      setUserProfile({
        id: user.id,
        name: user.name || 'Guest',
        level: user.level,
        score: user.score,
        verifiedL1: user.verifiedL1,
        verifiedL2: user.verifiedL2,
        verifiedL3: user.verifiedL3,
      })
    } else if (!isAuthenticated) {
      // If not authenticated, set guest profile
      setUserProfile({
        id: '',
        name: 'Guest',
        level: 1,
        score: 1,
        verifiedL1: false,
        verifiedL2: false,
        verifiedL3: false,
      })
    }
  }, [user, isAuthenticated])

  // Load product ID from storage and try to extract from page
  useEffect(() => {
    const loadProductId = async () => {
      // Try Chrome storage first (for extension)
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['aphasia-product-id', 'aphasia-product-name'], (result) => {
          if (result['aphasia-product-id']) {
            setProductId(result['aphasia-product-id'])
            setProductName(result['aphasia-product-name'] || '')
          } else {
            // Try to extract from current page
            extractProductFromPage()
          }
        })
      } else {
        // Use localStorage for web
        const storedId = localStorage.getItem('aphasia-product-id')
        const storedName = localStorage.getItem('aphasia-product-name')
        if (storedId) {
          setProductId(storedId)
          setProductName(storedName || '')
        } else {
          // Try to extract from current page
          extractProductFromPage()
        }
      }
    }

    const extractProductFromPage = () => {
      // Try to extract product info from page (for Chrome extension)
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.url) {
            const url = new URL(tabs[0].url)
            // Try common e-commerce patterns
            const pathParts = url.pathname.split('/').filter(Boolean)
            
            // Amazon: /dp/PRODUCT_ID or /gp/product/PRODUCT_ID
            if (url.hostname.includes('amazon')) {
              const dpMatch = url.pathname.match(/\/dp\/([A-Z0-9]+)/)
              const gpMatch = url.pathname.match(/\/gp\/product\/([A-Z0-9]+)/)
              if (dpMatch) {
                const id = dpMatch[1]
                setProductId(`amazon-${id}`)
                setProductName('Amazon Product')
                saveProductId(`amazon-${id}`, 'Amazon Product')
                return
              } else if (gpMatch) {
                const id = gpMatch[1]
                setProductId(`amazon-${id}`)
                setProductName('Amazon Product')
                saveProductId(`amazon-${id}`, 'Amazon Product')
                return
              }
            }
            
            // Generic: use domain + path as product ID
            if (pathParts.length > 0) {
              const extractedId = `${url.hostname}-${pathParts[pathParts.length - 1]}`
              setProductId(extractedId)
              setProductName(url.hostname)
              saveProductId(extractedId, url.hostname)
            }
          }
        })
      }
    }

    loadProductId()
  }, [])

  // Save product ID to storage
  const saveProductId = (id: string, name: string = '') => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({
        'aphasia-product-id': id,
        'aphasia-product-name': name,
      })
    } else {
      localStorage.setItem('aphasia-product-id', id)
      if (name) {
        localStorage.setItem('aphasia-product-name', name)
      }
    }
  }

  // Handle product ID change
  const handleProductChange = (newProductId: string, newProductName: string = '') => {
    setProductId(newProductId)
    setProductName(newProductName)
    saveProductId(newProductId, newProductName)
    setShowProductSelector(false)
    setProductInput('')
    // Reviews will reload automatically when productId changes
  }

  // Test connection and fetch reviews from API
  useEffect(() => {
    const loadReviews = async () => {
      setIsLoading(true)
      
      // First, test connection
      const healthCheck = await healthApi.checkConnection()
      if (healthCheck.status === 'error') {
        console.error('Backend connection failed:', healthCheck.message)
        toast.error('Cannot connect to backend', {
          description: healthCheck.message || 'Please ensure the backend server is running.',
          duration: 5000,
        })
        setComments([])
        setIsLoading(false)
        return
      }
      
      try {
        const response = await reviewsApi.getProductReviews(productId)
        
        // Handle different response formats
        let reviews: any[] = []
        if (response.data?.reviews) {
          // Backend format: { success: true, data: { reviews: [...] } }
          reviews = response.data.reviews
        } else if (response.reviews) {
          // Alternative format: { reviews: [...] }
          reviews = response.reviews
        }
        
        // Convert API reviews to Comment format
        const convertedComments: Comment[] = reviews.map((review: any) => ({
          id: review.reviewId || review.id,
          user: {
            id: review.user?.id || review.authorId || review.userId,
            name: review.user?.name || 'Anonymous',
            avatar: review.user?.name?.charAt(0).toUpperCase() || 'A',
            level: review.level || review.user?.level || 1, // Review level takes precedence
            score: review.user?.score,
            achievement: review.user?.achievement,
          },
          content: review.text || review.content,
          timestamp: review.timestamp 
            ? formatTimestamp(new Date(review.timestamp).toISOString())
            : formatTimestamp(review.createdAt || new Date().toISOString()),
          likes: 0, // Backend doesn't have likes yet
          dislikes: 0,
          isLiked: false,
          isDisliked: false,
          reviewLevel: review.level || 1, // Store review level separately
          onChainVerified: review.onChainVerified || !!(review.transactionHash || review.hcsSequence), // Store verification status
          transactionHash: review.transactionHash,
          hcsSequence: review.hcsSequence,
          hederaTopicId: review.hederaTopicId || review.topicId,
        }))
        setComments(convertedComments)
      } catch (error) {
        console.error('Failed to fetch reviews:', error)
        // Set empty array on error - no mock data fallback
        setComments([])
        
        if (error instanceof ApiClientError) {
          // 404 means no reviews exist yet - that's okay, show empty state
          if (error.status === 404) {
            // Don't show error for 404, just show empty state
            return
          }
          // Show error for other status codes
          toast.error('Failed to load reviews', {
            description: error.message,
          })
        } else {
          // Network or other errors
          toast.error('Failed to load reviews', {
            description: 'Unable to connect to the server. Please check your connection.',
          })
        }
      } finally {
        setIsLoading(false)
      }
    }
    
    loadReviews()
  }, [productId])

  // Load batch status periodically
  useEffect(() => {
    const loadBatchStatus = async () => {
      try {
        const status = await batchApi.getStatus()
        setBatchStatus(status)
      } catch (error) {
        console.error('Failed to load batch status:', error)
        // Don't show error - batch status is optional
      }
    }

    // Load immediately
    loadBatchStatus()

    // Refresh every 30 seconds
    const interval = setInterval(loadBatchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  // Format time until next batch
  const formatTimeUntilBatch = (ms: number): string => {
    if (ms < 0) return 'Overdue'
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
    return date.toLocaleDateString()
  }

  // Filter and sort comments
  const filteredAndSortedComments = useMemo(() => {
    let filtered = comments.filter(comment => {
      if (searchQuery.trim() === '') return true
      const query = searchQuery.toLowerCase()
      return (
        comment.content.toLowerCase().includes(query) ||
        comment.user.name.toLowerCase().includes(query)
      )
    })

    // Sort comments
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.likes - a.likes
        case 'trending':
          // Combine likes and recency
          const aScore = a.likes + (a.timestamp.includes('hour') ? 10 : a.timestamp.includes('day') ? 5 : 0)
          const bScore = b.likes + (b.timestamp.includes('hour') ? 10 : b.timestamp.includes('day') ? 5 : 0)
          return bScore - aScore
        case 'recent':
        default:
          // Simple time-based sorting (in real app, would parse dates)
          if (a.timestamp.includes('hour') && !b.timestamp.includes('hour')) return -1
          if (!a.timestamp.includes('hour') && b.timestamp.includes('hour')) return 1
          return 0
      }
    })

    return sorted
  }, [comments, searchQuery, sortBy])

  const handleVote = (commentId: string, voteType: 'up' | 'down') => {
    setComments((prevComments) =>
      prevComments.map((comment) => {
        if (comment.id === commentId) {
          const wasLiked = comment.isLiked
          const wasDisliked = comment.isDisliked
          
          if (voteType === 'up') {
            // If already liked, unlike it
            if (wasLiked) {
              return {
                ...comment,
                isLiked: false,
                likes: comment.likes - 1,
              }
            }
            
            // If was disliked, remove dislike and add like
            if (wasDisliked) {
              return {
                ...comment,
                isLiked: true,
                isDisliked: false,
                likes: comment.likes + 1,
                dislikes: comment.dislikes - 1,
              }
            }
            
            // Otherwise, add like
            return {
              ...comment,
              isLiked: true,
              likes: comment.likes + 1,
            }
          } else {
            // If already disliked, undislike it
            if (wasDisliked) {
              return {
                ...comment,
                isDisliked: false,
                dislikes: comment.dislikes - 1,
              }
            }
            
            // If was liked, remove like and add dislike
            if (wasLiked) {
              return {
                ...comment,
                isLiked: false,
                isDisliked: true,
                likes: comment.likes - 1,
                dislikes: comment.dislikes + 1,
              }
            }
            
            // Otherwise, add dislike
            return {
              ...comment,
              isDisliked: true,
              dislikes: comment.dislikes + 1,
            }
          }
        }
        return comment
      })
    )
  }

  const handleSendComment = async () => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment')
      return
    }

    // Check if user is authenticated
    if (!isAuthenticated || !userProfile.id) {
      toast.error('Authentication required', {
        description: 'Please log in to post a review.',
      })
      onNavigate?.('login')
      return
    }

    // Check verification level
    if (selectedLevel === 2 && !userProfile.verifiedL2) {
      toast.error('L2 verification required', {
        description: 'Please complete Self Protocol verification in settings to post L2 reviews.',
      })
      return
    }
    if (selectedLevel === 3 && !userProfile.verifiedL3) {
      toast.error('L3 verification required', {
        description: 'Please verify your social media account in settings to post L3 reviews.',
      })
      return
    }

    setIsSending(true)
    
    try {
      // Prepare review data with required fields
      const reviewData: any = {
        productId,
        content: commentText.trim(),
        level: selectedLevel,
        authorId: userProfile.id, // Required by backend
        rating: 5, // Default rating (can be made configurable later)
      }
      
      // Add reviewerWallet for L3 reviews (if available)
      // Note: Backend may require wallet address for L3 reviews
      // For now, we'll let the backend handle this requirement
      if (selectedLevel === 3) {
        // Backend will need reviewerWallet - this should be provided by the user's wallet connection
        // For now, we'll omit it and let backend handle the validation
      }
      
      const response = await reviewsApi.createReview(reviewData)
      
      // Handle different response formats
      let reviewResponse: any
      if (response.review) {
        reviewResponse = response.review
      } else if (response.data?.review) {
        reviewResponse = response.data.review
      } else if (response.data) {
        reviewResponse = response.data
      } else {
        reviewResponse = response
      }
      
      // Convert API response to Comment format
      const newComment: Comment = {
        id: reviewResponse.reviewId || reviewResponse.id,
        user: {
          id: userProfile.id,
          name: userProfile.name,
          avatar: userProfile.name.charAt(0).toUpperCase(),
          level: userProfile.level,
          score: userProfile.score,
        },
        content: reviewResponse.text || reviewResponse.content || commentText,
        timestamp: 'Just now',
        likes: 0,
        dislikes: 0,
        isLiked: false,
        isDisliked: false,
      }

      setComments(prev => [newComment, ...prev])
      setCommentText('')
      
      toast.success('Review posted!', {
        description: `L${selectedLevel} review has been created${reviewResponse.batchId ? ' and queued for batch processing' : ''}.`,
        icon: <Sparkles className="h-4 w-4" />,
      })
      
      // Refresh reviews list to get updated data
      const refreshResponse = await reviewsApi.getProductReviews(productId)
      if (refreshResponse.data?.reviews) {
        const convertedComments: Comment[] = refreshResponse.data.reviews.map((review: any) => ({
          id: review.reviewId || review.id,
          user: {
            id: review.user?.id || review.authorId || review.userId,
            name: review.user?.name || 'Anonymous',
            avatar: review.user?.name?.charAt(0).toUpperCase() || 'A',
            level: review.user?.level || review.level || 1,
            score: review.user?.score,
            achievement: review.user?.achievement,
          },
          content: review.text || review.content,
          timestamp: review.timestamp 
            ? formatTimestamp(new Date(review.timestamp).toISOString())
            : formatTimestamp(review.createdAt || new Date().toISOString()),
          likes: 0,
          dislikes: 0,
          isLiked: false,
          isDisliked: false,
        }))
        setComments(convertedComments)
      }
    } catch (error) {
      console.error('Failed to post review:', error)
      
      let errorMessage: string = 'Failed to post review. Please try again.'
      if (error instanceof ApiClientError) {
        errorMessage = error.message || 'Failed to post review. Please try again.'
        
        // Show detailed error if it includes field information
        if (error.errors && typeof error.errors === 'object') {
          const missingFields = Object.keys(error.errors).join(', ')
          if (missingFields) {
            errorMessage = `Missing required fields: ${missingFields}`
          }
        }
        
        // Handle authentication errors
        if (error.status === 401) {
          errorMessage = 'Please log in to post a review.'
          onNavigate?.('login')
        }
      } else if (error instanceof Error) {
        errorMessage = error.message || 'Failed to post review. Please try again.'
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as any).message) || 'Failed to post review. Please try again.'
      }
      
      toast.error('Failed to post review', {
        description: errorMessage,
        duration: 5000,
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendComment()
    }
  }

  // Check if comment belongs to current user
  const isOwnComment = (comment: Comment): boolean => {
    return !!(isAuthenticated && userProfile.id && comment.user.id === userProfile.id)
  }

  // Handle edit review
  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditText(comment.content)
  }

  const handleSaveEdit = async () => {
    if (!editingCommentId || !editText.trim()) {
      toast.error('Please enter review text')
      return
    }

    setIsEditing(true)
    try {
      await reviewsApi.updateReview(editingCommentId, { text: editText.trim() })
      
      // Update comment in local state
      setComments(prev => prev.map(comment => 
        comment.id === editingCommentId
          ? { ...comment, content: editText.trim() }
          : comment
      ))

      setEditingCommentId(null)
      setEditText('')
      toast.success('Review updated successfully')
    } catch (error) {
      console.error('Failed to update review:', error)
      
      let errorMessage = 'Failed to update review. Please try again.'
      if (error instanceof ApiClientError) {
        if (error.status === 404) {
          errorMessage = 'Update endpoint not yet implemented on the backend. Please contact the backend team to implement PATCH /api/v1/reviews/:reviewId'
        } else {
          errorMessage = error.message || errorMessage
        }
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage
      }
      
      toast.error('Failed to update review', {
        description: errorMessage,
        duration: 5000,
      })
    } finally {
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditText('')
  }

  // Handle delete review
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    setDeletingCommentId(commentId)
    
    try {
      await reviewsApi.deleteReview(commentId)
      
      // Remove comment from local state
      setComments(prev => prev.filter(comment => comment.id !== commentId))
      
      toast.success('Review deleted successfully')
    } catch (error) {
      console.error('Failed to delete review:', error)
      
      let errorMessage = 'Failed to delete review. Please try again.'
      if (error instanceof ApiClientError) {
        if (error.status === 404) {
          errorMessage = 'Delete endpoint not yet implemented on the backend. Please contact the backend team to implement DELETE /api/v1/reviews/:reviewId'
        } else {
          errorMessage = error.message || errorMessage
        }
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage
      }
      
      toast.error('Failed to delete review', {
        description: errorMessage,
        duration: 5000,
      })
    } finally {
      setIsDeleting(false)
      setDeletingCommentId(null)
    }
  }

  const getLevelBadgeColor = (level: number) => {
    switch (level) {
      case 3: return 'bg-green-500'
      case 2: return 'bg-yellow-500'
      case 1: return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }


  const getSortIcon = () => {
    switch (sortBy) {
      case 'popular': return <Star className="h-3 w-3" />
      case 'trending': return <TrendingUp className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  return (
    <div className="w-full h-full max-w-md mx-auto flex flex-col px-3">

      {/* User Profile Section */}
      <div className="bg-card border rounded-lg m-2 p-4 shadow-sm transition-all hover:shadow-md animate-in fade-in slide-in-from-top-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-sm">Lv{userProfile.level}</span>
            </div>
            <div>
              <div className="font-medium">{userProfile.name}</div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Level {userProfile.level}</span>
                <span className="text-muted-foreground">•</span>
                <span className="font-semibold text-primary">${userProfile.score} Rep</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 transition-all hover:scale-110"
              onClick={() => onNavigate?.('settings')}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Product Selection */}
      <div className="bg-card border rounded-lg m-2 p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground mb-1">Product</div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">
                {productName || productId}
              </span>
              <Badge variant="outline" className="text-xs">
                {productId}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowProductSelector(!showProductSelector)}
          >
            {showProductSelector ? 'Cancel' : 'Change'}
          </Button>
        </div>
        
        {showProductSelector && (
          <div className="mt-3 space-y-2 pt-3 border-t">
            <Input
              placeholder="Enter product ID or name"
              value={productInput}
              onChange={(e) => setProductInput(e.target.value)}
              className="text-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && productInput.trim()) {
                  handleProductChange(productInput.trim(), productInput.trim())
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => {
                  if (productInput.trim()) {
                    handleProductChange(productInput.trim(), productInput.trim())
                  }
                }}
                disabled={!productInput.trim()}
              >
                Set Product
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  // Try to extract from current page again
                  if (typeof chrome !== 'undefined' && chrome.tabs) {
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                      if (tabs[0]?.url) {
                        const url = new URL(tabs[0].url)
                        const pathParts = url.pathname.split('/').filter(Boolean)
                        if (pathParts.length > 0) {
                          const extractedId = `${url.hostname}-${pathParts[pathParts.length - 1]}`
                          handleProductChange(extractedId, url.hostname)
                        }
                      }
                    })
                  }
                }}
              >
                Auto-detect
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Batch Status */}
      {batchStatus && batchStatus.data && batchStatus.data.pendingCount > 0 && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg m-2 p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div>
                <div className="text-xs font-medium">Batch Processing</div>
                <div className="text-xs text-muted-foreground">
                  {batchStatus.data.pendingCount} review{batchStatus.data.pendingCount !== 1 ? 's' : ''} pending
                </div>
              </div>
            </div>
            <div className="text-right">
              {batchStatus.data.nextBatchTime && (
                <div className="text-xs text-muted-foreground">
                  {(() => {
                    const nextBatch = new Date(batchStatus.data.nextBatchTime!)
                    const now = new Date()
                    const diff = nextBatch.getTime() - now.getTime()
                    return diff > 0 
                      ? `Next batch in ${formatTimeUntilBatch(diff)}`
                      : 'Ready for batch'
                  })()}
                </div>
              )}
            </div>
          </div>
          {batchStatus.data.pendingCount >= batchStatus.data.batchSize && (
            <div className="mt-2 pt-2 border-t border-blue-500/20">
              <div className="text-xs text-blue-500 font-medium">
                ⚡ Batch ready for attestation ({batchStatus.data.pendingCount}/{batchStatus.data.batchSize})
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="px-2 pb-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search comments..."
            className="pl-9 pr-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm text-muted-foreground">
            {filteredAndSortedComments.length} {filteredAndSortedComments.length === 1 ? 'comment' : 'comments'}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1">
                {getSortIcon()}
                <span className="capitalize">{sortBy}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('recent')}>
                <Clock className="h-4 w-4 mr-2" />
                Most Recent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('popular')}>
                <Star className="h-4 w-4 mr-2" />
                Most Popular
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('trending')}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Trending
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Comments List - Scrollable */}
      <div className="flex-1 overflow-y-auto px-2 space-y-3 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pb-32">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading reviews...</p>
          </div>
        ) : filteredAndSortedComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            {searchQuery ? (
              <>
                <Search className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">No reviews found</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
              </>
            ) : (
              <>
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium">No reviews yet</p>
                <p className="text-sm text-muted-foreground mt-1">Be the first to share your thoughts!</p>
              </>
            )}
          </div>
        ) : (
          filteredAndSortedComments.map((comment, index) => (
            <Card 
              key={comment.id} 
              className="p-3 transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-0 space-y-2">
                {comment.isAISummary ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-xs">AI</span>
                    </div>
                    <span className="font-bold">AI Summary</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{comment.user.name}</span>
                    {/* Review Level Badge */}
                    {comment.reviewLevel && (
                      <Badge 
                        className={`${
                          comment.reviewLevel === 3 ? 'bg-green-600' :
                          comment.reviewLevel === 2 ? 'bg-blue-600' :
                          'bg-gray-600'
                        } text-white text-xs px-2 py-0.5 shadow-sm`}
                        title={`Level ${comment.reviewLevel} Review`}
                      >
                        L{comment.reviewLevel}
                        {comment.onChainVerified && ' ✓'}
                      </Badge>
                    )}
                    {/* User Level Badge */}
                    <Badge className={`${getLevelBadgeColor(comment.user.level)} text-white text-xs px-2 py-0.5 shadow-sm`}>
                      Lv{comment.user.level}
                    </Badge>
                    {comment.user.achievement && (
                      <Badge className="bg-orange-500 text-white text-xs px-2 py-0.5 shadow-sm animate-pulse">
                        🔥 {comment.user.achievement}
                      </Badge>
                    )}
                    {comment.user.score !== undefined && (
                      <Badge className="bg-primary text-white text-xs px-2 py-0.5 shadow-sm">
                        ${comment.user.score} Rep
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* Edit Mode */}
                {editingCommentId === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="text-sm min-h-[80px]"
                      placeholder="Edit your review..."
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleSaveEdit}
                        disabled={isEditing || !editText.trim()}
                      >
                        {isEditing ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleCancelEdit}
                        disabled={isEditing}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground leading-relaxed">{comment.content}</p>
                    
                    {/* Edit/Delete buttons for own reviews */}
                    {isOwnComment(comment) && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleEditComment(comment)}
                          disabled={isEditing || isDeleting}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={isEditing || (isDeleting && deletingCommentId !== comment.id)}
                        >
                          {isDeleting && deletingCommentId === comment.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500"></div>
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
                
                {/* Blockchain Verification Links for L3 Reviews */}
                {comment.reviewLevel === 3 && comment.onChainVerified && (
                  <div className="mt-2 pt-2 border-t border-green-500/20 flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 text-xs text-green-500">
                      <Shield className="h-3 w-3" />
                      <span>On-chain verified</span>
                    </div>
                    {comment.hederaTopicId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-green-500 hover:text-green-600"
                        onClick={() => {
                          window.open(`https://hashscan.io/testnet/topic/${comment.hederaTopicId}`, '_blank')
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View on Hashscan
                      </Button>
                    )}
                    {comment.transactionHash && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-green-500 hover:text-green-600"
                        onClick={() => {
                          // Format: 0.0.7003610@1760987140.498673649 -> extract transaction ID
                          if (comment.transactionHash) {
                            const txId = comment.transactionHash.split('@')[0]
                            window.open(`https://hashscan.io/testnet/transaction/${txId}`, '_blank')
                          }
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Transaction
                      </Button>
                    )}
                    {comment.hcsSequence && (
                      <span className="text-xs text-muted-foreground">
                        Sequence: {comment.hcsSequence}
                      </span>
                    )}
                  </div>
                )}
                
                {!comment.isAISummary && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(comment.id, 'up')}
                        className="h-7 px-2 transition-all hover:scale-110"
                      >
                        <ThumbsUp 
                          className={`h-3.5 w-3.5 transition-all ${comment.isLiked ? 'fill-green-500 text-green-500 scale-110' : 'hover:text-green-500'}`} 
                        />
                        <span className="ml-1 text-xs">{comment.likes}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(comment.id, 'down')}
                        className="h-7 px-2 transition-all hover:scale-110"
                      >
                        <ThumbsDown 
                          className={`h-3.5 w-3.5 transition-all ${comment.isDisliked ? 'fill-red-500 text-red-500 scale-110' : 'hover:text-red-500'}`} 
                        />
                        <span className="ml-1 text-xs">{comment.dislikes}</span>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Comment Input - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-card/95 backdrop-blur-sm shadow-lg space-y-3 z-20 max-w-md mx-auto">
        <div className="space-y-3">
          {/* Review Level Selection */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Review Level:</span>
            <div className="flex gap-1.5">
            {[1, 2, 3].map((level) => {
              const isVerified = level === 1 ? true : 
                                 level === 2 ? userProfile.verifiedL2 : 
                                 userProfile.verifiedL3
              const verificationMessage = level === 1 
                ? 'L1 reviews are available to all users'
                : level === 2
                ? 'L2 requires Self Protocol verification (passport)'
                : 'L3 requires social media verification'
              
              return (
                <Tooltip key={level}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={selectedLevel === level ? 'default' : isVerified ? 'outline' : 'outline'}
                      size="sm"
                      className={`h-6 px-2 text-xs ${
                        !isVerified ? 'opacity-60 cursor-not-allowed' : ''
                      } ${
                        selectedLevel === level ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => {
                        if (isVerified) {
                          setSelectedLevel(level as ReviewLevel)
                        } else {
                          toast.info(`L${level} verification required`, {
                            description: level === 2 
                              ? 'Complete Self Protocol verification in settings to post L2 reviews'
                              : 'Verify your social media account in settings to post L3 reviews',
                            action: {
                              label: 'Go to Settings',
                              onClick: () => onNavigate?.('settings'),
                            },
                          })
                        }
                      }}
                      disabled={!isVerified}
                    >
                      L{level}
                      {isVerified ? (
                        <span className="ml-1 text-[10px]">✓</span>
                      ) : (
                        <span className="ml-1 text-[10px]">🔒</span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {isVerified 
                        ? `Post L${level} review (Verified)` 
                        : verificationMessage}
                    </p>
                    {!isVerified && (
                      <p className="text-xs mt-1 text-muted-foreground">
                        Go to Settings to verify
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              )
            })}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 transition-all hover:scale-110"
            onClick={() => toast.info('Attachment feature coming soon!')}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input 
            placeholder="Leave a review..."
            className="flex-1"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
          />
          <Button 
            size="icon" 
            className="h-8 w-8 bg-primary text-primary-foreground transition-all hover:scale-110 disabled:opacity-50"
            onClick={handleSendComment}
            disabled={isSending || !commentText.trim()}
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
