import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UploadResult } from "@uppy/core";

interface ProductImageUploaderProps {
  productId: string;
  currentImages?: string[];
  onImagesUpdated?: (_imageUrls: string[]) => void;
}

export default function ProductImageUploader({
  productId,
  currentImages = [],
  onImagesUpdated,
}: ProductImageUploaderProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>(currentImages);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProductImagesMutation = useMutation({
    mutationFn: async (imageURLs: string[]): Promise<Record<string, unknown>> => {
      return (await apiRequest("PUT", `/api/products/${productId}/images`, {
        imageURLs,
      })) as any as Record<string, unknown>;
    },
    onSuccess: (data: Record<string, unknown>) => {
      const newImages = (data?.imagePaths || []) as string[];
      setUploadedImages(newImages);
      onImagesUpdated?.(newImages);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Images mises à jour",
        description: "Les images du produit ont été mises à jour avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour les images",
        variant: "destructive",
      });
    },
  });

  const handleUploadComplete = (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => {
    const uploadedURLs =
      result.successful
        ?.map((file) => file.uploadURL)
        .filter((url): url is string => Boolean(url)) || [];
    const allImages = [...uploadedImages, ...uploadedURLs];
    updateProductImagesMutation.mutate(allImages);
  };

  const handleGetUploadParameters = async (): Promise<{ method: "PUT"; url: string }> => {
    const response = (await apiRequest("POST", "/api/objects/upload")) as any as Record<
      string,
      unknown
    >;
    return {
      method: "PUT" as const,
      url: response.uploadURL as string,
    };
  };

  const removeImage = (indexToRemove: number) => {
    const newImages = uploadedImages.filter((_, index) => index !== indexToRemove);
    setUploadedImages(newImages);
    updateProductImagesMutation.mutate(newImages);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <i className="fas fa-images mr-2 text-zaka-orange"></i>
          Images du produit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Images Display */}
        {uploadedImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {uploadedImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {uploadedImages.length < 5 && (
          <ObjectUploader
            maxNumberOfFiles={5 - uploadedImages.length}
            maxFileSize={5242880} // 5MB
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleUploadComplete}
            buttonClassName="w-full border-2 border-dashed border-gray-300 hover:border-zaka-orange p-8 rounded-lg transition-colors"
          >
            <div className="text-center">
              <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
              <p className="text-gray-600">Cliquez pour ajouter des images</p>
              <p className="text-sm text-gray-500 mt-1">Maximum 5 images, 5MB chacune</p>
            </div>
          </ObjectUploader>
        )}

        {/* Upload Progress */}
        {updateProductImagesMutation.isPending && (
          <div className="flex items-center justify-center py-4">
            <i className="fas fa-spinner fa-spin text-zaka-orange mr-2"></i>
            <span className="text-gray-600">Mise à jour des images...</span>
          </div>
        )}

        {/* Help Text */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-700">
            <i className="fas fa-info-circle mr-2"></i>
            Ajoutez jusqu'à 5 images de haute qualité pour présenter votre produit. La première
            image sera utilisée comme image principale.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
