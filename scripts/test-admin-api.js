#!/usr/bin/env node

/**
 * Test admin API endpoints with proper authentication
 */

async function testAdminAPI() {
  const baseURL = "http://localhost:3000";

  try {
    console.log("🧪 Testing admin API endpoints...");

    // First, let's login as an admin user
    console.log("🔐 Step 1: Login as admin...");

    const loginResponse = await fetch(`${baseURL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "simporefabrice15@gmail.com",
        password: "123456", // Common test password
      }),
    });

    if (!loginResponse.ok) {
      console.log(`❌ Login failed: ${loginResponse.status}`);
      const loginError = await loginResponse.text();
      console.log("Response:", loginError);
      return;
    }

    // Extract session cookie
    const setCookieHeader = loginResponse.headers.get("set-cookie");
    console.log("🍪 Got session cookie:", setCookieHeader ? "yes" : "no");

    // Test admin users endpoint
    console.log("\n🔍 Step 2: Test /api/admin/users endpoint...");
    const usersResponse = await fetch(`${baseURL}/api/admin/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: setCookieHeader || "",
      },
    });

    console.log(`📡 Status: ${usersResponse.status}`);

    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log(`✅ Successfully fetched ${users.length} users`);
      users.slice(0, 3).forEach((user) => {
        console.log(`  • ${user.email} - ${user.role || "null"}`);
      });
    } else {
      console.log("❌ Users endpoint failed");
      const errorText = await usersResponse.text();
      console.log("Error response:", errorText);
    }

    // Test other admin endpoints
    console.log("\n🔍 Step 3: Test /api/admin/dashboard endpoint...");
    const dashboardResponse = await fetch(`${baseURL}/api/admin/dashboard`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: setCookieHeader || "",
      },
    });

    console.log(`📡 Dashboard Status: ${dashboardResponse.status}`);
    if (dashboardResponse.ok) {
      const stats = await dashboardResponse.json();
      console.log("✅ Dashboard stats:", Object.keys(stats));
    } else {
      const errorText = await dashboardResponse.text();
      console.log("❌ Dashboard error:", errorText);
    }

    console.log("\n✅ Admin API test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testAdminAPI().catch(console.error);
