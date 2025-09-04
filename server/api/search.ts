import { Request, Response } from "express";
import { MeiliSearch } from "meilisearch";
import type { SearchParams, SearchResult, SearchFilters } from "@shared/search-types";
import { expandSearchQuery } from "../utils/search-synonyms";
import { cacheService } from "../cache";

let client: MeiliSearch | null = null;

function getClient() {
  if (!client) {
    client = new MeiliSearch({
      host: process.env.MEILI_HOST || "http://localhost:7700",
      apiKey:
        process.env.MEILI_SEARCH_KEY ||
        process.env.MEILI_MASTER_KEY ||
        "development_master_key_for_local",
    });
  }
  return client;
}

function getIndex() {
  return getClient().index("products");
}

/**
 * Parse search parameters from request
 */
function parseSearchParams(req: Request): SearchParams {
  const {
    q = "",
    page = "1",
    limit = "24",
    sort = "popularity_score:desc",
    vendor_id,
    category,
    categories,
    price_min,
    price_max,
    in_stock,
    currency,
    brand,
    brands,
  } = req.query;

  // Parse filters
  const filters: SearchFilters = {};

  if (vendor_id) filters.vendor_id = vendor_id as string;

  // Handle currency - only filter if specified
  if (currency) {
    filters.currency = currency as string;
  }
  // Remove default CFA filter to show all products regardless of currency

  if (in_stock !== undefined) filters.in_stock = in_stock === "true";

  // Handle price range (convert to cents for Meilisearch)
  if (price_min) {
    filters.price_min = Number(price_min) * 100;
  }
  if (price_max) {
    filters.price_max = Number(price_max) * 100;
  }

  // Handle categories (can be single or multiple)
  const categoryList: string[] = [];
  if (category) {
    if (Array.isArray(category)) {
      categoryList.push(...(category as string[]));
    } else {
      categoryList.push(category as string);
    }
  }
  if (categories) {
    if (Array.isArray(categories)) {
      categoryList.push(...(categories as string[]));
    } else {
      categoryList.push(categories as string);
    }
  }
  if (categoryList.length > 0) filters.categories = categoryList;

  // Handle brands
  const brandList: string[] = [];
  if (brand) {
    if (Array.isArray(brand)) {
      brandList.push(...(brand as string[]));
    } else {
      brandList.push(brand as string);
    }
  }
  if (brands) {
    if (Array.isArray(brands)) {
      brandList.push(...(brands as string[]));
    } else {
      brandList.push(brands as string);
    }
  }
  if (brandList.length > 0) filters.brands = brandList;

  return {
    q: String(q).trim(),
    page: Math.max(1, Number(page)),
    limit: Math.min(Math.max(1, Number(limit)), 60), // Cap at 60 items per page
    sort: String(sort),
    filters,
  };
}

/**
 * Build Meilisearch filter string from filters object
 */
function buildFilterString(filters: SearchFilters): string {
  const filterParts: string[] = ["approved = true", "published = true"];

  if (filters.vendor_id) {
    filterParts.push(`vendor_id = "${filters.vendor_id}"`);
  }

  if (filters.currency) {
    filterParts.push(`currency = "${filters.currency}"`);
  }

  if (filters.in_stock !== undefined) {
    filterParts.push(`in_stock = ${filters.in_stock}`);
  }

  if (filters.price_min !== undefined) {
    const priceMinFilter = `price_cents >= ${filters.price_min}`;
    filterParts.push(priceMinFilter);
    console.log(`🔍 Added price min filter: ${priceMinFilter}`);
  }

  if (filters.price_max !== undefined) {
    const priceMaxFilter = `price_cents <= ${filters.price_max}`;
    filterParts.push(priceMaxFilter);
    console.log(
      `🔍 Added price max filter: ${priceMaxFilter} (input was ${filters.price_max / 100} CFA)`
    );
  }

  if (filters.categories && filters.categories.length > 0) {
    const categoryFilters = filters.categories.map((c) => `categories = "${c}"`);
    filterParts.push(`(${categoryFilters.join(" OR ")})`);
  }

  if (filters.brands && filters.brands.length > 0) {
    const brandFilters = filters.brands.map((b) => `brand = "${b}"`);
    filterParts.push(`(${brandFilters.join(" OR ")})`);
  }

  return filterParts.join(" AND ");
}

/**
 * Main search endpoint
 */
