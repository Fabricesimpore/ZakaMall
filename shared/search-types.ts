// Search document types for Meilisearch integration

export interface SearchDoc {
  id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_slug?: string;
  title: string;
  brand?: string;
  categories: string[];
  description: string;
  price_cents: number;
  currency: string;
  images: string[];
  in_stock: boolean;
  stock_qty: number;
  published: boolean;
  approved: boolean;
  created_at: number; // epoch ms for sorting
  updated_at: number;
  popularity_score: number;
  // Additional fields for better search
  search_text?: string; // Combined searchable text
  tags?: string[]; // Additional search tags
}

export interface SearchFilters {
  vendor_id?: string;
  categories?: string[];
  price_min?: number;
  price_max?: number;
  in_stock?: boolean;
  currency?: string;
  brands?: string[];
}

export interface SearchParams {
  q?: string;
  page?: number;
  limit?: number;
  sort?: string;
  filters?: SearchFilters;
}

export interface SearchResult {
  hits: SearchDoc[];
  query: string;
  processingTimeMs: number;
  hitsPerPage: number;
  page: number;
  totalPages: number;
  totalHits: number;
  facetDistribution?: Record<string, Record<string, number>>;
}

export interface AutocompleteResult {
  suggestions: string[];
  query: string;
  processingTimeMs: number;
}