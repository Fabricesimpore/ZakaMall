import { deleteUserUltimate } from "./server/storage-user-deletion-ultimate";

async function testDeletion() {
  console.log("🧪 Testing user deletion locally...");
  
  const testUserId = "443c4c51-0372-4dfb-b743-ff1c8eedc154";
  
  try {
    console.log(`\n📋 Attempting to delete user: ${testUserId}`);
    await deleteUserUltimate(testUserId);
    console.log("✅ Deletion test completed successfully!");
  } catch (error: any) {
    console.error("❌ Deletion test failed:", error.message);
    console.error("Stack:", error.stack);
  }
  
  process.exit(0);
}

// Run the test
testDeletion().catch(console.error);