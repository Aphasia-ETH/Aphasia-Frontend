import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  ThumbsUp, ThumbsDown, Paperclip, Send, Settings, Sparkles, Search, 
  TrendingUp, Clock, Star, X, ChevronDown, MessageCircle
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { reviewsApi, ReviewLevel, ApiClientError, healthApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  const [productId] = useState('default-product') // In real app, get from context/URL

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
            level: review.user?.level || review.level || 1,
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
      const response = await reviewsApi.createReview({
        productId,
        content: commentText.trim(),
        level: selectedLevel,
      })
      
      // Handle different response formats
      let reviewData: any
      if (response.review) {
        reviewData = response.review
      } else if (response.data?.review) {
        reviewData = response.data.review
      } else if (response.data) {
        reviewData = response.data
      } else {
        reviewData = response
      }
      
      // Convert API response to Comment format
      const newComment: Comment = {
        id: reviewData.reviewId || reviewData.id,
        user: {
          id: userProfile.id,
          name: userProfile.name,
          avatar: userProfile.name.charAt(0).toUpperCase(),
          level: userProfile.level,
          score: userProfile.score,
        },
        content: reviewData.text || reviewData.content || commentText,
        timestamp: 'Just now',
        likes: 0,
        dislikes: 0,
        isLiked: false,
        isDisliked: false,
      }

      setComments(prev => [newComment, ...prev])
      setCommentText('')
      
      toast.success('Review posted!', {
        description: `L${selectedLevel} review has been created${reviewData.batchId ? ' and queued for batch processing' : ''}.`,
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
                    <Badge className={`${getLevelBadgeColor(comment.user.level)} text-white text-xs px-2 py-0.5 shadow-sm`}>
                      Lv{comment.user.level} ✓
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
                
                <p className="text-sm text-muted-foreground leading-relaxed">{comment.content}</p>
                
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
              return (
                <Button
                  key={level}
                  variant={selectedLevel === level ? 'default' : 'outline'}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    if (isVerified) {
                      setSelectedLevel(level as ReviewLevel)
                    } else {
                      toast.info(`L${level} verification required`, {
                        description: level === 2 
                          ? 'Complete Self Protocol verification in settings'
                          : 'Verify your social media account in settings',
                      })
                    }
                  }}
                  disabled={!isVerified}
                  title={!isVerified ? `L${level} verification required` : `Post L${level} review`}
                >
                  L{level}
                  {!isVerified && <span className="ml-1 text-[10px]">🔒</span>}
                </Button>
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
