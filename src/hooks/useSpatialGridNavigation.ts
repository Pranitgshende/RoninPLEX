import { useEffect, useRef, useState, useCallback } from 'react';

export function useSpatialGridNavigation(itemCount: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    if (itemCount > 0 && activeIndex >= itemCount) {
      setActiveIndex(Math.max(0, itemCount - 1));
    }
  }, [itemCount, activeIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!containerRef.current) return;

      const items = Array.from(containerRef.current.children) as HTMLElement[];
      if (items.length === 0) return;

      // Calculate columns dynamically based on offsetTop
      const firstTop = items[0].offsetTop;
      let columns = items.length; // Default to all items if single row
      for (let i = 1; i < items.length; i++) {
        if (items[i].offsetTop > firstTop) {
          columns = i;
          break;
        }
      }

      let nextIndex = activeIndex;

      switch (e.key) {
        case 'ArrowRight':
          nextIndex = Math.min(activeIndex + 1, itemCount - 1);
          e.preventDefault();
          break;
        case 'ArrowLeft':
          nextIndex = Math.max(activeIndex - 1, 0);
          e.preventDefault();
          break;
        case 'ArrowDown':
          nextIndex = Math.min(activeIndex + columns, itemCount - 1);
          e.preventDefault();
          break;
        case 'ArrowUp':
          nextIndex = Math.max(activeIndex - columns, 0);
          e.preventDefault();
          break;
        case 'Home':
          nextIndex = 0;
          e.preventDefault();
          break;
        case 'End':
          nextIndex = itemCount - 1;
          e.preventDefault();
          break;
        case 'Enter':
          // Trigger click on the first link inside the focused item
          const link = items[activeIndex]?.querySelector('a');
          if (link) {
            link.click();
          }
          e.preventDefault();
          return;
        default:
          return;
      }

      if (nextIndex !== activeIndex) {
        setActiveIndex(nextIndex);
        items[nextIndex]?.focus();
      }
    },
    [activeIndex, itemCount]
  );

  return { containerRef, activeIndex, setActiveIndex, handleKeyDown };
}
