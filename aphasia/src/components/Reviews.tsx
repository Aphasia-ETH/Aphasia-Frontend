import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ModeToggle } from '@/components/mode-toggle'
import { Heart, Paperclip, Send, Filter, Settings } from 'lucide-react'

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
  isLiked: boolean
  isAISummary?: boolean
}

const mockComments: Comment[] = [
  {
    id: 'ai-summary',
    user: {
      id: 'ai',
      name: 'AI Summary',
      avatar: 'ai',
      level: 0
    },
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam finibus blandit euismod.',
    timestamp: '',
    likes: 0,
    isLiked: false,
    isAISummary: true
  },
  {
    id: '1',
    user: {
      id: 'small-monkey',
      name: 'Small Monkey',
      avatar: 'SM',
      level: 3,
      score: 10,
      achievement: 'Perfect Score'
    },
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam finibus blandit euismod.',
    timestamp: '2 days ago',
    likes: 11,
    isLiked: false
  },
  {
    id: '2',
    user: {
      id: 'john-s',
      name: 'John S',
      avatar: 'JS',
      level: 3,
      score: 8
    },
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam finibus blandit euismod.',
    timestamp: '2 days ago',
    likes: 11,
    isLiked: true
  },
  {
    id: '3',
    user: {
      id: 'big-monkey',
      name: 'Big Monkey',
      avatar: 'BM',
      level: 2,
      score: 5.5
    },
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam finibus blandit euismod.',
    timestamp: '2 days ago',
    likes: 11,
    isLiked: false
  },
  {
    id: '4',
    user: {
      id: 'cheese',
      name: 'Cheese',
      avatar: 'C',
      level: 1,
      score: 4
    },
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam finibus blandit euismod.',
    timestamp: '2 days ago',
    likes: 0,
    isLiked: false
  }
]

interface ReviewsProps {
  onNavigate?: (route: 'login' | 'signup') => void
}

export function Reviews({ onNavigate }: ReviewsProps) {
  const handleLike = (commentId: string) => {
    console.log('Like comment:', commentId)
    // TODO: Implement like functionality
  }

  const handleSendComment = () => {
    console.log('Send comment')
    // TODO: Implement comment sending
  }

  const getLevelBadgeColor = (level: number) => {
    switch (level) {
      case 3: return 'bg-green-500'
      case 2: return 'bg-yellow-500'
      case 1: return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getScoreBadgeColor = (score?: number) => {
    if (!score) return 'bg-gray-500'
    if (score >= 8) return 'bg-orange-500'
    return 'bg-gray-500'
  }

  return (
    <div className="w-full max-w-md mx-auto h-screen flex flex-col">

      {/* User Profile Section */}
      <div className="bg-card border rounded-lg m-2 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-bold">Lv1</span>
            </div>
            <div>
              <div className="font-medium">John</div>
              <div className="text-sm text-muted-foreground">Score: 1/10</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Comments Overview */}
      <div className="flex items-center justify-between p-3">
        <span className="font-medium">Total comments: 4</span>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Comments List - Scrollable */}
      <div className="flex-1 overflow-y-auto px-2 space-y-2">
        {mockComments.map((comment) => (
          <Card key={comment.id} className="p-3">
            <CardContent className="p-0 space-y-2">
              {comment.isAISummary ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">AI</span>
                  </div>
                  <span className="font-bold">AI Summary</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">{comment.user.name}</span>
                  <Badge className={`${getLevelBadgeColor(comment.user.level)} text-white text-xs px-2 py-0.5`}>
                    Lv{comment.user.level} ✓
                  </Badge>
                  {comment.user.achievement && (
                    <Badge className="bg-orange-500 text-white text-xs px-2 py-0.5">
                      🔥 {comment.user.achievement}
                    </Badge>
                  )}
                  {comment.user.score && (
                    <Badge className={`${getScoreBadgeColor(comment.user.score)} text-white text-xs px-2 py-0.5`}>
                      Sc. {comment.user.score}/10
                    </Badge>
                  )}
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">{comment.content}</p>
              
              {!comment.isAISummary && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(comment.id)}
                    className="h-6 px-2"
                  >
                    <Heart 
                      className={`h-3 w-3 ${comment.isLiked ? 'fill-red-500 text-red-500' : ''}`} 
                    />
                    <span className="ml-1 text-xs">{comment.likes}</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comment Input */}
      <div className="p-3 border-t bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input 
            placeholder="Leave a comment"
            className="flex-1"
          />
          <Button 
            size="icon" 
            className="h-8 w-8 bg-primary text-primary-foreground"
            onClick={handleSendComment}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
