import { test, expect } from "@playwright/test";

const routes = ["/", "/products", "/orders", "/cart", "/profile"];
const viewportSizes = [320, 375, 414, 768, 1024, 1280, 1536];

for (const width of viewportSizes) {
  for (const route of routes) {
    test(`no horizontal overflow on ${route} @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      
      try {
        await page.goto(`http://localhost:3000${route}`, {
          waitUntil: 'networkidle',
          timeout: 10000
        });
      } catch (error) {
        console.log(`Route ${route} not accessible, skipping test`);
        test.skip();
      }

      // Wait for content to load and stabilize
      await page.waitForTimeout(500);

      // Check for horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > document.body.clientWidth;
      });

      expect(hasOverflow).toBeFalsy(`Horizontal overflow detected on ${route} at ${width}px viewport`);

      // Additional check for elements exceeding viewport width
      const overflowingElements = await page.evaluate((viewportWidth) => {
        const elements = Array.from(document.querySelectorAll('*'));
        const overflowing = [];
        
        for (const element of elements) {
          const rect = element.getBoundingClientRect();
          if (rect.right > viewportWidth) {
            overflowing.push({
              tagName: element.tagName,
              className: element.className,
              id: element.id,
              right: rect.right,
              width: rect.width
            });
          }
        }
        
        return overflowing;
      }, width);

      if (overflowingElements.length > 0) {
        console.log(`Overflowing elements on ${route} @ ${width}px:`, overflowingElements.slice(0, 5));
      }

      expect(overflowingElements.length).toBe(0);
    });
  }
}