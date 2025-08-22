import { test, expect, devices } from '@playwright/test';

const viewports = [
  { name: 'iPhone SE', width: 320, height: 568 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPad Mini', width: 768, height: 1024 },
  { name: 'Desktop', width: 1024, height: 768 },
  { name: 'Desktop HD', width: 1280, height: 720 },
  { name: 'Desktop Full HD', width: 1536, height: 864 },
];

const pagesToTest = [
  { path: '/', name: 'Landing' },
  { path: '/home', name: 'Home' },
  { path: '/customer', name: 'Customer Dashboard' },
  { path: '/vendor', name: 'Vendor Dashboard' },
  { path: '/cart', name: 'Cart' },
  { path: '/admin', name: 'Admin Dashboard' },
];

test.describe('Horizontal Scroll Prevention', () => {
  for (const viewport of viewports) {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.use({
        viewport: { width: viewport.width, height: viewport.height },
      });

      for (const page of pagesToTest) {
        test(`should not have horizontal scroll on ${page.name}`, async ({ page: playwright }) => {
          // Navigate to the page
          await playwright.goto(page.path);
          
          // Wait for the page to fully load
          await playwright.waitForLoadState('networkidle');
          
          // Check if there's horizontal scroll
          const hasHorizontalScroll = await playwright.evaluate(() => {
            const html = document.documentElement;
            const body = document.body;
            
            // Check if scrollbar exists
            const hasScroll = html.scrollWidth > html.clientWidth || 
                            body.scrollWidth > body.clientWidth;
            
            // Also check for overflow
            const htmlOverflow = window.getComputedStyle(html).overflowX;
            const bodyOverflow = window.getComputedStyle(body).overflowX;
            
            return {
              hasScroll,
              htmlScrollWidth: html.scrollWidth,
              htmlClientWidth: html.clientWidth,
              bodyScrollWidth: body.scrollWidth,
              bodyClientWidth: body.clientWidth,
              htmlOverflow,
              bodyOverflow,
            };
          });
          
          // Assert no horizontal scroll
          expect(hasHorizontalScroll.hasScroll, 
            `Horizontal scroll detected on ${page.name} at ${viewport.width}px width. 
             HTML: ${hasHorizontalScroll.htmlScrollWidth}px > ${hasHorizontalScroll.htmlClientWidth}px
             Body: ${hasHorizontalScroll.bodyScrollWidth}px > ${hasHorizontalScroll.bodyClientWidth}px`
          ).toBe(false);
          
          // Check for overflowing elements
          const overflowingElements = await playwright.evaluate(() => {
            const elements: any[] = [];
            const viewportWidth = window.innerWidth;
            
            document.querySelectorAll('*').forEach(element => {
              const rect = element.getBoundingClientRect();
              if (rect.right > viewportWidth || rect.left < 0) {
                const styles = window.getComputedStyle(element);
                elements.push({
                  tag: element.tagName,
                  class: element.className,
                  id: element.id,
                  width: rect.width,
                  left: rect.left,
                  right: rect.right,
                  text: element.textContent?.substring(0, 50),
                });
              }
            });
            
            return elements;
          });
          
          // Assert no overflowing elements
          expect(overflowingElements.length, 
            `Found ${overflowingElements.length} overflowing elements on ${page.name} at ${viewport.width}px:
             ${JSON.stringify(overflowingElements, null, 2)}`
          ).toBe(0);
        });
      }
    });
  }
});

// Test for responsive images
test.describe('Responsive Images', () => {
  test('images should not exceed viewport width', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const oversizedImages = await page.evaluate(() => {
      const images: any[] = [];
      const viewportWidth = window.innerWidth;
      
      document.querySelectorAll('img').forEach(img => {
        const rect = img.getBoundingClientRect();
        if (rect.width > viewportWidth) {
          images.push({
            src: img.src,
            alt: img.alt,
            width: rect.width,
            viewportWidth,
          });
        }
      });
      
      return images;
    });
    
    expect(oversizedImages.length, 
      `Found ${oversizedImages.length} oversized images:
       ${JSON.stringify(oversizedImages, null, 2)}`
    ).toBe(0);
  });
});

// Test for table responsiveness
test.describe('Table Responsiveness', () => {
  test('tables should be wrapped in scrollable containers', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    const unwrappedTables = await page.evaluate(() => {
      const tables: any[] = [];
      
      document.querySelectorAll('table').forEach(table => {
        const parent = table.parentElement;
        if (parent) {
          const parentStyles = window.getComputedStyle(parent);
          const hasOverflowScroll = 
            parentStyles.overflowX === 'auto' || 
            parentStyles.overflowX === 'scroll';
          
          if (!hasOverflowScroll) {
            tables.push({
              html: table.outerHTML.substring(0, 100),
              parentClass: parent.className,
              parentOverflow: parentStyles.overflowX,
            });
          }
        }
      });
      
      return tables;
    });
    
    expect(unwrappedTables.length, 
      `Found ${unwrappedTables.length} tables without overflow wrappers:
       ${JSON.stringify(unwrappedTables, null, 2)}`
    ).toBe(0);
  });
});