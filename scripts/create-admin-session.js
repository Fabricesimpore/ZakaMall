#!/usr/bin/env node

/**
 * Create an admin session cookie for testing
 */

async function createAdminSession() {
  const baseURL = "http://localhost:3000";
  
  try {
    console.log("🔐 Attempting to login as admin...");
    
    // Try logging in with different admin credentials
    const credentials = [
      { email: "simporefabrice15@gmail.com", password: "123456" },
      { email: "simporefabrice15@gmail.com", password: "password" },
      { email: "fabrice123@gmail.com", password: "123456" },
      { email: "fabrice123@gmail.com", password: "password" },
    ];
    
    for (const cred of credentials) {
      console.log(`\n🧪 Trying ${cred.email} with password ${cred.password}...`);
      
      const loginResponse = await fetch(`${baseURL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cred),
        credentials: 'include', // Important for cookies
      });
      
      console.log(`📡 Status: ${loginResponse.status}`);
      
      if (loginResponse.ok) {
        const responseData = await loginResponse.json();
        console.log("✅ Login response:", responseData);
        
        const cookies = loginResponse.headers.get('set-cookie');
        console.log("🍪 Set-Cookie header:", cookies);
        
        if (cookies) {
          // Now test admin users endpoint
          console.log("\n🔍 Testing /api/admin/users with session...");
          const usersResponse = await fetch(`${baseURL}/api/admin/users`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Cookie": cookies,
            },
          });
          
          console.log(`📡 Users endpoint status: ${usersResponse.status}`);
          
          if (usersResponse.ok) {
            const users = await usersResponse.json();
            console.log(`✅ SUCCESS! Fetched ${users.length} users`);
            return;
          } else {
            const errorText = await usersResponse.text();
            console.log(`❌ Users endpoint error (${usersResponse.status}):`, errorText);
          }
        }
      } else {
        const errorText = await loginResponse.text();
        console.log(`❌ Login failed:`, errorText);
      }
    }
    
    console.log("\n❌ All login attempts failed");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

createAdminSession().catch(console.error);