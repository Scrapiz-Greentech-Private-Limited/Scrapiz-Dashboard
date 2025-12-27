'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { 
  Star, 
  RefreshCw, 
  AlertCircle, 
  MessageSquare,
  TrendingUp,
  Users,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RatingService } from "@/services/rating"
import type { OrderRating, RatingStats, RatingTag } from "@/types/rating"
import { RATING_TAG_LABELS } from "@/types/rating"
import { showError } from "@/lib/toast-helpers"
import { format } from "date-fns"


// Star rating display component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-medium text-muted-foreground">
        {rating}/5
      </span>
    </div>
  )
}

// Tag badge component
function TagBadge({ tag }: { tag: RatingTag }) {
  const isNegative = tag === 'NEEDS_IMPROVEMENT'
  return (
    <Badge 
      variant={isNegative ? "destructive" : "secondary"}
      className={`text-xs ${!isNegative ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}`}
    >
      {RATING_TAG_LABELS[tag] || tag}
    </Badge>
  )
}

export default function AgentReviewsPage() {
  // State for ratings data
  const [ratings, setRatings] = useState<OrderRating[]>([])
  const [stats, setStats] = useState<RatingStats | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  
  // Filter state
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  
  // Loading and error states
  const [isLoadingRatings, setIsLoadingRatings] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [ratingsError, setRatingsError] = useState<string | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  
  // Refs to prevent duplicate calls
  const hasFetchedInitially = useRef(false)
  const isFetchingRatings = useRef(false)
  const isFetchingStats = useRef(false)

  // Fetch all ratings from API
  const fetchRatings = useCallback(async () => {
    if (isFetchingRatings.current) return
    
    isFetchingRatings.current = true
    setIsLoadingRatings(true)
    setRatingsError(null)
    try {
      const params: any = {}
      if (ratingFilter !== 'all') {
        if (ratingFilter === 'positive') {
          params.min_rating = 4
        } else if (ratingFilter === 'negative') {
          params.max_rating = 2
        } else {
          params.min_rating = parseInt(ratingFilter)
          params.max_rating = parseInt(ratingFilter)
        }
      }
      const response = await RatingService.getAllRatings(params)
      setRatings(response.ratings)
      setTotalCount(response.count)
    } catch (error: any) {
      setRatingsError(error.message || 'Failed to load ratings')
      showError(error.message || 'Failed to load ratings')
    } finally {
      setIsLoadingRatings(false)
      isFetchingRatings.current = false
    }
  }, [ratingFilter])

  // Fetch stats from API
  const fetchStats = useCallback(async () => {
    if (isFetchingStats.current) return
    
    isFetchingStats.current = true
    setIsLoadingStats(true)
    setStatsError(null)
    try {
      const statsData = await RatingService.getStats()
      setStats(statsData)
    } catch (error: any) {
      setStatsError(error.message || 'Failed to load statistics')
    } finally {
      setIsLoadingStats(false)
      isFetchingStats.current = false
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    if (hasFetchedInitially.current) return
    hasFetchedInitially.current = true
    
    fetchRatings()
    fetchStats()
  }, [fetchRatings, fetchStats])

  // Refetch when filter changes
  useEffect(() => {
    if (hasFetchedInitially.current) {
      fetchRatings()
    }
  }, [ratingFilter, fetchRatings])

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchRatings()
    fetchStats()
  }, [fetchRatings, fetchStats])

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
    } catch {
      return dateString
    }
  }


  // Render statistics skeleton
  const renderStatsSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Render statistics cards
  const renderStatsCards = () => {
    if (isLoadingStats) return renderStatsSkeleton()
    
    if (statsError || !stats) {
      return (
        <Card className="p-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load statistics</span>
            <Button variant="ghost" size="sm" onClick={fetchStats}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </Card>
      )
    }

    const positiveRatings = (stats.rating_distribution[4] || 0) + (stats.rating_distribution[5] || 0)
    const negativeRatings = (stats.rating_distribution[1] || 0) + (stats.rating_distribution[2] || 0)

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card 
          className="transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total_ratings}</div>
            <p className="text-xs text-purple-100">All time feedback</p>
          </CardContent>
        </Card>

        <Card 
          className="transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-white fill-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white flex items-center gap-1">
              {stats.average_rating.toFixed(1)}
              <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
            </div>
            <p className="text-xs text-pink-100">Overall satisfaction</p>
          </CardContent>
        </Card>

        <Card 
          className="transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Positive Reviews</CardTitle>
            <ThumbsUp className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{positiveRatings}</div>
            <p className="text-xs text-green-100">4-5 star ratings</p>
          </CardContent>
        </Card>

        <Card 
          className="transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Needs Attention</CardTitle>
            <ThumbsDown className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{negativeRatings}</div>
            <p className="text-xs text-orange-100">1-2 star ratings</p>
          </CardContent>
        </Card>

        <Card 
          className="transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Recent (7 days)</CardTitle>
            <Clock className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.recent_ratings_7d}</div>
            <p className="text-xs text-cyan-100">New reviews this week</p>
          </CardContent>
        </Card>
      </div>
    )
  }


  // Render table skeleton
  const renderTableSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-1">
            {[...Array(5)].map((_, j) => (
              <Skeleton key={j} className="h-4 w-4" />
            ))}
          </div>
          <Skeleton className="h-4 w-40 flex-1" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  )

  // Render ratings error state
  const renderRatingsError = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <AlertCircle className="h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground">{ratingsError}</p>
      <Button variant="outline" onClick={fetchRatings}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  )

  // Render empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <MessageSquare className="h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground">No reviews found</p>
      <p className="text-sm text-muted-foreground">
        Reviews will appear here once customers start rating their orders.
      </p>
    </div>
  )

  // Render ratings table
  const renderRatingsTable = () => {
    if (ratings.length === 0) return renderEmptyState()

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Order</TableHead>
              <TableHead className="font-semibold">Customer</TableHead>
              <TableHead className="font-semibold">Agent</TableHead>
              <TableHead className="font-semibold">Rating</TableHead>
              <TableHead className="font-semibold">Tags</TableHead>
              <TableHead className="font-semibold">Feedback</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ratings.map((rating) => (
              <TableRow key={rating.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="font-medium text-primary">
                    #{rating.order_number}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{rating.user_name}</span>
                    <span className="text-xs text-muted-foreground">{rating.user_email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{rating.agent_name}</span>
                    {rating.agent_code && (
                      <span className="text-xs text-muted-foreground">{rating.agent_code}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <StarRating rating={rating.rating} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {rating.tags && rating.tags.length > 0 ? (
                      rating.tags.map((tag, idx) => (
                        <TagBadge key={idx} tag={tag} />
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No tags</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[250px]">
                    {rating.feedback ? (
                      <p className="text-sm text-muted-foreground line-clamp-2" title={rating.feedback}>
                        "{rating.feedback}"
                      </p>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No feedback</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(rating.created_at)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agent Reviews</h2>
          <p className="text-muted-foreground">View and analyze customer feedback for pickup agents</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          disabled={isLoadingRatings || isLoadingStats}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${(isLoadingRatings || isLoadingStats) ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {renderStatsCards()}

      {/* Rating Distribution */}
      {stats && !isLoadingStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rating Distribution</CardTitle>
            <CardDescription>Breakdown of ratings by star count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.rating_distribution[star] || 0
                const percentage = stats.total_ratings > 0 
                  ? Math.round((count / stats.total_ratings) * 100) 
                  : 0
                return (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-medium">{star}</span>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          star >= 4 ? 'bg-green-500' : star === 3 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-20 text-right">
                      <span className="text-sm font-medium">{count}</span>
                      <span className="text-xs text-muted-foreground ml-1">({percentage}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Reviews</CardTitle>
              <CardDescription>
                {isLoadingRatings ? 'Loading reviews...' : `Showing ${totalCount} customer reviews`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="positive">Positive (4-5 ⭐)</SelectItem>
                  <SelectItem value="negative">Negative (1-2 ⭐)</SelectItem>
                  <SelectItem value="5">5 Stars Only</SelectItem>
                  <SelectItem value="4">4 Stars Only</SelectItem>
                  <SelectItem value="3">3 Stars Only</SelectItem>
                  <SelectItem value="2">2 Stars Only</SelectItem>
                  <SelectItem value="1">1 Star Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingRatings ? (
            renderTableSkeleton()
          ) : ratingsError ? (
            renderRatingsError()
          ) : (
            renderRatingsTable()
          )}
        </CardContent>
      </Card>

      {/* Tag Frequency */}
      {stats && !isLoadingStats && Object.keys(stats.tag_frequency).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Popular Feedback Tags</CardTitle>
            <CardDescription>Most frequently selected feedback tags by customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.tag_frequency)
                .sort(([, a], [, b]) => b - a)
                .map(([tag, count]) => (
                  <div 
                    key={tag} 
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      tag === 'NEEDS_IMPROVEMENT' 
                        ? 'bg-red-50 border border-red-200' 
                        : 'bg-green-50 border border-green-200'
                    }`}
                  >
                    <span className={`text-sm font-medium ${
                      tag === 'NEEDS_IMPROVEMENT' ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {RATING_TAG_LABELS[tag as RatingTag] || tag}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {count}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
