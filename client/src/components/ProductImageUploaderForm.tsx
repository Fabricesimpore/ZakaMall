import React, { useState } from "react";
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
  const [useDirectUpload, setUseDirectUpload] = useState(true); // Toggle for testing
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
          console.log("File uploadURL:", file.uploadURL);

          // With getResponseData, XHRUpload sets file.uploadURL to the URL from our response
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
      console.log("Current location:", window.location.href);

      const response = (await apiRequest("POST", "/api/objects/upload")) as any as Record<
        string,
        unknown
      >;

      console.log("✅ Upload parameters received:", response);
      console.log("📍 Will upload to:", response.uploadURL);

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

  // Direct upload handler - simpler alternative to Uppy
  const handleDirectUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadPromises: Promise<string | null>[] = [];

    for (let i = 0; i < files.length && i < maxImages - uploadedImages.length; i++) {
      const file = files[i];

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Erreur",
          description: `${file.name} n'est pas une image`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: "Erreur",
          description: `${file.name} est trop grand (max 5MB)`,
          variant: "destructive",
        });
        continue;
      }

      const uploadPromise = (async () => {
        try {
          console.log(`📤 Uploading ${file.name} directly...`);

          const formData = new FormData();
          formData.append("image", file);

          // Direct fetch to upload endpoint
          const response = await fetch("/api/upload/image", {
            method: "POST",
            credentials: "include", // Include cookies for session
            body: formData,
          });

          console.log(`Response status: ${response.status}`);

          if (!response.ok) {
            const error = await response.text();
            console.error(`Upload failed: ${error}`);
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const data = await response.json();
          console.log("Upload response:", data);

          if (data.success && data.url) {
            return data.url;
          } else {
            throw new Error(data.error || "Upload failed");
          }
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          toast({
            title: "Erreur d'upload",
            description: `Impossible d'uploader ${file.name}`,
            variant: "destructive",
          });
          return null;
        }
      })();

      uploadPromises.push(uploadPromise);
    }

    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((url): url is string => url !== null);

      if (successfulUploads.length > 0) {
        const allImages = [...uploadedImages, ...successfulUploads];
        setUploadedImages(allImages);
        onImagesChange(allImages);

        toast({
          title: "Images ajoutées",
          description: `${successfulUploads.length} image(s) ajoutée(s) avec succès`,
        });
      }
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = "";
    }
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

      {/* Toggle between upload methods for testing */}
      <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
        <input
          type="checkbox"
          id="upload-toggle"
          checked={useDirectUpload}
          onChange={(e) => setUseDirectUpload(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="upload-toggle" className="text-sm">
          Utiliser l'upload direct (méthode alternative)
        </label>
      </div>

      {/* Upload Button */}
      {uploadedImages.length < maxImages && (
        <>
          {useDirectUpload ? (
            // Direct upload method - simpler and more reliable
            <div className="w-full">
              <label className="block">
                <div className="w-full border-2 border-dashed border-gray-300 hover:border-zaka-orange p-8 rounded-lg transition-colors cursor-pointer">
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
                          Maximum {maxImages - uploadedImages.length} images, 5MB chacune
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleDirectUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            // Original Uppy method
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
                    <p className="text-gray-600">Cliquez pour ajouter des images (Uppy)</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Maximum {maxImages} images, 5MB chacune
                    </p>
                  </>
                )}
              </div>
            </ObjectUploader>
          )}
        </>
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
