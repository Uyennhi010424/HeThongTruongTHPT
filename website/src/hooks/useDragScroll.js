import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook to enable mouse drag-to-scroll, wheel horizontal scroll,
 * and navigation buttons on any scrollable container.
 */
export function useDragScroll() {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const dragInfo = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    hasMoved: false,
  });

  const checkScrollability = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    checkScrollability();

    const handleScroll = () => {
      checkScrollability();
    };

    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.deltaY !== 0) {
        // Only prevent vertical scroll if the container can actually scroll horizontally in that direction
        const canScroll = (e.deltaY > 0 && el.scrollLeft < el.scrollWidth - el.clientWidth - 1) ||
                          (e.deltaY < 0 && el.scrollLeft > 1);
        if (canScroll) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
        }
      }
    };

    const handleResize = () => {
      checkScrollability();
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    el.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("resize", handleResize);

    // Initial check after paint
    const timer = setTimeout(checkScrollability, 100);

    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", handleScroll);
      el.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", handleResize);
    };
  }, [checkScrollability]);

  const onMouseDown = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    // Only track left click
    if (e.button !== 0) return;

    dragInfo.current.isDown = true;
    dragInfo.current.startX = e.pageX - el.offsetLeft;
    dragInfo.current.scrollLeft = el.scrollLeft;
    dragInfo.current.hasMoved = false;
    setIsDragging(true);
  }, []);

  const onMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el || !dragInfo.current.isDown) return;

    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragInfo.current.startX) * 1.5; // Drag speed multiplier

    if (Math.abs(walk) > 4) {
      dragInfo.current.hasMoved = true;
    }

    el.scrollLeft = dragInfo.current.scrollLeft - walk;
  }, []);

  const onMouseUp = useCallback(() => {
    dragInfo.current.isDown = false;
    setIsDragging(false);
  }, []);

  const onMouseLeave = useCallback(() => {
    dragInfo.current.isDown = false;
    setIsDragging(false);
  }, []);

  // Use capture phase to prevent click on children if drag occurred
  const onClickCapture = useCallback((e) => {
    if (dragInfo.current.hasMoved) {
      e.stopPropagation();
      e.preventDefault();
      dragInfo.current.hasMoved = false;
    }
  }, []);

  const scrollLeft = useCallback((amount = 220) => {
    const el = ref.current;
    if (el) {
      el.scrollBy({ left: -amount, behavior: "smooth" });
    }
  }, []);

  const scrollRight = useCallback((amount = 220) => {
    const el = ref.current;
    if (el) {
      el.scrollBy({ left: amount, behavior: "smooth" });
    }
  }, []);

  return {
    ref,
    isDragging,
    canScrollLeft,
    canScrollRight,
    scrollLeft,
    scrollRight,
    checkScrollability,
    events: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
      onClickCapture,
    },
  };
}
