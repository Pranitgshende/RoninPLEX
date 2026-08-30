import { useState, useEffect, useRef } from 'react';

export function useIntersectionObserver(
  options: IntersectionObserverInit = { rootMargin: '400px', threshold: 0 }
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<Element | null>(null);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting) {
        setHasIntersected(true);
      }
    }, options);

    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
      observer.disconnect();
    };
  }, [options.rootMargin, options.threshold, options.root]);

  return { ref, isIntersecting, hasIntersected };
}
