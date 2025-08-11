import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import XHRUpload from "@uppy/xhr-upload";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT" | "POST";
    url: string;
  }>;
  onComplete?: (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 *
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 *
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: ["image/*"],
      },
      autoProceed: false,
    })
      .use(XHRUpload, {
        endpoint: async () => {
          const params = await onGetUploadParameters();
          return params.url;
        },
        method: "POST",
        formData: true,
        fieldName: "image",
        withCredentials: true,
        headers: {},
        timeout: 120 * 1000, // 120 seconds timeout
        limit: 1, // Upload one file at a time
        retryDelays: [0, 1000, 3000, 5000], // Retry with delays
      })
      .on("complete", (result) => {
        console.log("Upload complete:", result);
        onComplete?.(result);
        setShowModal(false);
      })
      .on("error", (error) => {
        console.error("Upload error:", error);
      })
      .on("upload-error", (file, error, response) => {
        console.error("Upload failed for file:", file?.name, "Error:", error, "Response:", response);
      })
  );

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName}>
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        note="Images seulement, jusqu'à 10 MB"
      />
    </div>
  );
}
