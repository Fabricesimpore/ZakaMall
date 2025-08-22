# Search Testing Documentation

This document describes the comprehensive search testing suite for ZakaMall's Meilisearch-powered search functionality.

## Test Coverage

### 1. Unit/Integration Tests (Node.js)

**File**: `scripts/test-search-comprehensive.js`

**Run**: `npm run test:search`

**Coverage**:
- ✅ Meilisearch connection and health
- ✅ Index statistics and document count
- ✅ Basic search functionality
- ✅ Typo tolerance with 24+ typo variations
- ✅ Faceted search (categories, brands, vendors)
- ✅ Search performance benchmarks
- ✅ API integration tests
- ✅ Vendor-specific filtering

**Typo Test Cases**:
- phone → phon, hone, phoen, fone
- laptop → laptpo, latop, lpatop, laptp
- android → andriod, andorid, androyd, anroid
- iphone → iphon, iphone, iphne, ifone
- samsung → samsng, samsugn, samsyng, smasung
- headphones → headphons, hadphones, headpones, hedphones

### 2. End-to-End Tests (Playwright)

**File**: `e2e/search-comprehensive.spec.ts`

**Run**: `npm run test:search:e2e`

**Coverage**:
- ✅ Search UI components rendering
- ✅ Filter panel show/hide functionality
- ✅ Search result display and pagination
- ✅ Real-time search with debouncing
- ✅ Typo tolerance in the UI
- ✅ Empty state handling
- ✅ Faceted filtering (categories, price, stock)
- ✅ Store page pre-filtered search
- ✅ Concurrent search handling
- ✅ Keyboard navigation and accessibility
- ✅ Error handling and graceful degradation

### 3. Basic Search Test (Legacy)

**File**: `scripts/test-search.js`

**Run**: `npm run test:search:basic`

**Coverage**:
- ✅ Basic Meilisearch connectivity
- ✅ Simple search queries
- ✅ Facet distribution check

## Test Data

### Seed Test Data

**File**: `scripts/seed-search-test-data.js`

**Usage**:
```bash
# Add test data
node scripts/seed-search-test-data.js

# Remove test data  
node scripts/seed-search-test-data.js clean
```

**Test Products**:
- iPhone 15 Pro Max (Apple, TechStore BF)
- Samsung Galaxy S24 Ultra (Samsung, TechStore BF)
- MacBook Pro 16-inch M3 (Apple, Computer World)
- Dell XPS 15 Laptop (Dell, Computer World)
- Sony WH-1000XM5 Headphones (Sony, Audio Experts)
- iPad Pro 12.9-inch (Apple, TechStore BF) - Out of Stock
- Samsung Galaxy Tab S9 Ultra (Samsung, Computer World)

## Search Configuration

The tests verify these Meilisearch settings:

**Searchable Attributes**:
- title, brand, description, categories, vendor_name

**Filterable Attributes**:
- approved, published, in_stock, categories, brand, vendor_id, vendor_name, currency, price_cents

**Ranking Rules**:
1. words
2. typo
3. proximity
4. attribute
5. sort
6. exactness
7. popularity_score:desc

**Typo Tolerance**:
- Enabled with 1 typo for words ≥3 chars
- 2 typos for words ≥7 chars
- Disabled on brand names for accuracy

## Running Tests

### Prerequisites

1. **Meilisearch running**:
   ```bash
   docker-compose -f docker-compose.meili.yml up -d
   ```

2. **Application server** (for API tests):
   ```bash
   npm run dev
   ```

### Full Test Suite

```bash
# Run all search tests
npm run test:search           # Comprehensive unit/integration tests
npm run test:search:e2e       # End-to-end UI tests  
npm run test:search:basic     # Basic connectivity test

# Seed test data first (recommended)
node scripts/seed-search-test-data.js
```

### Individual Test Categories

```bash
# Only UI tests
npm run test:search:e2e -- --grep "Search UI Components"

# Only typo tolerance tests  
npm run test:search:e2e -- --grep "typo tolerance"

# Only performance tests
npm run test:search:e2e -- --grep "Search Performance"
```

## Performance Benchmarks

**Expected Performance**:
- Search processing: < 100ms average
- Total request time: < 500ms average
- Typo tolerance: 70%+ effectiveness
- Concurrent searches: No degradation

**Performance Test Queries**:
- "phone mobile smartphone"
- "laptop computer portable"  
- "tablet ipad android"
- "camera photo video"
- "gaming console ps5 xbox"
- "audio speaker bluetooth"
- "watch smartwatch fitness"
- "accessories cable charger"

## Test Reports

Tests generate detailed reports including:
- ✅ Pass/fail status for each test
- ⚡ Performance metrics (processing time, total time)
- 🔤 Typo tolerance effectiveness percentages
- 📊 Facet distribution statistics
- 💾 Index document counts

## Troubleshooting

### Common Issues

**"ECONNREFUSED" Error**:
```bash
# Start Meilisearch
docker-compose -f docker-compose.meili.yml up -d

# Check health
curl http://localhost:7700/health
```

**No Search Results**:
```bash
# Check if products are indexed
node scripts/search-indexer.ts

# Or seed test data
node scripts/seed-search-test-data.js
```

**API Test Failures**:
```bash
# Start development server
npm run dev

# Check API endpoint
curl "http://localhost:5000/api/search?q=phone"
```

### Debug Mode

Add environment variables for detailed logging:
```bash
DEBUG=search* npm run test:search
VERBOSE=1 npm run test:search:e2e
```

## Integration with CI/CD

The search tests are designed to run in GitHub Actions:

```yaml
- name: Start Meilisearch
  run: docker-compose -f docker-compose.meili.yml up -d

- name: Seed test data
  run: node scripts/seed-search-test-data.js

- name: Run search tests
  run: |
    npm run test:search
    npm run test:search:e2e

- name: Clean test data
  run: node scripts/seed-search-test-data.js clean
```

## Future Enhancements

- [ ] Visual regression tests for search UI
- [ ] Load testing with high query volumes
- [ ] Multi-language search testing
- [ ] Search analytics validation
- [ ] Mobile-specific search tests
- [ ] Voice search testing (future feature)

---

*Last updated: August 2025*