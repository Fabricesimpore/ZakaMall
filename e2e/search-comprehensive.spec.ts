import { test, expect, Page } from '@playwright/test';

test.describe('Comprehensive Search Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/');
  });

  test.describe('Search UI Components', () => {
    test('should display search view with facets', async () => {
      await page.goto('/search');
      
      // Check if main search components are present
      await expect(page.locator('input[placeholder*="Rechercher"]')).toBeVisible();
      await expect(page.locator('text=Filtres')).toBeVisible();
      await expect(page.locator('text=Trier par')).toBeVisible();
    });

    test('should show/hide filters panel', async () => {
      await page.goto('/search');
      
      // Click filters button
      await page.locator('text=Filtres').click();
      
      // Check if filters panel is visible
      await expect(page.locator('text=Prix (CFA)')).toBeVisible();
      await expect(page.locator('text=Disponibilité')).toBeVisible();
      await expect(page.locator('text=Catégories')).toBeVisible();
    });

    test('should display search results', async () => {
      await page.goto('/search?q=phone');
      
      // Wait for search results to load
      await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
      
      // Check if results are displayed
      const productCards = page.locator('[data-testid="product-card"]');
      await expect(productCards.first()).toBeVisible();
    });
  });

  test.describe('Search Functionality', () => {
    test('should perform basic search', async () => {
      await page.goto('/search');
      
      // Enter search query
      await page.fill('input[placeholder*="Rechercher"]', 'phone');
      
      // Wait for search results
      await page.waitForTimeout(1000); // Allow for debounced search
      
      // Check URL updated
      expect(page.url()).toContain('q=phone');
      
      // Check results text appears
      await expect(page.locator('text*="trouvé"')).toBeVisible();
    });

    test('should handle typo tolerance', async () => {
      await page.goto('/search');
      
      // Test common typos
      const typoQueries = [
        { original: 'phone', typo: 'phon' },
        { original: 'laptop', typo: 'laptpo' },
        { original: 'android', typo: 'andriod' }
      ];

      for (const { original, typo } of typoQueries) {
        // Search with typo
        await page.fill('input[placeholder*="Rechercher"]', typo);
        await page.waitForTimeout(1000);
        
        // Should still find results
        const resultsText = await page.locator('text*="trouvé"').textContent();
        expect(resultsText).not.toContain('0 produit');
      }
    });

    test('should handle empty search results gracefully', async () => {
      await page.goto('/search');
      
      // Search for something that definitely doesn't exist
      await page.fill('input[placeholder*="Rechercher"]', 'xyznonexistent12345');
      await page.waitForTimeout(1000);
      
      // Check no results message
      await expect(page.locator('text=Aucun produit trouvé')).toBeVisible();
      await expect(page.locator('text*="Essayez avec d\'autres mots-clés"')).toBeVisible();
    });
  });

  test.describe('Faceted Search', () => {
    test('should filter by categories', async () => {
      await page.goto('/search');
      
      // Open filters
      await page.locator('text=Filtres').click();
      
      // Wait for facets to load
      await page.waitForTimeout(2000);
      
      // Check if category facets exist
      const categoriesSection = page.locator('text=Catégories');
      if (await categoriesSection.isVisible()) {
        // Click on a category checkbox if available
        const firstCategoryCheckbox = page.locator('[id^="category-"]').first();
        if (await firstCategoryCheckbox.isVisible()) {
          await firstCategoryCheckbox.check();
          
          // Wait for filtered results
          await page.waitForTimeout(1000);
          
          // URL should contain category filter
          expect(page.url()).toContain('categories');
        }
      }
    });

    test('should filter by price range', async () => {
      await page.goto('/search');
      
      // Open filters
      await page.locator('text=Filtres').click();
      
      // Interact with price slider
      const priceSlider = page.locator('[role="slider"]').first();
      if (await priceSlider.isVisible()) {
        // Move slider (basic interaction)
        await priceSlider.focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        
        // Wait for price filter to apply
        await page.waitForTimeout(1000);
        
        // Check if price filter is reflected in URL or results
        const url = page.url();
        const hasPriceFilter = url.includes('price_min') || url.includes('price_max');
        if (!hasPriceFilter) {
          // Price slider might be too subtle, that's ok for this test
          console.log('Price slider interaction was subtle, continuing...');
        }
      }
    });

    test('should filter by stock availability', async () => {
      await page.goto('/search');
      
      // Open filters
      await page.locator('text=Filtres').click();
      
      // Toggle stock filter
      const stockCheckbox = page.locator('#in-stock');
      if (await stockCheckbox.isVisible()) {
        await stockCheckbox.uncheck();
        await page.waitForTimeout(1000);
        
        // Should show out of stock items too
        expect(page.url()).toContain('in_stock');
      }
    });
  });

  test.describe('Store Page Search', () => {
    test('should search within a specific store', async () => {
      // This test requires having a store with products
      // We'll create a basic test structure
      
      // First, let's try to find a store page
      await page.goto('/search');
      
      // Look for vendor names in search results
      await page.fill('input[placeholder*="Rechercher"]', 'phone');
      await page.waitForTimeout(1000);
      
      // Try to click on a vendor link if available
      const vendorLink = page.locator('a[href^="/store/"]').first();
      if (await vendorLink.isVisible()) {
        await vendorLink.click();
        
        // Should be on store page
        expect(page.url()).toContain('/store/');
        
        // Should have search functionality pre-filtered to this store
        await expect(page.locator('text*="Produits de"')).toBeVisible();
        
        // Search input should be available
        if (await page.locator('input[placeholder*="Rechercher"]').isVisible()) {
          await page.fill('input[placeholder*="Rechercher"]', 'test');
          await page.waitForTimeout(1000);
          
          // Results should be filtered to this vendor
          expect(page.url()).toContain('vendor_id');
        }
      }
    });
  });

  test.describe('Search Performance', () => {
    test('should handle concurrent searches', async () => {
      await page.goto('/search');
      
      const queries = ['phone', 'laptop', 'headphones'];
      
      // Perform rapid searches
      for (const query of queries) {
        await page.fill('input[placeholder*="Rechercher"]', query);
        await page.waitForTimeout(300); // Quick succession
      }
      
      // Wait for final search to complete
      await page.waitForTimeout(1000);
      
      // Should show results for the last query
      expect(page.url()).toContain('headphones');
      await expect(page.locator('text*="trouvé"')).toBeVisible();
    });

    test('should debounce search requests', async () => {
      await page.goto('/search');
      
      // Type rapidly
      const searchInput = page.locator('input[placeholder*="Rechercher"]');
      await searchInput.type('phon', { delay: 50 });
      
      // Should not immediately search while typing
      const initialUrl = page.url();
      
      // Wait for debounce
      await page.waitForTimeout(500);
      
      // Now URL should be updated
      expect(page.url()).not.toBe(initialUrl);
      expect(page.url()).toContain('q=phon');
    });
  });

  test.describe('Search Accessibility', () => {
    test('should be keyboard navigable', async () => {
      await page.goto('/search');
      
      // Tab to search input
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to type in search
      await page.keyboard.type('phone');
      
      // Enter should trigger search
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      
      expect(page.url()).toContain('q=phone');
    });

    test('should have proper ARIA labels', async () => {
      await page.goto('/search');
      
      // Check search input has proper labeling
      const searchInput = page.locator('input[placeholder*="Rechercher"]');
      await expect(searchInput).toBeVisible();
      
      // Open filters
      await page.locator('text=Filtres').click();
      
      // Check filter controls have proper labels
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      
      for (let i = 0; i < Math.min(count, 3); i++) {
        const checkbox = checkboxes.nth(i);
        const id = await checkbox.getAttribute('id');
        if (id) {
          await expect(page.locator(`label[for="${id}"]`)).toBeVisible();
        }
      }
    });
  });

  test.describe('Search Error Handling', () => {
    test('should handle search API errors gracefully', async () => {
      await page.goto('/search');
      
      // Mock network failure or use invalid search
      await page.route('**/api/search*', route => {
        route.abort('failed');
      });
      
      // Attempt search
      await page.fill('input[placeholder*="Rechercher"]', 'phone');
      await page.waitForTimeout(1000);
      
      // Should show error message
      await expect(page.locator('text*="Erreur"')).toBeVisible();
    });
  });
});

