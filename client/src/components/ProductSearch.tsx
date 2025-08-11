import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SearchWithSuggestions from "@/components/SearchWithSuggestions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";

interface ProductSearchProps {
  searchTerm: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSearchChange: (term: string) => void;
  categories: any[];
  selectedCategory: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCategoryChange: (category: string) => void;
  filters: {
    minPrice: number;
    maxPrice: number;
    inStock: boolean;
    sortBy: string;
    sortOrder: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onFiltersChange: (filters: any) => void;
}

export default function ProductSearch({
  searchTerm,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
  filters,
  onFiltersChange,
}: ProductSearchProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [priceRange, setPriceRange] = useState([filters.minPrice, filters.maxPrice]);

  const handleApplyFilters = () => {
    onFiltersChange({
      ...localFilters,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
    });
  };

  const handleClearFilters = () => {
    const defaultFilters = {
      minPrice: 0,
      maxPrice: 1000000,
      inStock: false,
      sortBy: "createdAt",
      sortOrder: "desc",
    };
    setLocalFilters(defaultFilters);
    setPriceRange([0, 1000000]);
    onFiltersChange(defaultFilters);
    onCategoryChange("");
    onSearchChange("");
  };

  const activeFiltersCount = [
    selectedCategory,
    filters.minPrice > 0,
    filters.maxPrice < 1000000,
    filters.inStock,
    filters.sortBy !== "createdAt",
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Enhanced Search Bar with Suggestions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchWithSuggestions
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          className="flex-1"
        />

        {/* Quick Category Filter */}
        <Select
          value={selectedCategory || "all"}
          onValueChange={(value) => onCategoryChange(value === "all" ? "" : value)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Toutes catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {categories?.map((category: any) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters Button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <i className="fas fa-filter mr-2"></i>
              Filtres
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-zaka-orange text-white text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle className="flex items-center">
                <i className="fas fa-sliders-h mr-2 text-zaka-orange"></i>
                Filtres avancés
              </SheetTitle>
              <SheetDescription>
                Affinez votre recherche avec des filtres détaillés
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 py-6">
              {/* Price Range */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <i className="fas fa-tags mr-2 text-green-600"></i>
                    Fourchette de prix
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Prix minimum</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={priceRange[0]}
                        onChange={(e) =>
                          setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Prix maximum</label>
                      <Input
                        type="number"
                        placeholder="1000000"
                        value={priceRange[1]}
                        onChange={(e) =>
                          setPriceRange([priceRange[0], parseInt(e.target.value) || 1000000])
                        }
                      />
                    </div>
                  </div>
                  <div className="text-center text-sm text-gray-600">
                    {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} CFA
                  </div>
                </CardContent>
              </Card>

              {/* Availability */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <i className="fas fa-boxes mr-2 text-blue-600"></i>
                    Disponibilité
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inStock"
                      checked={localFilters.inStock}
                      onCheckedChange={(checked) =>
                        setLocalFilters({ ...localFilters, inStock: !!checked })
                      }
                    />
                    <label htmlFor="inStock" className="text-sm">
                      Seulement les produits en stock
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Sort Options */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <i className="fas fa-sort mr-2 text-purple-600"></i>
                    Trier par
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select
                    value={localFilters.sortBy}
                    onValueChange={(value) => setLocalFilters({ ...localFilters, sortBy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Plus récent</SelectItem>
                      <SelectItem value="price">Prix</SelectItem>
                      <SelectItem value="name">Nom</SelectItem>
                      <SelectItem value="rating">Note</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={localFilters.sortOrder}
                    onValueChange={(value) =>
                      setLocalFilters({ ...localFilters, sortOrder: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">
                        {localFilters.sortBy === "price" ? "Prix décroissant" : "Décroissant"}
                      </SelectItem>
                      <SelectItem value="asc">
                        {localFilters.sortBy === "price" ? "Prix croissant" : "Croissant"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleApplyFilters}
                  className="flex-1 bg-zaka-green hover:bg-zaka-green"
                >
                  <i className="fas fa-check mr-2"></i>
                  Appliquer
                </Button>
                <Button variant="outline" onClick={handleClearFilters} className="flex-1">
                  <i className="fas fa-times mr-2"></i>
                  Réinitialiser
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Filtres actifs:</span>

          {selectedCategory && (
            <Badge variant="outline" className="flex items-center gap-1">
              {categories.find((c) => c.id === selectedCategory)?.name}
              <button onClick={() => onCategoryChange("")} className="ml-1 hover:text-red-500">
                <i className="fas fa-times text-xs"></i>
              </button>
            </Badge>
          )}

          {filters.minPrice > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              Prix min: {filters.minPrice.toLocaleString()} CFA
              <button
                onClick={() => onFiltersChange({ ...filters, minPrice: 0 })}
                className="ml-1 hover:text-red-500"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </Badge>
          )}

          {filters.maxPrice < 1000000 && (
            <Badge variant="outline" className="flex items-center gap-1">
              Prix max: {filters.maxPrice.toLocaleString()} CFA
              <button
                onClick={() => onFiltersChange({ ...filters, maxPrice: 1000000 })}
                className="ml-1 hover:text-red-500"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </Badge>
          )}

          {filters.inStock && (
            <Badge variant="outline" className="flex items-center gap-1">
              En stock seulement
              <button
                onClick={() => onFiltersChange({ ...filters, inStock: false })}
                className="ml-1 hover:text-red-500"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-red-500 hover:text-red-700"
          >
            <i className="fas fa-times-circle mr-1"></i>
            Tout effacer
          </Button>
        </div>
      )}
    </div>
  );
}
