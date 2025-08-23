/**
 * Search synonym mapping for French/English terms
 * Maps French terms to their English equivalents for better search results
 */

export const searchSynonyms: Record<string, string[]> = {
  // Telephone terms
  tel: ["phone", "telephone", "mobile", "smartphone", "iphone", "samsung", "android", "cellular"],
  tél: ["phone", "telephone", "mobile", "smartphone", "iphone", "samsung", "android", "cellular"],
  téléphone: ["phone", "telephone", "mobile", "smartphone", "iphone", "samsung", "android", "cellular"],
  telephone: ["phone", "mobile", "smartphone", "iphone", "samsung", "android", "cellular"],
  téléphones: ["phones", "telephone", "mobile", "smartphone", "iphone", "samsung", "android"],
  portable: ["mobile", "phone", "smartphone", "iphone", "samsung", "android", "cellular"],
  portables: ["mobiles", "phones", "smartphones", "iphone", "samsung", "android"],
  mobile: ["phone", "smartphone", "iphone", "samsung", "android", "cellular"],
  cellulaire: ["cellular", "mobile", "phone", "smartphone"],

  // Computer terms
  ordinateur: ["computer", "laptop", "pc", "mac", "desktop"],
  pc: ["computer", "laptop", "desktop"],
  ordi: ["computer", "laptop", "pc", "mac"],

  // Electronics
  électronique: ["electronic", "electronics", "tech", "technology"],
  électroniques: ["electronic", "electronics", "tech", "technology"],
  technologie: ["technology", "tech", "electronic"],

  // Clothing
  vêtement: ["clothing", "clothes", "apparel", "fashion", "jean", "jeans", "shirt", "dress", "pants"],
  vêtements: ["clothing", "clothes", "apparel", "fashion", "jean", "jeans", "shirt", "dress", "pants"],
  clothing: ["vêtements", "clothes", "apparel", "jean", "jeans", "shirt", "dress", "pants", "tshirt"],
  clothes: ["vêtements", "clothing", "apparel", "jean", "jeans", "shirt", "dress", "pants"],
  habit: ["clothing", "clothes", "apparel", "jean", "jeans"],
  habits: ["clothing", "clothes", "apparel", "jean", "jeans"],
  mode: ["fashion", "clothing", "clothes", "style"],

  // Home
  maison: ["home", "house", "household"],
  domestique: ["home", "household", "domestic"],

  // Beauty
  beauté: ["beauty", "cosmetic", "cosmetics", "makeup"],
  cosmétique: ["cosmetic", "beauty", "makeup"],
  maquillage: ["makeup", "cosmetic", "beauty"],

  // Sports
  sport: ["sports", "fitness", "exercise", "athletic"],
  fitness: ["sports", "exercise", "gym", "workout"],

  // Books
  livre: ["book", "books", "reading"],
  livres: ["book", "books", "reading"],
  lecture: ["reading", "book", "books"],

  // Cars
  voiture: ["car", "auto", "vehicle", "automobile"],
  auto: ["car", "vehicle", "automobile"],
  véhicule: ["vehicle", "car", "auto"],

  // Common search terms that need expansion
  phone: ["telephone", "mobile", "smartphone", "iphone", "samsung", "android"],
  phones: ["telephone", "mobile", "smartphone", "iphone", "samsung", "android"],
  
  // Common brand expansions
  samsung: ["galaxy", "smartphone", "phone", "mobile", "telephone"],
  apple: ["iphone", "ipad", "mac", "macbook", "phone"],
  iphone: ["apple", "phone", "smartphone", "mobile", "telephone"],
  nike: ["shoes", "sneakers", "sportswear", "chaussures"],
  adidas: ["shoes", "sneakers", "sportswear", "chaussures"],
};

/**
 * Expand a search query with synonyms
 */
export function expandSearchQuery(query: string): string {
  if (!query || query.length < 1) {
    return query;
  }

  const terms = query.toLowerCase().trim().split(/\s+/);
  const expandedTerms: string[] = [];

  for (const term of terms) {
    // Always include the original term
    expandedTerms.push(term);

    // Add exact match synonyms
    if (searchSynonyms[term]) {
      expandedTerms.push(...searchSynonyms[term]);
      console.log(`✅ Expanded "${term}" to: ${searchSynonyms[term].join(", ")}`);
    }

    // Handle partial matches for longer terms (minimum 3 chars)
    if (term.length >= 3) {
      for (const [synonym, expansions] of Object.entries(searchSynonyms)) {
        if (synonym.length >= 3 && synonym !== term && (term.includes(synonym) || synonym.includes(term))) {
          expandedTerms.push(...expansions);
          console.log(`✅ Partial match "${term}" with "${synonym}" added: ${expansions.slice(0, 3).join(", ")}...`);
        }
      }
    }
  }

  // Remove duplicates and return
  const uniqueTerms = [...new Set(expandedTerms)];
  const expandedQuery = uniqueTerms.join(" ");
  
  console.log(`🔄 Query expansion: "${query}" → "${expandedQuery}" (${uniqueTerms.length} terms)`);
  
  return expandedQuery;
}

/**
 * Get search suggestions for a partial query
 */
export function getSearchSuggestions(partialQuery: string): string[] {
  if (!partialQuery || partialQuery.length < 2) {
    return [];
  }

  const query = partialQuery.toLowerCase();
  const suggestions: string[] = [];

  // Find synonyms that start with the query
  for (const [synonym, expansions] of Object.entries(searchSynonyms)) {
    if (synonym.startsWith(query)) {
      suggestions.push(synonym);
      suggestions.push(...expansions.slice(0, 3)); // Add first 3 expansions
    }
  }

  return [...new Set(suggestions)].slice(0, 10); // Return max 10 unique suggestions
}
