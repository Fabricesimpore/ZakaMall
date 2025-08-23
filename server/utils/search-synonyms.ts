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
  vêtement: ["clothing", "clothes", "apparel", "fashion"],
  vêtements: ["clothing", "clothes", "apparel", "fashion"],
  habit: ["clothing", "clothes", "apparel"],
  habits: ["clothing", "clothes", "apparel"],

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

  // Common brand expansions
  samsung: ["galaxy", "smartphone", "phone", "mobile"],
  apple: ["iphone", "ipad", "mac", "macbook"],
  nike: ["shoes", "sneakers", "sportswear"],
  adidas: ["shoes", "sneakers", "sportswear"],
};

/**
 * Expand a search query with synonyms
 */
export function expandSearchQuery(query: string): string {
  if (!query || query.length < 2) {
    return query;
  }

  const terms = query.toLowerCase().split(/\s+/);
  const expandedTerms: string[] = [];

  for (const term of terms) {
    expandedTerms.push(term);

    // Add synonyms if they exist
    if (searchSynonyms[term]) {
      expandedTerms.push(...searchSynonyms[term]);
    }

    // Handle partial matches for longer terms
    for (const [synonym, expansions] of Object.entries(searchSynonyms)) {
      if (synonym.length > 3 && term.includes(synonym)) {
        expandedTerms.push(...expansions);
      }
    }
  }

  // Remove duplicates and return
  const uniqueTerms = [...new Set(expandedTerms)];
  return uniqueTerms.join(" ");
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
