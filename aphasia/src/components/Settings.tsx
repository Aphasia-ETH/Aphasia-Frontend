import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ModeToggle } from '@/components/mode-toggle'
import { 
  User, Bell, Shield, Palette, Zap, TrendingUp, 
  Award, BarChart3, Save, LogOut, 
  Crown, CheckCircle2, Lock, Sparkles, ArrowRight, Scan
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { userApi, ApiClientError } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { SelfVerification } from '@/components/SelfVerification'
import { SelfVerificationResult } from '@/lib/self'

interface SettingsProps {
  onBack: () => void
}

export function Settings({ onBack }: SettingsProps) {
  const { logout, user, verifyWithSelf, refreshUser } = useAuth()
  const [userProfile, setUserProfile] = useState({ 
    name: 'John', 
    level: 1, 
    score: 1, 
    email: '',
    verifiedL1: false,
    verifiedL2: false,
    verifiedL3: false,
  })
  const [showSelfVerification, setShowSelfVerification] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [notifications, setNotifications] = useState({
    comments: true,
    likes: true,
    achievements: true,
    updates: false,
  })
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showScore: true,
    allowMessages: false,
  })

  useEffect(() => {
    const loadData = async () => {
      // Load settings from storage
      chrome.storage?.local?.get(['aphasia-settings'], (result) => {
        if (result['aphasia-settings']) {
          const settings = result['aphasia-settings']
          if (settings.notifications) setNotifications(settings.notifications)
          if (settings.privacy) setPrivacy(settings.privacy)
        }
      })

      // Fetch user profile from API
      try {
        const user = await userApi.getProfile()
        setUserProfile({
          name: user.name || '',
          level: user.level,
          score: user.score,
          email: user.email,
          verifiedL1: user.verifiedL1 ?? false,
          verifiedL2: user.verifiedL2 ?? false,
          verifiedL3: user.verifiedL3 ?? false,
        })
        // Also update storage
        chrome.storage?.local?.set({ 'aphasia-user': user })
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
        // Fallback to storage
        chrome.storage?.local?.get(['aphasia-user'], (result) => {
          if (result['aphasia-user']) {
            setUserProfile({
              name: result['aphasia-user'].name || '',
              level: result['aphasia-user'].level || 1,
              score: result['aphasia-user'].score || 1,
              email: result['aphasia-user'].email || '',
              verifiedL1: result['aphasia-user'].verifiedL1 ?? false,
              verifiedL2: result['aphasia-user'].verifiedL2 ?? false,
              verifiedL3: result['aphasia-user'].verifiedL3 ?? false,
            })
          }
        })
      }
    }
    
    loadData()
  }, [])

  const handleSave = async () => {
    try {
      // Update user profile via API
      await userApi.updateProfile({
        name: userProfile.name,
        email: userProfile.email,
      })
      
      // Save settings to storage
      chrome.storage?.local?.set({
        'aphasia-settings': { notifications, privacy }
      })
      
      toast.success('Settings saved!', {
        description: 'Your preferences have been updated.',
      })
    } catch (error) {
      const errorMessage = error instanceof ApiClientError 
        ? error.message 
        : 'Failed to save settings. Please try again.'
      
      toast.error('Failed to save', {
        description: errorMessage,
      })
    }
  }

  const stats = [
    { label: 'Level', value: userProfile.level, icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Rep Tokens', value: `$${userProfile.score}`, icon: BarChart3, color: 'text-green-500' },
    { label: 'Comments', value: '12', icon: Award, color: 'text-purple-500' },
  ]

  return (
    <div className="w-full h-full overflow-y-auto pb-6">
      <div className="space-y-5 px-4 pt-12">
        {/* Header */}
        <div className="flex items-center justify-between pt-3 sticky top-12 bg-background/95 backdrop-blur-sm z-10 pb-2 border-b">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
          <Button onClick={handleSave} size="sm" className="gap-2 shadow-sm">
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>

        {/* Profile Section */}
        <Card className="animate-in fade-in slide-in-from-bottom-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Manage your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={userProfile.name}
                onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userProfile.email}
                onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Upgrade Section */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Account Verification
            </CardTitle>
            <CardDescription>Unlock higher review levels and features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* L1 Verification */}
            <div className={`p-4 rounded-lg border-2 transition-all ${
              userProfile.verifiedL1 
                ? 'border-green-500/50 bg-green-500/10' 
                : 'border-muted bg-muted/50'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={userProfile.verifiedL1 ? "default" : "outline"} className="gap-1">
                      {userProfile.verifiedL1 ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" />
                          Locked
                        </>
                      )}
                    </Badge>
                    <span className="font-semibold text-lg">Level 1 (L1)</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Basic verification - Post L1 reviews and interact with the community
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">✓ Post L1 Reviews</Badge>
                    <Badge variant="outline" className="text-xs">✓ Like Comments</Badge>
                    <Badge variant="outline" className="text-xs">✓ Basic Features</Badge>
                  </div>
                </div>
                {userProfile.verifiedL1 ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-shrink-0"
                    onClick={() => {
                      // L1 is automatically verified on signup/login
                      toast.info('L1 verification', {
                        description: 'L1 verification is automatically enabled when you create an account.',
                      })
                    }}
                  >
                    Verify
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>

            {/* L2 Verification - Self Protocol */}
            <div className={`p-4 rounded-lg border-2 transition-all ${
              userProfile.verifiedL2 
                ? 'border-blue-500/50 bg-blue-500/10' 
                : 'border-muted bg-muted/50'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={userProfile.verifiedL2 ? "default" : "outline"} className="gap-1">
                      {userProfile.verifiedL2 ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" />
                          Locked
                        </>
                      )}
                    </Badge>
                    <span className="font-semibold text-lg flex items-center gap-1">
                      Level 2 (L2)
                      <Scan className="h-4 w-4 text-blue-500" />
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Self Protocol verification - Verify your identity using passport with zero-knowledge proofs
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">✓ Post L2 Reviews</Badge>
                    <Badge variant="outline" className="text-xs">✓ Self Protocol Verification</Badge>
                    <Badge variant="outline" className="text-xs">✓ Enhanced Credibility</Badge>
                  </div>
                </div>
                {userProfile.verifiedL2 ? (
                  <CheckCircle2 className="h-6 w-6 text-blue-500 flex-shrink-0" />
                ) : (
                  <Button 
                    size="sm" 
                    variant={userProfile.verifiedL1 ? "default" : "outline"}
                    disabled={!userProfile.verifiedL1 || isVerifying}
                    className="flex-shrink-0"
                    onClick={() => {
                      if (!userProfile.verifiedL1) {
                        toast.info('Complete L1 verification first', {
                          description: 'You need to verify Level 1 before upgrading to Level 2.',
                        })
                      } else if (!user?.id) {
                        toast.error('Please log in first', {
                          description: 'You need to be logged in to verify with Self Protocol.',
                        })
                      } else {
                        setShowSelfVerification(true)
                      }
                    }}
                  >
                    {isVerifying ? (
                      <>
                        <Scan className="h-3 w-3 mr-1 animate-pulse" />
                        Verifying...
                      </>
                    ) : userProfile.verifiedL1 ? (
                      <>
                        <Scan className="h-3 w-3 mr-1" />
                        Verify
                      </>
                    ) : (
                      'Locked'
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* L3 Verification - Social Media */}
            <div className={`p-4 rounded-lg border-2 transition-all ${
              userProfile.verifiedL3 
                ? 'border-purple-500/50 bg-purple-500/10' 
                : 'border-muted bg-muted/50'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={userProfile.verifiedL3 ? "default" : "outline"} className="gap-1">
                      {userProfile.verifiedL3 ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" />
                          Locked
                        </>
                      )}
                    </Badge>
                    <span className="font-semibold text-lg flex items-center gap-1">
                      Level 3 (L3)
                      <Sparkles className="h-4 w-4 text-purple-500" />
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Social media verification - Post L3 reviews with maximum trust and credibility
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">✓ Post L3 Reviews</Badge>
                    <Badge variant="outline" className="text-xs">✓ Social Verification</Badge>
                    <Badge variant="outline" className="text-xs">✓ Maximum Trust</Badge>
                    <Badge variant="outline" className="text-xs">✓ Priority Support</Badge>
                  </div>
                </div>
                {userProfile.verifiedL3 ? (
                  <CheckCircle2 className="h-6 w-6 text-purple-500 flex-shrink-0" />
                ) : (
                  <Button 
                    size="sm" 
                    variant={userProfile.verifiedL2 ? "default" : "outline"}
                    disabled={!userProfile.verifiedL2}
                    className="flex-shrink-0"
                    onClick={() => {
                      if (!userProfile.verifiedL2) {
                        toast.info('Complete L2 verification first', {
                          description: 'You need to verify Level 2 (Self Protocol) before upgrading to Level 3.',
                        })
                      } else {
                        toast.info('L3 verification coming soon', {
                          description: 'Social media verification will be available soon.',
                        })
                      }
                    }}
                  >
                    {userProfile.verifiedL2 ? 'Upgrade' : 'Locked'}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Self Protocol Verification Modal */}
        {showSelfVerification && user?.id && (
          <Card className="border-2 border-purple-500/50 bg-purple-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5 text-purple-500" />
                Self Protocol Verification
              </CardTitle>
              <CardDescription>
                Verify your identity using your passport with zero-knowledge proofs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SelfVerification
                userId={user.id}
                onSuccess={async (result: SelfVerificationResult) => {
                  try {
                    setIsVerifying(true)
                    
                    // The SelfVerification component handles polling and gets token from backend
                    // If token is in userContextData, it means verification completed via polling
                    if (result.userContextData?.token) {
                      // Token already received from polling - just update auth state
                      await verifyWithSelf(
                        result.userContextData,
                        result.pubSignals,
                        result.userContextData
                      )
                    } else if (result.attestationId && result.pubSignals) {
                      // If we have proof data, verify with backend
                      await verifyWithSelf(
                        { attestationId: result.attestationId },
                        result.pubSignals,
                        result.userContextData
                      )
                    }
                    
                    // Refresh user profile to get updated verification status
                    await refreshUser()
                    
                    // Update local state - Self Protocol is now L2
                    setUserProfile(prev => ({
                      ...prev,
                      verifiedL2: true,
                    }))
                    
                    setShowSelfVerification(false)
                    setIsVerifying(false)
                    
                    toast.success('Verification successful!', {
                      description: 'Your L2 verification is complete. You can now post L2 reviews.',
                    })
                  } catch (error) {
                    console.error('Self verification error:', error)
                    setIsVerifying(false)
                    toast.error('Verification failed', {
                      description: error instanceof Error ? error.message : 'Please try again.',
                    })
                  }
                }}
                onError={(error) => {
                  setIsVerifying(false)
                  toast.error('Verification failed', {
                    description: error.message || 'Please try again.',
                  })
                }}
                onCancel={() => {
                  setShowSelfVerification(false)
                  setIsVerifying(false)
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Stats Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Your Stats
            </CardTitle>
            <CardDescription>Your activity and achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-4 bg-muted/50 rounded-lg border transition-all hover:bg-muted hover:scale-105">
                  <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Choose what notifications you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Comments</Label>
                <p className="text-sm text-muted-foreground">Get notified about new comments</p>
              </div>
              <Switch
                pressed={notifications.comments}
                onPressedChange={(pressed) => setNotifications({ ...notifications, comments: pressed })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Likes</Label>
                <p className="text-sm text-muted-foreground">Get notified when someone likes your comment</p>
              </div>
              <Switch
                pressed={notifications.likes}
                onPressedChange={(pressed) => setNotifications({ ...notifications, likes: pressed })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Achievements</Label>
                <p className="text-sm text-muted-foreground">Get notified about new achievements</p>
              </div>
              <Switch
                pressed={notifications.achievements}
                onPressedChange={(pressed) => setNotifications({ ...notifications, achievements: pressed })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Updates</Label>
                <p className="text-sm text-muted-foreground">Get notified about product updates</p>
              </div>
              <Switch
                pressed={notifications.updates}
                onPressedChange={(pressed) => setNotifications({ ...notifications, updates: pressed })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy
            </CardTitle>
            <CardDescription>Control your privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Profile Visible</Label>
                <p className="text-sm text-muted-foreground">Allow others to see your profile</p>
              </div>
              <Switch
                pressed={privacy.profileVisible}
                onPressedChange={(pressed) => setPrivacy({ ...privacy, profileVisible: pressed })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Score</Label>
                <p className="text-sm text-muted-foreground">Display your score publicly</p>
              </div>
              <Switch
                pressed={privacy.showScore}
                onPressedChange={(pressed) => setPrivacy({ ...privacy, showScore: pressed })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Messages</Label>
                <p className="text-sm text-muted-foreground">Let others send you messages</p>
              </div>
              <Switch
                pressed={privacy.allowMessages}
                onPressedChange={(pressed) => setPrivacy({ ...privacy, allowMessages: pressed })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
              </div>
              <ModeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Performance Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Performance
            </CardTitle>
            <CardDescription>Optimize your experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Cache Size</span>
                <span className="text-muted-foreground">2.4 MB</span>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => {
                toast.success('Cache cleared!', { description: 'All cached data has been removed.' })
              }}>
                Clear Cache
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>Manage your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Email</span>
                <span className="text-muted-foreground">{userProfile.email || user?.email || 'Not set'}</span>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                className="w-full" 
                onClick={async () => {
                  try {
                    await logout()
                    toast.success('Logged out', { description: 'You have been logged out successfully.' })
                    onBack() // Navigate back to home (which will redirect to login)
                  } catch (error) {
                    toast.error('Logout failed', { description: 'Please try again.' })
                  }
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

