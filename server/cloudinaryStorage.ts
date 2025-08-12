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
    const isConfigured = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
    
    if (!isConfigured) {
      console.error("❌ Cloudinary configuration missing:");
      console.error("CLOUDINARY_CLOUD_NAME:", !!process.env.CLOUDINARY_CLOUD_NAME);
      console.error("CLOUDINARY_API_KEY:", !!process.env.CLOUDINARY_API_KEY);
      console.error("CLOUDINARY_API_SECRET:", !!process.env.CLOUDINARY_API_SECRET);
    } else {
      console.log("✅ Cloudinary is properly configured");
      console.log("Cloud name:", process.env.CLOUDINARY_CLOUD_NAME);
      console.log("API key:", process.env.CLOUDINARY_API_KEY?.substring(0, 8) + "...");
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
      throw new Error("Cloudinary is not properly configured. Please check your environment variables.");
    }

    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: options.folder || "zakamall/products",
        resource_type: "image",
        quality: "auto",
        format: "auto",
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
