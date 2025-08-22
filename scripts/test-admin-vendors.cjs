#!/usr/bin/env node

/**
 * Test script for admin vendors endpoint
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5001';

async function testAdminVendors() {
  try {
    console.log('🔍 Testing admin vendors endpoint...');
    
    // Test without auth first (should get 401 or 403)
    console.log('1. Testing without authentication...');
    const unauthResponse = await fetch(`${API_BASE}/api/admin/vendors`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log(`   Status: ${unauthResponse.status}`);
    const unauthData = await unauthResponse.text();
    console.log(`   Response: ${unauthData.substring(0, 100)}...`);
    
    if (unauthResponse.status === 401 || unauthResponse.status === 403) {
      console.log('✅ Correctly rejected unauthorized request');
    } else if (unauthResponse.status === 504) {
      console.log('❌ Request timed out - this was the original 502 issue');
      return;
    } else if (unauthResponse.status === 500) {
      console.log('❌ Internal server error - check server logs');
      return;
    } else {
      console.log('⚠️ Unexpected response for unauthorized request');
    }
    
    console.log('\n2. Testing API performance...');
    const start = Date.now();
    
    // Test the endpoint with timeout monitoring
    const response = await fetch(`${API_BASE}/api/admin/vendors?status=pending&limit=10`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    const end = Date.now();
    const duration = end - start;
    
    console.log(`   Request duration: ${duration}ms`);
    console.log(`   Status: ${response.status}`);
    
    if (duration > 5000) {
      console.log('⚠️ Request took more than 5 seconds - might still be slow');
    } else if (duration > 2000) {
      console.log('⚠️ Request took more than 2 seconds - borderline slow');
    } else {
      console.log('✅ Request completed quickly');
    }
    
    if (response.status === 504) {
      console.log('❌ Gateway timeout - our timeout middleware is working but query is still slow');
    } else if (response.status === 500) {
      console.log('⚠️ Internal server error - check server logs');
      const errorText = await response.text();
      console.log('   Error details:', errorText.substring(0, 200));
    } else {
      console.log('✅ Endpoint responded without timeout');
    }
    
    console.log('\n3. Testing health endpoint performance...');
    const healthStart = Date.now();
    const healthResponse = await fetch(`${API_BASE}/healthz`);
    const healthEnd = Date.now();
    const healthDuration = healthEnd - healthStart;
    
    console.log(`   Health check duration: ${healthDuration}ms`);
    if (healthResponse.ok) {
      console.log('✅ Health check passed');
    } else {
      console.log('❌ Health check failed');
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to server. Make sure it\'s running on port 5001');
    } else if (error.name === 'TimeoutError') {
      console.error('❌ Request timed out - this indicates the original 502 problem');
    } else {
      console.error('❌ Test failed:', error.message);
    }
    process.exit(1);
  }
}

testAdminVendors();