import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import EnhancedReviewCard from "./EnhancedReviewCard";
import VendorResponseCard from "./VendorResponseCard";
// Button import removed as it's unused
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, TrendingUp, Clock, ThumbsUp } from "lucide-react";

interface EnhancedReview {
  id: string;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  isVerified: boolean;
  helpfulVotes: number;
  totalVotes: number;
  isRecommended?: boolean;
  purchaseVerified: boolean;
  reviewerLevel: string;
  createdAt: string;
  userName: string;
  userLastName: string;
}

interface VendorResponse {
  id: string;
  reviewId: string;
  vendorId: string;
  response: string;
  isOfficial: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EnhancedReviewsListProps {
  productId: string;
  vendorId?: string;
  vendorName?: string;
}

export default function EnhancedReviewsList({
  productId,
  vendorId,
  vendorName,
}: EnhancedReviewsListProps) {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");

  const isVendor = user?.role === "vendor";

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: [
      `/api/products/${productId}/reviews`,
      { enhanced: true, sort: sortBy, filter: filterBy },
    ],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/products/${productId}/reviews?enhanced=true`);
      return response.json();
    },
  });

  const { data: allResponses = {} } = useQuery({
    queryKey: [`/api/reviews/responses`, productId],
    queryFn: async () => {
      const responses: { [reviewId: string]: VendorResponse[] } = {};

      // Fetch responses for each review
      await Promise.all(
        reviews.map(async (review: EnhancedReview) => {
          try {
            const response = await apiRequest("GET", `/api/reviews/${review.id}/responses`);
            const reviewResponses = await response.json();
            responses[review.id] = reviewResponses;
          } catch (error) {
            console.error(`Error fetching responses for review ${review.id}:`, error);
            responses[review.id] = [];
          }
        })
      );

      return responses;
    },
    enabled: reviews.length > 0,
  });

  const sortedAndFilteredReviews = React.useMemo(() => {
    let filtered = [...reviews];

    // Apply filters
    switch (filterBy) {
      case "verified":
        filtered = filtered.filter((review) => review.purchaseVerified);
        break;
      case "helpful":
        filtered = filtered.filter((review) => review.helpfulVotes > 0);
        break;
      case "with_images":
        filtered = filtered.filter((review) => review.images && review.images.length > 0);
        break;
      case "recommended":
        filtered = filtered.filter((review) => review.isRecommended === true);
        break;
      case "5_star":
        filtered = filtered.filter((review) => review.rating === 5);
        break;
      case "1_star":
        filtered = filtered.filter((review) => review.rating === 1);
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case "helpful":
        filtered.sort((a, b) => b.helpfulVotes - a.helpfulVotes);
        break;
      case "rating_high":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "rating_low":
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      default: // newest
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return filtered;
  }, [reviews, sortBy, filterBy]);

  const reviewStats = React.useMemo(() => {
    const total = reviews.length;
    const averageRating =
      total > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / total : 0;
    const verifiedPurchases = reviews.filter((review) => review.purchaseVerified).length;
    const withImages = reviews.filter((review) => review.images && review.images.length > 0).length;

    const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: reviews.filter((review) => review.rating === rating).length,
      percentage:
        total > 0 ? (reviews.filter((review) => review.rating === rating).length / total) * 100 : 0,
    }));

    return {
      total,
      averageRating,
      verifiedPurchases,
      withImages,
      ratingDistribution,
    };
  }, [reviews]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">Chargement des avis...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            Avis clients ({reviewStats.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {reviewStats.averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(reviewStats.averageRating)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-gray-600">Note moyenne</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {reviewStats.verifiedPurchases}
              </div>
              <div className="text-sm text-gray-600">Achats vérifiés</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{reviewStats.withImages}</div>
              <div className="text-sm text-gray-600">Avec photos</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {reviews.filter((r) => r.reviewerLevel !== "basic").length}
              </div>
              <div className="text-sm text-gray-600">Reviewers de confiance</div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="mt-6">
            <h4 className="font-medium mb-3">Distribution des notes</h4>
            <div className="space-y-2">
              {reviewStats.ratingDistribution.reverse().map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center space-x-3">
                  <span className="text-sm w-12">
                    {rating} étoile{rating > 1 ? "s" : ""}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Sorting */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Trier par</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Plus récents
                    </div>
                  </SelectItem>
                  <SelectItem value="helpful">
                    <div className="flex items-center">
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Plus utiles
                    </div>
                  </SelectItem>
                  <SelectItem value="rating_high">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Note décroissante
                    </div>
                  </SelectItem>
                  <SelectItem value="rating_low">Note croissante</SelectItem>
                  <SelectItem value="oldest">Plus anciens</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Filtrer par</label>
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les avis</SelectItem>
                  <SelectItem value="verified">Achats vérifiés</SelectItem>
                  <SelectItem value="helpful">Avis utiles</SelectItem>
                  <SelectItem value="with_images">Avec photos</SelectItem>
                  <SelectItem value="recommended">Recommandés</SelectItem>
                  <SelectItem value="5_star">5 étoiles</SelectItem>
                  <SelectItem value="1_star">1 étoile</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div>
        {sortedAndFilteredReviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              {reviews.length === 0
                ? "Aucun avis pour ce produit"
                : "Aucun avis ne correspond aux filtres sélectionnés"}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedAndFilteredReviews.map((review) => (
              <div key={review.id}>
                <EnhancedReviewCard
                  review={review}
                  productId={productId}
                  isVendor={isVendor}
                  vendorId={vendorId}
                />
                {/* Vendor Responses */}
                {allResponses[review.id]?.map((response) => (
                  <VendorResponseCard
                    key={response.id}
                    response={response}
                    vendorName={vendorName}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
