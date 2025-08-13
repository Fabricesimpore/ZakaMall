import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Clock, TrendingUp, X } from "lucide-react";
import { debounce } from "lodash";

interface SearchAutocompleteProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

interface SearchSuggestion {
  text: string;
  type: "suggestion" | "popular" | "recent";
}

export default function SearchAutocomplete({ 
  placeholder = "Rechercher des produits...", 
  className = "",
  onSearch 
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("zakamall_recent_searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error("Error loading recent searches:", error);
      }
    }
  }, []);

  // Save recent searches
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updatedSearches = [
      searchQuery,
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, 5); // Keep only last 5 searches
    
    setRecentSearches(updatedSearches);
    localStorage.setItem("zakamall_recent_searches", JSON.stringify(updatedSearches));
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("zakamall_recent_searches");
  };

  // Debounced suggestion fetching
  const debouncedFetchSuggestions = debounce(async (searchQuery: string) => {
    if (searchQuery.length < 2) return;
    // Suggestions will be fetched by the query below
  }, 300);

  // Fetch search suggestions
  const { data: suggestions = [] } = useQuery({
    queryKey: ["/api/search/suggestions", query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const response = await apiRequest("GET", `/api/search/suggestions?q=${encodeURIComponent(query)}`);
      return response.json();
    },
    enabled: query.length >= 2 && showSuggestions,
  });

  // Fetch popular search terms
  const { data: popularTerms = [] } = useQuery({
    queryKey: ["/api/search/popular"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/search/popular");
      return response.json();
    },
    enabled: showSuggestions && query.length === 0,
  });

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedFetchSuggestions(value);
  };

  // Handle search submission
  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;

    saveRecentSearch(finalQuery);
    setShowSuggestions(false);
    
    if (onSearch) {
      onSearch(finalQuery);
    } else {
      setLocation(`/search?q=${encodeURIComponent(finalQuery)}`);
    }
  };

  // Handle key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Combine all suggestions
  const allSuggestions: SearchSuggestion[] = [
    ...suggestions.map((text: string) => ({ text, type: "suggestion" as const })),
    ...(query.length === 0 ? recentSearches.map(text => ({ text, type: "recent" as const })) : []),
    ...(query.length === 0 ? popularTerms.map((term: any) => ({ text: term.term, type: "popular" as const })) : []),
  ];

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setShowSuggestions(false);
              inputRef.current?.focus();
            }}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <Card 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto shadow-lg"
        >
          <CardContent className="p-0">
            {allSuggestions.length > 0 ? (
              <div className="py-2">
                {/* Recent Searches */}
                {query.length === 0 && recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Clock className="w-4 h-4" />
                        Recherches récentes
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearRecentSearches}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Effacer
                      </Button>
                    </div>
                    {recentSearches.map((term, index) => (
                      <button
                        key={`recent-${index}`}
                        onClick={() => handleSearch(term)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                      >
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="flex-1">{term}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Popular Terms */}
                {query.length === 0 && popularTerms.length > 0 && (
                  <div>
                    {recentSearches.length > 0 && <div className="border-b"></div>}
                    <div className="px-4 py-2 border-b">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <TrendingUp className="w-4 h-4" />
                        Recherches populaires
                      </div>
                    </div>
                    {popularTerms.slice(0, 5).map((term: any, index: number) => (
                      <button
                        key={`popular-${index}`}
                        onClick={() => handleSearch(term.term)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                      >
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span className="flex-1">{term.term}</span>
                        <span className="text-xs text-gray-500">({term.count})</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Search Suggestions */}
                {suggestions.length > 0 && (
                  <div>
                    {(recentSearches.length > 0 || popularTerms.length > 0) && (
                      <div className="border-b"></div>
                    )}
                    <div className="px-4 py-2 border-b">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Search className="w-4 h-4" />
                        Suggestions
                      </div>
                    </div>
                    {suggestions.map((suggestion: string, index: number) => (
                      <button
                        key={`suggestion-${index}`}
                        onClick={() => handleSearch(suggestion)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                      >
                        <Search className="w-4 h-4 text-gray-400" />
                        <span className="flex-1">
                          <span 
                            dangerouslySetInnerHTML={{
                              __html: suggestion.replace(
                                new RegExp(`(${query})`, "gi"),
                                "<strong>$1</strong>"
                              )
                            }}
                          />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : query.length >= 2 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Aucune suggestion trouvée</p>
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Tapez au moins 2 caractères pour voir les suggestions</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}