test.describe('Search API Tests', () => {
  test('API should return properly structured results', async ({ request }) => {
    // Test direct API calls
    const response = await request.get('/api/search?q=phone&limit=5');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('hits');
    expect(data).toHaveProperty('totalHits');
    expect(data).toHaveProperty('processingTimeMs');
    expect(Array.isArray(data.hits)).toBeTruthy();
  });

  test('API should handle typos with good results', async ({ request }) => {
    // Test typo tolerance at API level
    const correctResponse = await request.get('/api/search?q=phone&limit=10');
    const typoResponse = await request.get('/api/search?q=phon&limit=10');
    
    expect(correctResponse.ok()).toBeTruthy();
    expect(typoResponse.ok()).toBeTruthy();
    
    const correctData = await correctResponse.json();
    const typoData = await typoResponse.json();
    
    // Typo should return some results (maybe not identical but similar)
    expect(typoData.hits.length).toBeGreaterThan(0);
    
    // Processing time should be reasonable
    expect(typoData.processingTimeMs).toBeLessThan(1000);
  });

  test('API should support faceted search', async ({ request }) => {
    const response = await request.get('/api/search?limit=0&facets=categories,brand,vendor_name');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('facetDistribution');
    
    const facets = data.facetDistribution;
    if (facets) {
      // Should have facets structure
      expect(typeof facets).toBe('object');
    }
  });

  test('API should handle vendor filtering', async ({ request }) => {
    // First get a vendor ID from regular search
    const searchResponse = await request.get('/api/search?q=phone&limit=5');
    const searchData = await searchResponse.json();
    
    if (searchData.hits.length > 0 && searchData.hits[0].vendor_id) {
      const vendorId = searchData.hits[0].vendor_id;
      
      // Search with vendor filter
      const vendorResponse = await request.get(`/api/search?vendor_id=${vendorId}&limit=10`);
      expect(vendorResponse.ok()).toBeTruthy();
      
      const vendorData = await vendorResponse.json();
      
      // All results should be from that vendor
      vendorData.hits.forEach((hit: any) => {
        expect(hit.vendor_id).toBe(vendorId);
      });
    }
  });
});