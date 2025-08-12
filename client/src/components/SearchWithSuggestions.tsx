import React, { useState, useRef, useEffect, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SearchSuggestion {
  id: string;
  name: string;
  type: "product" | "category" | "vendor";
  category?: string;
  vendorName?: string;
  price?: string;
  images?: string[];
}

interface SearchWithSuggestionsProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchWithSuggestions({
  searchTerm,
  onSearchChange,
  placeholder = "Rechercher des produits, marques, vendeurs...",
  className = "",
}: SearchWithSuggestionsProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("zakamart_recent_searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch search suggestions
  const { data: suggestions = [], isLoading } = useQuery<SearchSuggestion[]>({
    queryKey: ["/api/search/suggestions", debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm.trim()) return [];
      const response = await fetch(
        `/api/search/suggestions?q=${encodeURIComponent(debouncedSearchTerm)}`
      );
      if (!response.ok) throw new Error("Failed to fetch suggestions");
      return response.json();
    },
    enabled: debouncedSearchTerm.length > 1 && isFocused,
    staleTime: 30000, // Cache for 30 seconds
  });

  const showSuggestions = isFocused && (searchTerm.length > 1 || recentSearches.length > 0);

  const handleSearchSelect = (term: string) => {
    onSearchChange(term);
    setIsFocused(false);

    // Save to recent searches
    const newRecent = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem("zakamart_recent_searches", JSON.stringify(newRecent));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("zakamart_recent_searches");
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "product":
        return "fas fa-cube";
      case "category":
        return "fas fa-tags";
      case "vendor":
        return "fas fa-store";
      default:
        return "fas fa-search";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "product":
        return "Produit";
      case "category":
        return "Catégorie";
      case "vendor":
        return "Vendeur";
      default:
        return "";
    }
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4 py-3"
        />
        <i className="fas fa-search absolute left-3 top-4 text-gray-400"></i>
        {searchTerm && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-4 text-gray-400 hover:text-gray-600"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {showSuggestions && (
        <Card
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto shadow-lg"
        >
          <div className="p-2">
            {/* Recent searches */}
            {searchTerm.length <= 1 && recentSearches.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Recherches récentes</h3>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-gray-500 hover:text-red-500"
                  >
                    Effacer
                  </button>
                </div>
                {recentSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchSelect(term)}
                    className="flex items-center w-full p-2 text-left hover:bg-gray-50 rounded-md"
                  >
                    <i className="fas fa-history text-gray-400 mr-3"></i>
                    <span className="text-sm">{term}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Search suggestions */}
            {searchTerm.length > 1 && (
              <>
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <i className="fas fa-spinner fa-spin text-gray-400 mr-2"></i>
                    <span className="text-sm text-gray-500">Recherche en cours...</span>
                  </div>
                ) : suggestions.length > 0 ? (
                  <>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Suggestions</h3>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearchSelect(suggestion.name)}
                        className="flex items-start w-full p-3 text-left hover:bg-gray-50 rounded-md border-b border-gray-100 last:border-b-0"
                      >
                        <i
                          className={`${getSuggestionIcon(suggestion.type)} text-gray-400 mr-3 mt-1`}
                        ></i>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">{suggestion.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {getTypeLabel(suggestion.type)}
                            </Badge>
                          </div>
                          {suggestion.category && (
                            <p className="text-xs text-gray-500">{suggestion.category}</p>
                          )}
                          {suggestion.vendorName && (
                            <p className="text-xs text-gray-500">par {suggestion.vendorName}</p>
                          )}
                          {suggestion.price && (
                            <p className="text-xs text-zaka-orange font-medium">
                              {parseFloat(suggestion.price).toLocaleString()} CFA
                            </p>
                          )}
                        </div>
                        {suggestion.images && suggestion.images[0] && (
                          <img
                            src={suggestion.images[0]}
                            alt={suggestion.name}
                            className="w-10 h-10 object-cover rounded ml-2"
                          />
                        )}
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-search text-gray-300 text-2xl mb-2"></i>
                    <p className="text-sm text-gray-500">Aucune suggestion trouvée</p>
                    <p className="text-xs text-gray-400 mt-1">Essayez d'autres mots-clés</p>
                  </div>
                )}
              </>
            )}

            {/* Popular searches */}
            {searchTerm.length <= 1 && recentSearches.length === 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Recherches populaires</h3>
                {["téléphone", "électronique", "vêtements", "maison", "beauté"].map(
                  (term, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearchSelect(term)}
                      className="flex items-center w-full p-2 text-left hover:bg-gray-50 rounded-md"
                    >
                      <i className="fas fa-fire text-orange-400 mr-3"></i>
                      <span className="text-sm capitalize">{term}</span>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
