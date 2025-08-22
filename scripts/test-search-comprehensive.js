#!/usr/bin/env node

/**
 * Comprehensive search integration test with typo tolerance
 * Tests both Meilisearch directly and the API layer
 */

const { MeiliSearch } = require("meilisearch");
const fetch = require('node-fetch');

// Test configuration
const MEILI_HOST = process.env.MEILI_HOST || "http://localhost:7700";
const MEILI_KEY = process.env.MEILI_MASTER_KEY || "development_master_key_for_local";
const API_BASE = process.env.API_BASE || "http://localhost:5000";

// Test data for typo tolerance
const TYPO_TEST_CASES = [
  { correct: "phone", typos: ["phon", "hone", "phoen", "fone"] },
  { correct: "laptop", typos: ["laptpo", "latop", "lpatop", "laptp"] },
  { correct: "android", typos: ["andriod", "andorid", "androyd", "anroid"] },
  { correct: "iphone", typos: ["iphon", "iphone", "iphne", "ifone"] },
  { correct: "samsung", typos: ["samsng", "samsugn", "samsyng", "smasung"] },
  { correct: "headphones", typos: ["headphons", "hadphones", "headpones", "hedphones"] }
];

// Performance test queries
const PERFORMANCE_QUERIES = [
  "phone mobile smartphone",
  "laptop computer portable",
  "tablet ipad android",
  "camera photo video",
  "gaming console ps5 xbox",
  "audio speaker bluetooth",
  "watch smartwatch fitness",
  "accessories cable charger"
];

class SearchTester {
  constructor() {
    this.client = new MeiliSearch({
      host: MEILI_HOST,
      apiKey: MEILI_KEY,
    });
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefixes = {
      info: '🔍',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      performance: '⚡'
    };
    console.log(`${prefixes[type]} [${timestamp}] ${message}`);
  }

