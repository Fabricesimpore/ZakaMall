"use client";
import { useRef } from "react";
import { useVirtualizer } from "react-virtual";

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
}

interface ProductListVirtualProps {
  items: Product[];
  renderItem: (item: Product) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: string;
}

export function ProductListVirtual({
  items,
  renderItem,
  itemHeight = 120,
  containerHeight = "70vh",
}: ProductListVirtualProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 10,
  });

  return (
    <div
      ref={parentRef}
      className="scroll-area-touch overflow-auto"
      style={{ height: containerHeight }}
    >
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}>
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index];
          return (
            <div
              key={item.id}
              className="absolute left-0 right-0"
              style={{
                transform: `translateY(${virtualItem.start}px)`,
                height: `${virtualItem.size}px`,
              }}
            >
              {renderItem(item)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