export async function searchProducts(req: Request, res: Response) {
  try {
    // Check if Meilisearch is configured before trying to use it
    if (
      !process.env.MEILI_HOST ||
      (!process.env.MEILI_MASTER_KEY && !process.env.MEILI_SEARCH_KEY)
    ) {
      console.log("⚠️ Meilisearch not configured, using database fallback");
      const { databaseSearch } = await import("./search-fallback");
      return await databaseSearch(req, res);
    }

    const params = parseSearchParams(req);

    // Create cache key from search parameters
    const cacheKey = `search:${JSON.stringify(params)}`;

    // Try to get from cache first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      console.log(`🎯 Search cache HIT for: ${params.q || "empty query"}`);
      res.setHeader("X-Cache", "HIT");
      return res.json(cachedResult);
    }

    const index = getIndex();

    // Test connection before searching
    try {
      await getClient().health();
    } catch (connectionError) {
      console.error(
        "❌ Meilisearch connection failed, falling back to database:",
        connectionError instanceof Error ? connectionError.message : "Connection error"
      );
      const { databaseSearch } = await import("./search-fallback");
      return await databaseSearch(req, res);
    }

    // Expand the search query with synonyms
    const expandedQuery = expandSearchQuery(params.q || "");

    const filterString = buildFilterString(params.filters || {});

    const searchParams: any = {
      filter: filterString,
      sort: [params.sort],
      attributesToHighlight: ["title", "description", "brand"],
      hitsPerPage: params.limit,
      page: params.page,
      facets: ["vendor_name", "categories", "brand", "currency", "in_stock"],
    };

    // Perform the search with already expanded query
    const result = await index.search(expandedQuery, searchParams);

    // Transform result to match our SearchResult interface
    const searchResult: SearchResult = {
      hits: result.hits as any[],
      query: params.q || "",
      processingTimeMs: result.processingTimeMs || 0,
      hitsPerPage: result.hitsPerPage || params.limit || 24,
      page: result.page || params.page || 1,
      totalPages: result.totalPages || 0,
      totalHits: result.totalHits || 0,
      facetDistribution: result.facetDistribution,
    };

    // Cache the result for 10 minutes
    console.log(`💨 Search cache MISS for: ${params.q || "empty query"}, caching result`);
    await cacheService.set(cacheKey, searchResult, 600); // 10 minutes TTL
    res.setHeader("X-Cache", "MISS");

    res.json(searchResult);
  } catch (error) {
    console.error("❌ Meilisearch search error, falling back to database:", error);
    try {
      const { databaseSearch } = await import("./search-fallback");
      return await databaseSearch(req, res);
    } catch (fallbackError) {
      console.error("❌ Database fallback also failed:", fallbackError);
      res.status(500).json({
        error: "Search temporarily unavailable",
        message: "Both Meilisearch and database search failed",
      });
    }
  }
}

/**
 * Autocomplete endpoint for search suggestions
 */
export async function autocomplete(req: Request, res: Response) {
  try {
    // Check if Meilisearch is configured
    if (!process.env.MEILI_HOST && !process.env.MEILI_MASTER_KEY && !process.env.MEILI_SEARCH_KEY) {
      console.log("⚠️ Meilisearch not configured, using database autocomplete");
      const { databaseAutocomplete } = await import("./search-fallback");
      return await databaseAutocomplete(req, res);
    }

    const { q = "" } = req.query;
    const query = String(q).trim();

    if (!query || query.length < 2) {
      return res.json({ suggestions: [], query, processingTimeMs: 0 });
    }

    // Create cache key for autocomplete
    const cacheKey = `autocomplete:${query.toLowerCase()}`;

    // Try to get from cache first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      console.log(`🎯 Autocomplete cache HIT for: ${query}`);
      res.setHeader("X-Cache", "HIT");
      return res.json(cachedResult);
    }

    const index = getIndex();
    const expandedQuery = expandSearchQuery(query);

    console.log(`🔍 Autocomplete: "${query}" → "${expandedQuery}"`);

    const result = await index.search(expandedQuery, {
      limit: 20, // Increased from 8 to get more results
      filter: "approved = true AND published = true",
      attributesToRetrieve: ["id", "title", "brand", "categories"],
      attributesToHighlight: ["title"],
    });

    // Extract unique suggestions from the results
    // Include both exact matches and partial matches
    const suggestions = Array.from(
      new Set(result.hits.map((hit: any) => hit.title).filter(Boolean))
    ).slice(0, 12); // Return up to 12 suggestions

    console.log(`✅ Autocomplete found ${suggestions.length} suggestions for "${query}"`);

    const autocompleteResult = {
      suggestions,
      query,
      processingTimeMs: result.processingTimeMs,
    };

    // Cache the result for 5 minutes (shorter than search results since autocomplete changes more frequently)
    console.log(`💨 Autocomplete cache MISS for: ${query}, caching result`);
    await cacheService.set(cacheKey, autocompleteResult, 300); // 5 minutes TTL
    res.setHeader("X-Cache", "MISS");

    res.json(autocompleteResult);
  } catch (error) {
    console.error("❌ Autocomplete error:", error);
    res.status(500).json({
      suggestions: [],
      query: req.query.q || "",
      processingTimeMs: 0,
    });
  }
}
