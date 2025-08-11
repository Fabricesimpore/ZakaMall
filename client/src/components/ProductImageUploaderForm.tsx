import { useState } from "react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UploadResult } from "@uppy/core";

interface ProductImageUploaderFormProps {
  onImagesChange: (imageUrls: string[]) => void;
  currentImages?: string[];
  maxImages?: number;
}

export default function ProductImageUploaderForm({
  onImagesChange,
  currentImages = [],
  maxImages = 5,
}: ProductImageUploaderFormProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>(currentImages);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleUploadComplete = (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => {
    console.log("📸 Upload completed, result:", result);
    setIsUploading(false);

    const uploadedURLs =
      result.successful
        ?.map((file) => {
          console.log("Processing uploaded file:", file);
          // For XHRUpload, the response is in file.response.body
          if (file.response && typeof file.response === "object") {
            const responseObj = file.response as any;
            // Try different possible response formats
            return responseObj.body?.url || responseObj.url || file.uploadURL;
          }
          return file.uploadURL;
        })
        .filter((url): url is string => Boolean(url)) || [];

    console.log("✅ Extracted image URLs:", uploadedURLs);

    const allImages = [...uploadedImages, ...uploadedURLs];
    setUploadedImages(allImages);
    onImagesChange(allImages);

    toast({
      title: "Images ajoutées",
      description: `${uploadedURLs.length} image(s) ajoutée(s) avec succès`,
    });
  };

  const handleGetUploadParameters = async (): Promise<{ method: "POST"; url: string }> => {
    try {
      console.log("🔍 Getting upload parameters...");
      const response = (await apiRequest("POST", "/api/objects/upload")) as any as Record<
        string,
        unknown
      >;

      console.log("✅ Upload parameters received:", response);

      return {
        method: "POST" as const, // Changed from PUT to POST for multipart/form-data uploads
        url: response.uploadURL as string,
      };
    } catch (error) {
      console.error("❌ Failed to get upload parameters:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'obtenir l'URL d'upload",
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeImage = (indexToRemove: number) => {
    const newImages = uploadedImages.filter((_, index) => index !== indexToRemove);
    setUploadedImages(newImages);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
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
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                  Image principale
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {uploadedImages.length < maxImages && (
        <ObjectUploader
          maxNumberOfFiles={maxImages - uploadedImages.length}
          maxFileSize={5242880} // 5MB
          onGetUploadParameters={handleGetUploadParameters}
          onComplete={handleUploadComplete}
          buttonClassName="w-full border-2 border-dashed border-gray-300 hover:border-zaka-orange p-8 rounded-lg transition-colors"
        >
          <div className="text-center">
            {isUploading ? (
              <>
                <i className="fas fa-spinner fa-spin text-3xl text-zaka-orange mb-2"></i>
                <p className="text-gray-600">Upload en cours...</p>
              </>
            ) : (
              <>
                <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                <p className="text-gray-600">Cliquez pour ajouter des images</p>
                <p className="text-sm text-gray-500 mt-1">
                  Maximum {maxImages} images, 5MB chacune
                </p>
              </>
            )}
          </div>
        </ObjectUploader>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-700">
          <i className="fas fa-info-circle mr-2"></i>
          Ajoutez jusqu'à {maxImages} images de haute qualité pour présenter votre produit. La
          première image sera utilisée comme image principale.
        </p>
      </div>
    </div>
  );
}
