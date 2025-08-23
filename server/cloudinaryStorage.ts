import { v2 as cloudinary } from "cloudinary";
import type { Request } from "express";
import multer from "multer";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: Request, file: multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Video uploader with larger file size limit
export const videoUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
  },
  fileFilter: (req: Request, file: multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"));
    }
  },
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
}

export class CloudinaryService {
  /**
   * Check if Cloudinary is properly configured
   */
  static isConfigured(): boolean {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const isConfigured = !!(cloudName && apiKey && apiSecret);

    console.log("🔍 Cloudinary Configuration Check:");
    console.log("CLOUDINARY_CLOUD_NAME:", cloudName ? `✅ "${cloudName}"` : "❌ Missing");
    console.log("CLOUDINARY_API_KEY:", apiKey ? `✅ "${apiKey.substring(0, 8)}..."` : "❌ Missing");
    console.log(
      "CLOUDINARY_API_SECRET:",
      apiSecret ? `✅ Set (${apiSecret.length} chars)` : "❌ Missing"
    );

    if (!isConfigured) {
      console.error("❌ Cloudinary configuration incomplete - image uploads will fail");
    } else {
      console.log("✅ Cloudinary is properly configured");
    }

    return isConfigured;
  }

  /**
   * Upload a single image to Cloudinary
   */
  static async uploadImage(
    buffer: Buffer,
    options: {
      folder?: string;
      public_id?: string;
      transformation?: any;
    } = {}
  ): Promise<CloudinaryUploadResult> {
    // Check if Cloudinary is configured before attempting upload
    if (!this.isConfigured()) {
      throw new Error(
        "Cloudinary is not properly configured. Please check your environment variables."
      );
    }

    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: options.folder || "zakamall/products",
        resource_type: "image",
        quality: "auto",
      };

      // Only add public_id if provided
      if (options.public_id) {
        uploadOptions.public_id = options.public_id;
      }

      console.log("🔧 Upload options:", uploadOptions);

      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            console.error("❌ Cloudinary upload error:", error);
            console.error("Error message:", error.message);
            console.error("Error http_code:", error.http_code);
            reject(error);
          } else if (result) {
            console.log("✅ Cloudinary upload successful:", {
              public_id: result.public_id,
              secure_url: result.secure_url,
              width: result.width,
              height: result.height,
              format: result.format,
            });
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              width: result.width,
              height: result.height,
              format: result.format,
            });
          } else {
            reject(new Error("Upload failed - no result returned"));
          }
        })
        .end(buffer);
    });
  }

  /**
   * Upload a video to Cloudinary
   */
  static async uploadVideo(
    buffer: Buffer,
    options: {
      folder?: string;
      public_id?: string;
      transformation?: any;
    } = {}
  ): Promise<CloudinaryUploadResult> {
    // Check if Cloudinary is configured before attempting upload
    if (!this.isConfigured()) {
      throw new Error(
        "Cloudinary is not properly configured. Please check your environment variables."
      );
    }

    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: options.folder || "zakamall/videos",
        resource_type: "video",
        quality: "auto",
        eager: [
          { width: 640, height: 480, crop: "pad", format: "mp4" },
          { width: 320, height: 240, crop: "pad", format: "webm" },
        ],
      };

      // Only add public_id if provided
      if (options.public_id) {
        uploadOptions.public_id = options.public_id;
      }

      console.log("🎥 Video upload options:", uploadOptions);

      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            console.error("❌ Cloudinary video upload error:", error);
            console.error("Error message:", error.message);
            console.error("Error http_code:", error.http_code);
            reject(error);
          } else if (result) {
            console.log("✅ Cloudinary video upload successful:", {
              public_id: result.public_id,
              secure_url: result.secure_url,
              width: result.width,
              height: result.height,
              format: result.format,
              duration: result.duration,
            });
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              width: result.width,
              height: result.height,
              format: result.format,
            });
          } else {
            reject(new Error("Video upload failed - no result returned"));
          }
        })
        .end(buffer);
    });
  }

  /**
   * Delete an image from Cloudinary
   */
  static async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      throw error;
    }
  }

  /**
   * Get optimized image URL with transformations
   */
  static getOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
    } = {}
  ): string {
    return cloudinary.url(publicId, {
      width: options.width || 400,
      height: options.height || 400,
      crop: options.crop || "fill",
      quality: options.quality || "auto",
      format: "auto",
    });
  }
}

export default CloudinaryService;
