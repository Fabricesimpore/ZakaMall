import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, MessageSquare, Shield, Star } from "lucide-react";

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

interface EnhancedReviewCardProps {
  review: EnhancedReview;
  productId: string;
  isVendor?: boolean;
  vendorId?: string;
}

export default function EnhancedReviewCard({
  review,
  productId,
  isVendor = false,
  vendorId,
}: EnhancedReviewCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState("");

  const voteOnReviewMutation = useMutation({
    mutationFn: async ({ voteType }: { voteType: "helpful" | "not_helpful" }) => {
      const response = await apiRequest("POST", `/api/reviews/${review.id}/vote`, { voteType });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/reviews`] });
      toast({
        title: "Vote enregistré",
        description: "Votre vote a été pris en compte",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addResponseMutation = useMutation({
    mutationFn: async (response: string) => {
      const res = await apiRequest("POST", `/api/reviews/${review.id}/response`, { response });
      return res.json();
    },
    onSuccess: () => {
      setResponseText("");
      setShowResponse(false);
      queryClient.invalidateQueries({ queryKey: [`/api/reviews/${review.id}/responses`] });
      toast({
        title: "Réponse ajoutée",
        description: "Votre réponse a été publiée",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVote = (voteType: "helpful" | "not_helpful") => {
    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour voter",
        variant: "destructive",
      });
      return;
    }
    voteOnReviewMutation.mutate({ voteType });
  };

  const handleSubmitResponse = () => {
    if (!responseText.trim()) return;
    addResponseMutation.mutate(responseText);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-BF", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getReviewerLevelBadge = (level: string) => {
    switch (level) {
      case "trusted":
        return (
          <Badge variant="secondary" className="text-xs">
            <Shield className="w-3 h-3 mr-1" />
            Reviewer de confiance
          </Badge>
        );
      case "vine":
        return (
          <Badge className="bg-purple-100 text-purple-800 text-xs">
            <Star className="w-3 h-3 mr-1" />
            Vine Customer
          </Badge>
        );
      default:
        return null;
    }
  };

  const helpfulnessPercentage =
    review.totalVotes > 0 ? Math.round((review.helpfulVotes / review.totalVotes) * 100) : 0;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="font-medium text-sm">
                {review.userName?.charAt(0)}
                {review.userLastName?.charAt(0)}
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {review.userName} {review.userLastName}
                </span>
                {review.purchaseVerified && (
                  <Badge variant="outline" className="text-xs border-green-500 text-green-700">
                    <Shield className="w-3 h-3 mr-1" />
                    Achat vérifié
                  </Badge>
                )}
                {getReviewerLevelBadge(review.reviewerLevel)}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">{formatDate(review.createdAt)}</span>
              </div>
            </div>
          </div>
          {review.isRecommended !== null && (
            <Badge variant={review.isRecommended ? "default" : "secondary"} className="text-xs">
              {review.isRecommended ? "Recommandé" : "Non recommandé"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {review.title && <h4 className="font-semibold mb-2">{review.title}</h4>}

        {review.comment && <p className="text-gray-700 mb-3 leading-relaxed">{review.comment}</p>}

        {review.images && review.images.length > 0 && (
          <div className="flex space-x-2 mb-3">
            {review.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Review image ${index + 1}`}
                className="w-16 h-16 object-cover rounded border"
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote("helpful")}
                disabled={voteOnReviewMutation.isPending}
                className="text-gray-600 hover:text-green-600"
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                Utile ({review.helpfulVotes})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote("not_helpful")}
                disabled={voteOnReviewMutation.isPending}
                className="text-gray-600 hover:text-red-600"
              >
                <ThumbsDown className="w-4 h-4 mr-1" />
                Pas utile
              </Button>
            </div>

            {review.totalVotes > 0 && (
              <span className="text-sm text-gray-500">
                {helpfulnessPercentage}% trouvent cela utile
              </span>
            )}
          </div>

          {isVendor && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResponse(!showResponse)}
              className="text-blue-600 hover:text-blue-700"
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Répondre
            </Button>
          )}
        </div>

        {showResponse && isVendor && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <Textarea
              placeholder="Répondre à cet avis..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              className="mb-3"
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowResponse(false);
                  setResponseText("");
                }}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitResponse}
                disabled={!responseText.trim() || addResponseMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {addResponseMutation.isPending ? "Envoi..." : "Publier"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
