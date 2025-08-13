import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

interface VendorResponse {
  id: string;
  reviewId: string;
  vendorId: string;
  response: string;
  isOfficial: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VendorResponseCardProps {
  response: VendorResponse;
  vendorName?: string;
}

export default function VendorResponseCard({ response, vendorName }: VendorResponseCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-BF", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card className="ml-8 mt-3 border-l-4 border-l-blue-500 bg-blue-50/50">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">{vendorName || "Vendeur"}</span>
            {response.isOfficial && (
              <Badge variant="outline" className="text-xs border-blue-500 text-blue-700">
                Réponse officielle
              </Badge>
            )}
          </div>
          <span className="text-sm text-gray-600">{formatDate(response.createdAt)}</span>
        </div>

        <p className="text-gray-700 leading-relaxed">{response.response}</p>
      </CardContent>
    </Card>
  );
}
