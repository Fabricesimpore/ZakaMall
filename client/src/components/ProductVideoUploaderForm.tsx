import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ProductVideoUploaderFormProps {
  onVideosChange: (videoUrls: string[]) => void;
  currentVideos?: string[];
  maxVideos?: number;
}

export default function ProductVideoUploaderForm({
  onVideosChange,
  currentVideos = [],
  maxVideos = 3,
}: ProductVideoUploaderFormProps) {
  const [uploadedVideos, setUploadedVideos] = useState<string[]>(currentVideos);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Direct video upload handler
  const handleDirectUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadPromises: Promise<string | null>[] = [];

    for (let i = 0; i < files.length && i < maxVideos - uploadedVideos.length; i++) {
      const file = files[i];

      if (!file.type.startsWith("video/")) {
        toast({
          title: "Erreur",
          description: `${file.name} n'est pas un fichier vidéo`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > 50 * 1024 * 1024) {
        // 50MB limit
        toast({
          title: "Erreur",
          description: `${file.name} est trop grand (max 50MB)`,
          variant: "destructive",
        });
        continue;
      }

      const uploadPromise = (async () => {
        try {
          console.log(`🎥 Uploading ${file.name} directly...`);

          const formData = new FormData();
          formData.append("video", file);

          // Direct fetch to video upload endpoint
          const response = await fetch("/api/upload/video", {
            method: "POST",
            credentials: "include", // Include cookies for session
            body: formData,
          });

          console.log(`Response status: ${response.status}`);

          if (!response.ok) {
            const error = await response.text();
            console.error(`Video upload failed: ${error}`);
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const data = await response.json();
          console.log("Video upload response:", data);

          if (data.success && data.url) {
            return data.url;
          } else {
            throw new Error(data.error || "Video upload failed");
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
        const allVideos = [...uploadedVideos, ...successfulUploads];
        setUploadedVideos(allVideos);
        onVideosChange(allVideos);

        toast({
          title: "Vidéos ajoutées",
          description: `${successfulUploads.length} vidéo(s) ajoutée(s) avec succès`,
        });
      }
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = "";
    }
  };

  const removeVideo = (indexToRemove: number) => {
    const newVideos = uploadedVideos.filter((_, index) => index !== indexToRemove);
    setUploadedVideos(newVideos);
    onVideosChange(newVideos);
  };

  return (
    <div className="space-y-4">
      {/* Current Videos Display */}
      {uploadedVideos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {uploadedVideos.map((videoUrl, index) => (
            <div key={index} className="relative group">
              <video
                src={videoUrl}
                className="w-full h-32 object-cover rounded-lg border"
                controls
              />
              <button
                type="button"
                onClick={() => removeVideo(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-zaka-orange text-white px-2 py-1 rounded text-xs">
                  Vidéo principale
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {uploadedVideos.length < maxVideos && (
        <div className="w-full">
          <label className="block">
            <div className="w-full border-2 border-dashed border-gray-300 hover:border-zaka-orange p-8 rounded-lg transition-colors cursor-pointer">
              <div className="text-center">
                {isUploading ? (
                  <>
                    <i className="fas fa-spinner fa-spin text-3xl text-zaka-orange mb-2"></i>
                    <p className="text-gray-600">Upload en cours...</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Cela peut prendre quelques minutes pour les vidéos
                    </p>
                  </>
                ) : (
                  <>
                    <i className="fas fa-video text-3xl text-gray-400 mb-2"></i>
                    <p className="text-gray-600">Cliquez pour ajouter des vidéos</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Maximum {maxVideos - uploadedVideos.length} vidéos, 50MB chacune
                    </p>
                  </>
                )}
              </div>
            </div>
            <input
              type="file"
              multiple
              accept="video/*"
              onChange={handleDirectUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-orange-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-orange-800 mb-2">
          <i className="fas fa-lightbulb mr-2"></i>
          Conseils pour de bonnes vidéos de restaurant:
        </h4>
        <ul className="text-sm text-orange-700 space-y-1">
          <li>
            • <strong>Courtes et captivantes</strong>: 15-60 secondes idéalement
          </li>
          <li>
            • <strong>Bonne qualité</strong>: Éclairage naturel, image stable
          </li>
          <li>
            • <strong>Verticales</strong>: Format portrait pour mobile (9:16)
          </li>
          <li>
            • <strong>Montrez le processus</strong>: Préparation ou plat final
          </li>
          <li>
            • <strong>Formats supportés</strong>: MP4, MOV, AVI, WebM
          </li>
        </ul>
      </div>
    </div>
  );
}