  async runTest(testName, testFn) {
    this.results.total++;
    try {
      const result = await testFn();
      this.results.passed++;
      this.results.tests.push({ name: testName, status: 'passed', result });
      this.log(`${testName} - PASSED`, 'success');
      return result;
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name: testName, status: 'failed', error: error.message });
      this.log(`${testName} - FAILED: ${error.message}`, 'error');
      throw error;
    }
  }

  async testConnection() {
    return this.runTest('Meilisearch Connection', async () => {
      const health = await this.client.health();
      if (health.status !== 'available') {
        throw new Error(`Meilisearch not available: ${health.status}`);
      }
      return { status: health.status };
    });
  }

  async testIndexStats() {
    return this.runTest('Index Statistics', async () => {
      const index = this.client.index("products");
      const stats = await index.getStats();
      
      this.log(`Documents: ${stats.numberOfDocuments}, Indexing: ${stats.isIndexing}`);
      
      if (stats.numberOfDocuments === 0) {
        this.log('Warning: No documents in index', 'warning');
      }

      return {
        documents: stats.numberOfDocuments,
        isIndexing: stats.isIndexing,
        fieldCount: Object.keys(stats.fieldDistribution || {}).length
      };
    });
  }

  async testBasicSearch() {
    return this.runTest('Basic Search Functionality', async () => {
      const index = this.client.index("products");
      const result = await index.search("phone", {
        limit: 5,
        filter: "approved = true AND published = true",
        attributesToHighlight: ["title", "brand"],
      });

      if (result.totalHits === 0) {
        this.log('Warning: No results for "phone" query', 'warning');
      }

      return {
        totalHits: result.totalHits,
        processingTime: result.processingTimeMs,
        resultsCount: result.hits.length
      };
    });
  }

  async testTypoTolerance() {
    const results = [];
    
    for (const testCase of TYPO_TEST_CASES) {
      const testName = `Typo Tolerance: ${testCase.correct}`;
      try {
        const result = await this.runTest(testName, async () => {
          const index = this.client.index("products");
          
          // Get correct spelling results
          const correctResult = await index.search(testCase.correct, {
            limit: 10,
            filter: "approved = true AND published = true",
          });

          const typoResults = [];
          
          // Test each typo
          for (const typo of testCase.typos) {
            const typoResult = await index.search(typo, {
              limit: 10,
              filter: "approved = true AND published = true",
            });
            
            typoResults.push({
              typo,
              hits: typoResult.totalHits,
              processingTime: typoResult.processingTimeMs
            });
          }

          // Calculate typo tolerance effectiveness
          const correctHits = correctResult.totalHits;
          const avgTypoHits = typoResults.reduce((sum, r) => sum + r.hits, 0) / typoResults.length;
          const tolerance = correctHits > 0 ? (avgTypoHits / correctHits) * 100 : 0;

          return {
            correct: { query: testCase.correct, hits: correctHits },
            typos: typoResults,
            tolerancePercent: Math.round(tolerance)
          };
        });

        results.push(result);
      } catch (error) {
        results.push({ error: error.message });
      }
    }

    // Summary
    const avgTolerance = results
      .filter(r => r.tolerancePercent !== undefined)
      .reduce((sum, r) => sum + r.tolerancePercent, 0) / results.length;

    this.log(`Average typo tolerance: ${Math.round(avgTolerance)}%`, 'info');

    return results;
  }

  async testFacetedSearch() {
    return this.runTest('Faceted Search', async () => {
      const index = this.client.index("products");
      const result = await index.search("", {
        limit: 0,
        filter: "approved = true AND published = true",
        facets: ["categories", "brand", "vendor_name", "currency", "in_stock"],
      });

      const facets = result.facetDistribution || {};
      const facetSummary = {};

      Object.entries(facets).forEach(([facet, values]) => {
        facetSummary[facet] = {
          valueCount: Object.keys(values).length,
          totalItems: Object.values(values).reduce((sum, count) => sum + count, 0)
        };
      });

      return {
        facetCount: Object.keys(facets).length,
        facets: facetSummary,
        processingTime: result.processingTimeMs
      };
    });
  }

  async testSearchPerformance() {
    return this.runTest('Search Performance', async () => {
      const index = this.client.index("products");
      const performanceResults = [];

      for (const query of PERFORMANCE_QUERIES) {
        const startTime = Date.now();
        const result = await index.search(query, {
          limit: 20,
          filter: "approved = true AND published = true",
          attributesToHighlight: ["title", "brand", "description"],
        });
        const endTime = Date.now();

        performanceResults.push({
          query,
          hits: result.totalHits,
          processingTime: result.processingTimeMs,
          totalTime: endTime - startTime
        });
      }

      const avgProcessingTime = performanceResults.reduce(
        (sum, r) => sum + r.processingTime, 0
      ) / performanceResults.length;

      const avgTotalTime = performanceResults.reduce(
        (sum, r) => sum + r.totalTime, 0
      ) / performanceResults.length;

      this.log(`Average processing time: ${Math.round(avgProcessingTime)}ms`, 'performance');
      this.log(`Average total time: ${Math.round(avgTotalTime)}ms`, 'performance');

      return {
        queries: performanceResults,
        avgProcessingTime: Math.round(avgProcessingTime),
        avgTotalTime: Math.round(avgTotalTime)
      };
    });
  }

  async testAPIIntegration() {
    return this.runTest('API Integration', async () => {
      // Test basic API search
      const response = await fetch(`${API_BASE}/api/search?q=phone&limit=5`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      // Validate API response structure
      const requiredFields = ['hits', 'totalHits', 'processingTimeMs'];
      for (const field of requiredFields) {
        if (!(field in data)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Test faceted API search
      const facetResponse = await fetch(`${API_BASE}/api/search?limit=0&facets=categories,brand`);
      const facetData = await facetResponse.json();

      return {
        basicSearch: {
          hits: data.hits.length,
          totalHits: data.totalHits,
          processingTime: data.processingTimeMs
        },
        facetedSearch: {
          facetCount: Object.keys(facetData.facetDistribution || {}).length,
          processingTime: facetData.processingTimeMs
        }
      };
    });
  }

  async testVendorFiltering() {
    return this.runTest('Vendor Filtering', async () => {
      // First, get a vendor ID from search results
      const response = await fetch(`${API_BASE}/api/search?q=phone&limit=5`);
      const data = await response.json();

      if (data.hits.length === 0 || !data.hits[0].vendor_id) {
        throw new Error('No products with vendor_id found');
      }

      const vendorId = data.hits[0].vendor_id;

      // Test vendor-specific search
      const vendorResponse = await fetch(`${API_BASE}/api/search?vendor_id=${vendorId}&limit=10`);
      const vendorData = await vendorResponse.json();

      // Verify all results are from the same vendor
      const allSameVendor = vendorData.hits.every(hit => hit.vendor_id === vendorId);

      if (!allSameVendor) {
        throw new Error('Vendor filtering not working correctly');
      }

      return {
        vendorId,
        filteredResults: vendorData.hits.length,
        allFromSameVendor: allSameVendor
      };
    });
  }

  async runAllTests() {
    this.log('Starting comprehensive search tests...', 'info');
    this.log(`Meilisearch: ${MEILI_HOST}`, 'info');
    this.log(`API Base: ${API_BASE}`, 'info');

    try {
      await this.testConnection();
      await this.testIndexStats();
      await this.testBasicSearch();
      await this.testTypoTolerance();
      await this.testFacetedSearch();
      await this.testSearchPerformance();
      await this.testAPIIntegration();
      await this.testVendorFiltering();

      this.log('All tests completed!', 'success');
      this.printSummary();

    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error');
      this.printSummary();
      throw error;
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('🔍 SEARCH TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`Success rate: ${Math.round((this.results.passed / this.results.total) * 100)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed tests:');
      this.results.tests
        .filter(t => t.status === 'failed')
        .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
    }

    console.log('='.repeat(50));
  }
}

async function main() {
  const tester = new SearchTester();
  
  try {
    await tester.runAllTests();
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Test suite failed with errors');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { SearchTester };