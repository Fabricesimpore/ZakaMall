/**
 * Overflow Detector Utility
 * Helps identify elements causing horizontal scroll in development
 */

export function detectOverflow(enable = true) {
  if (!enable || process.env.NODE_ENV !== 'development') {
    return;
  }

  const checkElement = (element: Element) => {
    const rect = element.getBoundingClientRect();
    const isOverflowing = rect.right > window.innerWidth || rect.left < 0;
    
    if (isOverflowing) {
      const styles = window.getComputedStyle(element);
      console.warn('🚨 Overflow detected:', {
        element,
        tag: element.tagName,
        class: element.className,
        id: element.id,
        width: rect.width,
        left: rect.left,
        right: rect.right,
        windowWidth: window.innerWidth,
        computedWidth: styles.width,
        overflow: styles.overflow,
        overflowX: styles.overflowX,
      });
      
      // Visual indicator in development
      (element as HTMLElement).style.outline = '2px solid red';
      (element as HTMLElement).style.outlineOffset = '-2px';
    }
  };

  // Check all elements on page
  const checkAllElements = () => {
    // Reset previous outlines
    document.querySelectorAll('[data-overflow-marked]').forEach(el => {
      (el as HTMLElement).style.outline = '';
      el.removeAttribute('data-overflow-marked');
    });

    // Check each element
    document.querySelectorAll('*').forEach(element => {
      checkElement(element);
    });
  };

  // Run initial check
  setTimeout(checkAllElements, 1000);

  // Re-check on resize
  let resizeTimeout: NodeJS.Timeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(checkAllElements, 250);
  });

  // Re-check on route change
  const observer = new MutationObserver(() => {
    setTimeout(checkAllElements, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Expose for manual debugging
  (window as any).checkOverflow = checkAllElements;
  
  console.log('🔍 Overflow detector enabled. Elements causing overflow will be outlined in red.');
  console.log('   Run window.checkOverflow() to manually check.');
}

// Helper to get all overflowing elements
export function getOverflowingElements(): Element[] {
  const overflowing: Element[] = [];
  
  document.querySelectorAll('*').forEach(element => {
    const rect = element.getBoundingClientRect();
    if (rect.right > window.innerWidth || rect.left < 0) {
      overflowing.push(element);
    }
  });
  
  return overflowing;
}