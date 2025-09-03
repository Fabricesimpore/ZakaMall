import { Request, Response } from "express";
import { db } from "../db";
import { products, vendors } from "@shared/schema";
import { eq, and, or, gte, lte, desc, asc, sql, SQL } from "drizzle-orm";
import type { SearchResult } from "@shared/search-types";
import { expandSearchQuery } from "../utils/search-synonyms";

/**
 * Database fallback search when Meilisearch is not available
 */
export async function databaseSearch(req: Request, res: Response) {
  try {
    const {
      q = "",
      page = "1",
      limit = "24",
      sort = "createdAt:desc",
      vendor_id,
      category,
      price_min,
      price_max,
      in_stock,
    } = req.query;


    // Expand search query with synonyms
    const expandedQuery = expandSearchQuery(q as string);
    const searchTerms = expandedQuery.toLowerCase().split(" ").filter(Boolean);

    // Build WHERE conditions
    const conditions: SQL[] = [eq(products.isActive, true)];

    // Add search conditions
    if (searchTerms.length > 0) {
      const searchConditions = searchTerms.map((term) =>
        or(
          sql`LOWER(${products.name}) LIKE ${`%${term}%`}`,
          sql`LOWER(${products.description}) LIKE ${`%${term}%`}`,
          sql`LOWER(${products.sku}) LIKE ${`%${term}%`}`
        )
      );
      conditions.push(or(...searchConditions)!);
    }

    // Add filter conditions
    if (vendor_id) {
      conditions.push(eq(products.vendorId, vendor_id as string));
    }

    if (category) {
      conditions.push(eq(products.categoryId, category as string));
    }

    // Price filters - handle both CFA and cents
    if (price_min) {
      const minPrice = Number(price_min);
      // If the price looks like it's already in cents (> 10000), use as is
      // Otherwise multiply by 100 to convert CFA to cents
      const minCents = minPrice > 10000 ? minPrice : minPrice * 100;
      conditions.push(gte(products.price, minCents));
    }

    if (price_max) {
      const maxPrice = Number(price_max);
      // If the price looks like it's already in cents (> 10000), use as is
      // Otherwise multiply by 100 to convert CFA to cents
      const maxCents = maxPrice > 10000 ? maxPrice : maxPrice * 100;
      conditions.push(lte(products.price, maxCents));
    }

    if (in_stock === "true") {
      conditions.push(sql`${products.quantity} > 0`);
    }

    // Parse pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(Math.max(1, Number(limit)), 60);
    const offset = (pageNum - 1) * limitNum;

    // Parse sort
    const [sortField, sortOrder] = (sort as string).split(":");
    let orderBy: any = desc(products.createdAt); // default

    if (sortField === "price") {
      orderBy = sortOrder === "asc" ? asc(products.price) : desc(products.price);
    } else if (sortField === "name") {
      orderBy = sortOrder === "asc" ? asc(products.name) : desc(products.name);
    } else if (sortField === "rating") {
      orderBy = desc(products.rating);
    }

    // Execute query with JOIN to get vendor info
    const productsQuery = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        compareAtPrice: products.compareAtPrice,
        images: products.images,
        categoryId: products.categoryId,
        vendorId: products.vendorId,
        vendorName: vendors.storeName,
        sku: products.sku,
        quantity: products.quantity,
        rating: products.rating,
        reviewCount: products.reviewCount,
        isActive: products.isActive,
        isFeatured: products.isFeatured,
        createdAt: products.createdAt,
      })
      .from(products)
      .leftJoin(vendors, eq(products.vendorId, vendors.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limitNum)
      .offset(offset);

    // Get total count
    const countQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(...conditions));

    const totalHits = Number(countQuery[0]?.count || 0);
    const totalPages = Math.ceil(totalHits / limitNum);

    // Transform products to match search format
    const hits = productsQuery.map((p) => ({
      id: p.id,
      title: p.name,
      description: p.description,
      price: p.price,
      price_cents: p.price, // Already in cents in DB
      currency: "CFA",
      compare_at_price: p.compareAtPrice,
      images: p.images,
      categories: p.categoryId ? [p.categoryId] : [],
      vendor_id: p.vendorId,
      vendor_name: p.vendorName || "Unknown",
      sku: p.sku,
      in_stock: (p.quantity || 0) > 0,
      rating: p.rating,
      review_count: p.reviewCount,
      published: p.isActive,
      approved: true,
      is_featured: p.isFeatured,
      created_at: p.createdAt?.toISOString(),
    }));

    const searchResult: SearchResult = {
      hits,
      query: (q as string) || "",
      processingTimeMs: 0,
      hitsPerPage: limitNum,
      page: pageNum,
      totalPages,
      totalHits,
    };

    res.json(searchResult);
  } catch (error) {
    console.error("❌ Database search error:", error);
    res.status(500).json({
      hits: [],
      query: req.query.q || "",
      processingTimeMs: 0,
      hitsPerPage: 24,
      page: 1,
      totalPages: 0,
      totalHits: 0,
      error: "Search temporarily unavailable",
    });
  }
}

/**
 * Database fallback for autocomplete
 */
export async function databaseAutocomplete(req: Request, res: Response) {
  try {
    const { q = "" } = req.query;
    const query = (q as string).toLowerCase().trim();

    if (!query) {
      return res.json({ suggestions: [], query: "", processingTimeMs: 0 });
    }

    // Expand query with synonyms
    const expandedQuery = expandSearchQuery(query);
    const searchTerms = expandedQuery.toLowerCase().split(" ").filter(Boolean);

    // Get product name suggestions
    const suggestions = await db
      .selectDistinct({ name: products.name })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          or(...searchTerms.map((term) => sql`LOWER(${products.name}) LIKE ${`%${term}%`}`))
        )
      )
      .limit(10);

    const suggestionList = suggestions.map((s) => s.name).filter(Boolean);

    // Add common search terms based on the query
    const commonTerms: string[] = [];
    if (query.includes("tel") || query.includes("phone")) {
      commonTerms.push("téléphone", "smartphone", "iPhone", "Samsung");
    }
    if (query.includes("ordi")) {
      commonTerms.push("ordinateur", "laptop", "PC", "MacBook");
    }
    if (query.includes("vet") || query.includes("hab")) {
      commonTerms.push("vêtements", "chemise", "pantalon", "robe");
    }

    const allSuggestions = [...new Set([...suggestionList, ...commonTerms])].slice(0, 10);

    res.json({
      suggestions: allSuggestions,
      query,
      processingTimeMs: 0,
    });
  } catch (error) {
    console.error("❌ Database autocomplete error:", error);
    res.json({
      suggestions: [],
      query: req.query.q || "",
      processingTimeMs: 0,
    });
  }
}
