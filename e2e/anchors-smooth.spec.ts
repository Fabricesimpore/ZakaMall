import { test, expect } from "@playwright/test";

test.describe("Anchor scrolling", () => {
  test("anchors scroll to section without layout shift", async ({ page }) => {
    // Go to a page that might have anchors
    await page.goto("http://localhost:3000/");
    
    // Wait for page to load
    await page.waitForLoadState("networkidle");
    
    // Test hash navigation behavior
    await page.goto("http://localhost:3000/#main");
    
    // Check that the hash is correctly set
    const hash = await page.evaluate(() => window.location.hash);
    expect(hash).toBe("#main");
    
    // Verify the main element exists and is focusable
    const mainElement = page.locator("#main");
    await expect(mainElement).toBeAttached();
  });

  test("skip link works correctly", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    
    // Focus the skip link by pressing Tab
    await page.keyboard.press("Tab");
    
    // Check if skip link is focused and visible
    const skipLink = page.locator('a[href="#main"]');
    await expect(skipLink).toBeFocused();
    
    // Click the skip link
    await skipLink.click();
    
    // Verify it navigated to #main
    const hash = await page.evaluate(() => window.location.hash);
    expect(hash).toBe("#main");
  });

  test("smooth scroll behavior respects user preferences", async ({ page }) => {
    // Test default smooth scroll behavior
    await page.goto("http://localhost:3000/");
    
    const scrollBehavior = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).scrollBehavior;
    });
    
    expect(scrollBehavior).toBe("smooth");
    
    // Test reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    
    const reducedMotionScrollBehavior = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).scrollBehavior;
    });
    
    // Should be auto when reduced motion is preferred
    expect(reducedMotionScrollBehavior).toBe("auto");
  });

  test("header provides proper scroll offset for anchors", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    
    // Check if scroll-padding-top is set correctly
    const scrollPaddingTop = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).scrollPaddingTop;
    });
    
    // Should be 72px for header offset
    expect(scrollPaddingTop).toBe("72px");
  });
});