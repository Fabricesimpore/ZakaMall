import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated, isVendor } from "../auth";
import { insertReviewSchema } from "@shared/schema";
import { searchProducts, autocomplete } from "../api/search";

/**
 * Search and Review Routes
 * Handles product search, suggestions, and review management
 */
export function setupSearchReviewRoutes(app: Express) {
  // ============ SEARCH ROUTES ============

  // Main search endpoint (handled by dedicated search module)
  app.get("/api/search", searchProducts);

  // Search facets for filtering
  app.get("/api/search/facets", async (req, res) => {
    try {
      const facets = await storage.getSearchFacets();
      res.json(facets);
    } catch (error) {
      console.error("Error fetching search facets:", error);
      res.status(500).json({ message: "Failed to fetch search facets" });
    }
  });

  // Search suggestions/autocomplete
  app.get("/api/search/suggestions", autocomplete);

  // Popular search terms
  app.get("/api/search/popular", async (req, res) => {
    try {
      const popularSearches = await storage.getPopularSearchTerms();
      res.json(popularSearches);
    } catch (error) {
      console.error("Error fetching popular searches:", error);
      res.status(500).json({ message: "Failed to fetch popular searches" });
    }
  });

  // Track user behavior
  app.post("/api/behavior/track", async (req, res) => {
    try {
      const { actionType, productId, searchQuery, userId } = req.body;

      // Track user behavior for recommendations
      await storage.trackUserBehavior({
        actionType,
        productId,
        userId,
        sessionId: req.sessionID,
        metadata: searchQuery ? { searchQuery } : undefined,
      });

      res.json({ message: "Behavior tracked successfully" });
    } catch (error) {
      console.error("Error tracking behavior:", error);
      res.status(500).json({ message: "Failed to track behavior" });
    }
  });

  // Get recommendations for user
  app.get("/api/recommendations", async (req, res) => {
    try {
      const { userId, type = "trending", limit = "10" } = req.query;

      // Validate type parameter
      const validTypes = ["user_based", "item_based", "trending", "similar", "personalized"];
      const recommendationType = validTypes.includes(type as string) ? type as "user_based" | "item_based" | "trending" | "similar" | "personalized" : "trending";

      const recommendations = await storage.getRecommendations({
        userId: userId as string,
        type: recommendationType,
        limit: parseInt(limit as string),
      });

      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  // Compute product similarities (admin/system endpoint)
  app.post("/api/recommendations/compute-similarities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      // Only admin can trigger similarity computation
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      // This could be a long-running process, consider making it async
      setTimeout(async () => {
        try {
          await storage.computeProductSimilarities();
          console.log("🧠 Product similarity computation completed");
        } catch (error) {
          console.error("Error computing similarities:", error);
        }
      }, 1000);

      res.json({ message: "Similarity computation started" });
    } catch (error) {
      console.error("Error starting similarity computation:", error);
      res.status(500).json({ message: "Failed to start similarity computation" });
    }
  });

  // ============ REVIEW ROUTES ============

  // Create product review
  app.post("/api/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId,
      });

      // Check if user has purchased this product
      const hasPurchased = await storage.userHasPurchasedProduct(userId, reviewData.productId);
      if (!hasPurchased) {
        return res.status(403).json({ message: "You can only review products you have purchased" });
      }

      // Check if user already reviewed this product
      const existingReview = await storage.getUserProductReview(userId, reviewData.productId);
      if (existingReview) {
        return res.status(400).json({ message: "You have already reviewed this product" });
      }

      const review = await storage.createReview(reviewData);

      console.log(`⭐ Review created for product ${reviewData.productId} by user ${userId}`);
      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Vote on review (helpful/not helpful)
  app.post("/api/reviews/:id/vote", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { helpful } = req.body;
      const userId = req.user.claims.sub;

      if (typeof helpful !== "boolean") {
        return res.status(400).json({ message: "helpful must be a boolean" });
      }

      // Check if user already voted on this review
      const existingVote = await storage.getUserReviewVote(userId, id);
      if (existingVote) {
        return res.status(400).json({ message: "You have already voted on this review" });
      }

      await storage.voteOnReview(id, userId, helpful);
      res.json({ message: "Vote recorded successfully" });
    } catch (error) {
      console.error("Error voting on review:", error);
      res.status(500).json({ message: "Failed to vote on review" });
    }
  });

  // Vendor response to review
  app.post("/api/reviews/:id/response", isVendor, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { response } = req.body;
      const userId = req.user.claims.sub;

      if (!response || response.trim().length === 0) {
        return res.status(400).json({ message: "Response cannot be empty" });
      }

      // Verify vendor owns the product being reviewed
      const review = await storage.getReview(id);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      const product = await storage.getProduct(review.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const vendor = await storage.getVendorByUserId(userId);
      if (!vendor || vendor.id !== product.vendorId) {
        return res
          .status(403)
          .json({ message: "You can only respond to reviews of your own products" });
      }

      await storage.createReviewResponse(id, userId, response.trim());

      console.log(`💬 Vendor response added to review ${id}`);
      res.json({ message: "Response added successfully" });
    } catch (error) {
      console.error("Error adding review response:", error);
      res.status(500).json({ message: "Failed to add response" });
    }
  });

  // Get review responses
  app.get("/api/reviews/:id/responses", async (req, res) => {
    try {
      const { id } = req.params;

      const responses = await storage.getReviewResponses(id);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching review responses:", error);
      res.status(500).json({ message: "Failed to fetch review responses" });
    }
  });
}
