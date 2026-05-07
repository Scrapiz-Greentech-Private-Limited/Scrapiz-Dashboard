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
  Filter,
  Building2
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
import type { OrderRating, RatingStats, RatingTag, VendorReviewDirection, VendorReviewRecord, VendorReviewStats } from "@/types/rating"
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
  const [vendorReviews, setVendorReviews] = useState<VendorReviewRecord[]>([])
  const [vendorStats, setVendorStats] = useState<VendorReviewStats | null>(null)
  const [vendorTotalCount, setVendorTotalCount] = useState(0)
  
  // Filter state
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [vendorDirectionFilter, setVendorDirectionFilter] = useState<'all' | VendorReviewDirection>('all')
  
  // Loading and error states
  const [isLoadingRatings, setIsLoadingRatings] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isLoadingVendorReviews, setIsLoadingVendorReviews] = useState(true)
  const [ratingsError, setRatingsError] = useState<string | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [vendorReviewsError, setVendorReviewsError] = useState<string | null>(null)
  
  // Refs to prevent duplicate calls
  const hasFetchedInitially = useRef(false)
  const isFetchingRatings = useRef(false)
  const isFetchingStats = useRef(false)
  const isFetchingVendorReviews = useRef(false)

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

  const fetchVendorReviews = useCallback(async () => {
    if (isFetchingVendorReviews.current) return

    isFetchingVendorReviews.current = true
    setIsLoadingVendorReviews(true)
    setVendorReviewsError(null)
    try {
      const response = await RatingService.getVendorReviews({
        direction: vendorDirectionFilter,
      })
      setVendorReviews(response.reviews)
      setVendorStats(response.stats)
      setVendorTotalCount(response.count)
    } catch (error: any) {
      setVendorReviewsError(error.message || 'Failed to load vendor reviews')
    } finally {
      setIsLoadingVendorReviews(false)
      isFetchingVendorReviews.current = false
    }
  }, [vendorDirectionFilter])

  // Initial data fetch
  useEffect(() => {
    if (hasFetchedInitially.current) return
    hasFetchedInitially.current = true
    
    fetchRatings()
    fetchStats()
    fetchVendorReviews()
  }, [fetchRatings, fetchStats, fetchVendorReviews])

  // Refetch when filter changes
  useEffect(() => {
    if (hasFetchedInitially.current) {
      fetchRatings()
    }
  }, [ratingFilter, fetchRatings])

  useEffect(() => {
    if (hasFetchedInitially.current) {
      fetchVendorReviews()
    }
  }, [vendorDirectionFilter, fetchVendorReviews])

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchRatings()
    fetchStats()
    fetchVendorReviews()
  }, [fetchRatings, fetchStats, fetchVendorReviews])

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
    } catch {
      return dateString
    }
  }

  const renderVendorReviewsError = () => (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 gap-3 sm:gap-4">
      <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
      <p className="text-muted-foreground text-sm sm:text-base text-center">{vendorReviewsError}</p>
      <Button variant="outline" size="sm" onClick={fetchVendorReviews}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  )

  const renderVendorEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 gap-3 sm:gap-4">
      <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
      <p className="text-muted-foreground text-sm sm:text-base">No vendor reviews found</p>
      <p className="text-xs sm:text-sm text-muted-foreground text-center px-4">
        Vendor to customer and customer to vendor review records will appear here as the new flow is used.
      </p>
    </div>
  )

  const renderVendorReviewsTable = () => {
    if (vendorReviews.length === 0) return renderVendorEmptyState()

    return (
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[760px] sm:min-w-0">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-xs sm:text-sm">Direction</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm">Order</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm">Vendor</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm">Customer</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm">Rating</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm">Summary</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm hidden xl:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendorReviews.map((review) => (
              <TableRow key={review.id} className="hover:bg-muted/30">
                <TableCell className="p-2 sm:p-4">
                  <Badge variant={review.direction === 'customer_to_vendor' ? 'secondary' : 'outline'}>
                    {review.direction === 'customer_to_vendor' ? 'Customer -> Vendor' : 'Vendor -> Customer'}
                  </Badge>
                </TableCell>
                <TableCell className="p-2 sm:p-4">
                  <div className="font-medium text-primary text-xs sm:text-sm">#{review.order_number}</div>
                </TableCell>
                <TableCell className="p-2 sm:p-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{review.vendor_name || 'Vendor'}</span>
                    <span className="text-xs text-muted-foreground">Reviewer: {review.reviewer_name}</span>
                  </div>
                </TableCell>
                <TableCell className="p-2 sm:p-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{review.customer_name}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[180px]">{review.customer_email}</span>
                  </div>
                </TableCell>
                <TableCell className="p-2 sm:p-4">
                  <StarRating rating={review.overall_rating} />
                </TableCell>
                <TableCell className="p-2 sm:p-4">
                  <div className="max-w-[220px]">
                    <p className="text-xs sm:text-sm font-medium">
                      {review.summary_title || 'No summary provided'}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {review.review_text || 'No written review.'}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden xl:table-cell p-2 sm:p-4">
                  <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(review.created_at)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }


  // Render statistics skeleton
  const renderStatsSkeleton = () => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 sm:gap-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className={`transition-all ${i === 4 ? 'col-span-2 sm:col-span-1' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <Skeleton className="h-3 sm:h-4 w-16 sm:w-24" />
            <Skeleton className="h-3 sm:h-4 w-3 sm:w-4" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mb-1" />
            <Skeleton className="h-2 sm:h-3 w-16 sm:w-20 hidden sm:block" />
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
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-muted-foreground text-sm">
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 sm:gap-4">
        <Card 
          className="transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">Total Reviews</CardTitle>
            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-white">{stats.total_ratings}</div>
            <p className="text-[10px] sm:text-xs text-purple-100 hidden sm:block">All time feedback</p>
          </CardContent>
        </Card>

        <Card 
          className="transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">Avg Rating</CardTitle>
            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-white fill-white" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-white flex items-center gap-1">
              {stats.average_rating.toFixed(1)}
              <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-300 text-yellow-300" />
            </div>
            <p className="text-[10px] sm:text-xs text-pink-100 hidden sm:block">Overall satisfaction</p>
          </CardContent>
        </Card>

        <Card 
          className="transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">Positive</CardTitle>
            <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-white">{positiveRatings}</div>
            <p className="text-[10px] sm:text-xs text-green-100 hidden sm:block">4-5 star ratings</p>
          </CardContent>
        </Card>

        <Card 
          className="transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">Attention</CardTitle>
            <ThumbsDown className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-white">{negativeRatings}</div>
            <p className="text-[10px] sm:text-xs text-orange-100 hidden sm:block">1-2 star ratings</p>
          </CardContent>
        </Card>

        <Card 
          className="transition-all hover:shadow-lg col-span-2 sm:col-span-1"
          style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">Recent (7d)</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-white">{stats.recent_ratings_7d}</div>
            <p className="text-[10px] sm:text-xs text-cyan-100 hidden sm:block">New reviews this week</p>
          </CardContent>
        </Card>
      </div>
    )
  }


  // Render table skeleton
  const renderTableSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 border-b">
          <Skeleton className="h-4 w-12 sm:w-20" />
          <Skeleton className="h-4 w-20 sm:w-32 hidden sm:block" />
          <div className="flex gap-1">
            {[...Array(5)].map((_, j) => (
              <Skeleton key={j} className="h-3 w-3 sm:h-4 sm:w-4" />
            ))}
          </div>
          <Skeleton className="h-4 w-24 sm:w-40 flex-1" />
        </div>
      ))}
    </div>
  )

  // Render ratings error state
  const renderRatingsError = () => (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 gap-3 sm:gap-4">
      <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
      <p className="text-muted-foreground text-sm sm:text-base text-center">{ratingsError}</p>
      <Button variant="outline" size="sm" onClick={fetchRatings}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  )

  // Render empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 gap-3 sm:gap-4">
      <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
      <p className="text-muted-foreground text-sm sm:text-base">No reviews found</p>
      <p className="text-xs sm:text-sm text-muted-foreground text-center px-4">
        Reviews will appear here once customers start rating their orders.
      </p>
    </div>
  )

  // Render ratings table
  const renderRatingsTable = () => {
    if (ratings.length === 0) return renderEmptyState()

    return (
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[600px] sm:min-w-0">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-xs sm:text-sm">Order</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm hidden sm:table-cell">Customer</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm hidden md:table-cell">Agent</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm">Rating</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm hidden lg:table-cell">Tags</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm">Feedback</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm hidden xl:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ratings.map((rating) => (
              <TableRow key={rating.id} className="hover:bg-muted/30">
                <TableCell className="p-2 sm:p-4">
                  <div className="font-medium text-primary text-xs sm:text-sm">
                    #{rating.order_number}
                  </div>
                  {/* Mobile: show customer name */}
                  <div className="sm:hidden text-[10px] text-muted-foreground mt-1">
                    {rating.user_name}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell p-2 sm:p-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{rating.user_name}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">{rating.user_email}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell p-2 sm:p-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{rating.agent_name}</span>
                    {rating.agent_code && (
                      <span className="text-xs text-muted-foreground">{rating.agent_code}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="p-2 sm:p-4">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 sm:h-4 sm:w-4 ${
                          star <= rating.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell p-2 sm:p-4">
                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                    {rating.tags && rating.tags.length > 0 ? (
                      rating.tags.slice(0, 2).map((tag, idx) => (
                        <TagBadge key={idx} tag={tag} />
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="p-2 sm:p-4">
                  <div className="max-w-[120px] sm:max-w-[200px]">
                    {rating.feedback ? (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2" title={rating.feedback}>
                        "{rating.feedback}"
                      </p>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No feedback</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden xl:table-cell p-2 sm:p-4">
                  <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Reviews</h2>
          <p className="text-sm text-muted-foreground hidden sm:block">Track both legacy agent ratings and the new vendor review flow from one place</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh} 
          disabled={isLoadingRatings || isLoadingStats}
          className="self-start sm:self-auto h-8 sm:h-9"
        >
          <RefreshCw className={`h-4 w-4 sm:mr-2 ${(isLoadingRatings || isLoadingStats) ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Statistics Cards */}
      {renderStatsCards()}

      {/* Rating Distribution */}
      {stats && !isLoadingStats && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Rating Distribution</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Breakdown of ratings by star count</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-2 sm:space-y-3">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.rating_distribution[star] || 0
                const percentage = stats.total_ratings > 0 
                  ? Math.round((count / stats.total_ratings) * 100) 
                  : 0
                return (
                  <div key={star} className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-1 w-10 sm:w-16">
                      <span className="text-xs sm:text-sm font-medium">{star}</span>
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 h-3 sm:h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          star >= 4 ? 'bg-green-500' : star === 3 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-14 sm:w-20 text-right">
                      <span className="text-xs sm:text-sm font-medium">{count}</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground ml-1">({percentage}%)</span>
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
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">All Reviews</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {isLoadingRatings ? 'Loading...' : `${totalCount} reviews`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-8 sm:h-9 text-xs sm:text-sm">
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
        <CardContent className="p-0 sm:p-6 sm:pt-0">
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
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Popular Feedback Tags</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Most frequently selected feedback tags</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {Object.entries(stats.tag_frequency)
                .sort(([, a], [, b]) => b - a)
                .map(([tag, count]) => (
                  <div 
                    key={tag} 
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg ${
                      tag === 'NEEDS_IMPROVEMENT' 
                        ? 'bg-red-50 border border-red-200' 
                        : 'bg-green-50 border border-green-200'
                    }`}
                  >
                    <span className={`text-xs sm:text-sm font-medium ${
                      tag === 'NEEDS_IMPROVEMENT' ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {RATING_TAG_LABELS[tag as RatingTag] || tag}
                    </span>
                    <Badge variant="outline" className="text-[10px] sm:text-xs h-5">
                      {count}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Vendor Review Flow</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {isLoadingVendorReviews ? 'Loading...' : `${vendorTotalCount} vendor review records`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <Select value={vendorDirectionFilter} onValueChange={(value) => setVendorDirectionFilter(value as 'all' | VendorReviewDirection)}>
                <SelectTrigger className="w-full sm:w-[220px] h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Filter by review direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="customer_to_vendor">Customer to Vendor</SelectItem>
                  <SelectItem value="vendor_to_customer">Vendor to Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          {vendorStats ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Total Records</div>
                  <div className="mt-2 text-2xl font-bold">{vendorStats.total_reviews}</div>
                </CardContent>
              </Card>
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Average Rating</div>
                  <div className="mt-2 text-2xl font-bold">{vendorStats.average_rating.toFixed(1)}</div>
                </CardContent>
              </Card>
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Recommendation Rate</div>
                  <div className="mt-2 text-2xl font-bold">{vendorStats.recommendation_rate.toFixed(0)}%</div>
                </CardContent>
              </Card>
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Latest Review</div>
                  <div className="mt-2 text-sm font-semibold">
                    {vendorStats.latest_review_at ? formatDate(vendorStats.latest_review_at) : 'No reviews yet'}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {vendorStats && Object.keys(vendorStats.distribution).length > 0 ? (
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = vendorStats.distribution[String(star)] || 0
                const percentage = vendorStats.total_reviews > 0
                  ? Math.round((count / vendorStats.total_reviews) * 100)
                  : 0
                return (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-medium">{star}</span>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="w-20 text-right text-xs text-muted-foreground">
                      {count} ({percentage}%)
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}

          {isLoadingVendorReviews ? (
            renderTableSkeleton()
          ) : vendorReviewsError ? (
            renderVendorReviewsError()
          ) : (
            renderVendorReviewsTable()
          )}
        </CardContent>
      </Card>
    </div>
  )
}
