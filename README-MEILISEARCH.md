# Meilisearch Configuration for Railway

## Overview
This application now includes a robust Meilisearch-based search system that provides:
- Typo-tolerant search ("hone" → "phone")
- Real-time vendor→storefront synchronization
- Faceted search with categories, brands, vendors, and price filtering
- Autocomplete suggestions

## Railway Environment Variables

Add these environment variables to your Railway service:

### Required Variables
```
MEILI_HOST=<your-meilisearch-instance-url>
MEILI_MASTER_KEY=<your-meilisearch-master-key>
MEILI_SEARCH_KEY=<your-meilisearch-search-key>
```

### Options for Meilisearch Hosting

#### Option 1: Railway Meilisearch Plugin (Recommended)
1. Go to your Railway project dashboard
2. Click "Add Service" → "Database" → "Meilisearch"
3. Railway will automatically provision a Meilisearch instance
4. Environment variables will be automatically injected

#### Option 2: External Meilisearch Cloud
1. Sign up at https://cloud.meilisearch.com/
2. Create a new project
3. Get your API keys from the dashboard
4. Set the environment variables in Railway

#### Option 3: Self-hosted Meilisearch
Deploy your own Meilisearch instance and configure the variables accordingly.

## Initial Setup Commands

After deploying with Meilisearch configured, run these commands once:

### 1. Bootstrap the Search Index
```bash
# In your Railway service console or locally with production env vars
node scripts/search-bootstrap.ts
```

### 2. Perform Initial Data Sync
```bash
# This will index all existing products
node -e "
const { fullReindex } = require('./server/services/product-sync.ts');
fullReindex().then(() => console.log('✅ Initial sync complete'));
"
```

## API Endpoints

Your search system provides these endpoints:

- `GET /api/search` - Main search with filtering
  - Query params: `q`, `page`, `limit`, `sort`, `vendor_id`, `categories`, `price_min`, `price_max`, `in_stock`, `currency`, `brands`
- `GET /api/search/suggestions` - Autocomplete suggestions
  - Query params: `q`

## Testing Search

Use the included test script to verify everything works:
```bash
node scripts/test-search.js
```

## How Sync Works

The system automatically keeps search in sync with your database:
- ✅ Product creation/updates/deletion
- ✅ Stock quantity changes  
- ✅ Vendor status changes (approved/suspended)
- ✅ Product approval status changes
- ✅ Product publication status changes

No manual intervention needed - everything happens automatically through route handler hooks.

## Troubleshooting

### Search not working
1. Check Meilisearch connection: `node scripts/test-search.js`
2. Verify environment variables are set in Railway
3. Check Railway logs for any search-related errors

### Products not appearing in search
1. Verify products are: `published = true`, `approved = true`, and vendor `status = 'approved'`
2. Run a manual reindex: `node -e "require('./server/services/product-sync').fullReindex()"`

### Performance issues
- Meilisearch handles up to 10,000 documents efficiently
- Consider upgrading your Meilisearch plan if you have more products
- Monitor Railway resource usage

## Search Features

### Typo Tolerance Examples
- "hone" → finds "iPhone"
- "iphne" → finds "iPhone"  
- "androd" → finds "Android"

### Synonym Support
- "phone" → also matches "cellphone", "mobile", "smartphone"
- "laptop" → also matches "notebook", "computer", "pc"
- French terms: "téléphone" → matches "phone", "mobile"

### Faceted Filtering
- Categories: Electronics, Clothing, etc.
- Brands: Apple, Samsung, etc.
- Vendors: Filter by specific sellers
- Price ranges: Min/max filtering
- Stock status: In stock vs out of stock
- Currency: XOF, USD, EUR, etc.