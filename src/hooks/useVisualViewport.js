import { useEffect } from "react";

export function useVisualViewport(elementRef) {
  useEffect(() => {
    const vv = window.visualViewport;
    const el = elementRef.current;
    if (!vv || !el) return undefined;

    let rafId = null;
    let lastHeight = 0;
    let layoutViewportHeight = document.documentElement.clientHeight || window.innerHeight;

    const updateVisualHeight = () => {
      if (vv.height >= layoutViewportHeight - 100) {
        layoutViewportHeight = document.documentElement.clientHeight || window.innerHeight;
      }

      const isKeyboardOpen = vv.height < layoutViewportHeight - 100;
      if (isKeyboardOpen) {
        if (window.scrollY !== 0) {
          window.scrollTo(0, 0);
        }
        const nextHeight = Math.round(vv.height);
        if (Math.abs(nextHeight - lastHeight) > 2) {
          lastHeight = nextHeight;
          el.style.setProperty("--visual-height", `${nextHeight}px`);
        }
      } else if (lastHeight !== 0) {
        lastHeight = 0;
        el.style.removeProperty("--visual-height");
      }
    };

    const handleViewportChange = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateVisualHeight);
    };

    vv.addEventListener("resize", handleViewportChange);
    vv.addEventListener("scroll", handleViewportChange);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      vv.removeEventListener("resize", handleViewportChange);
      vv.removeEventListener("scroll", handleViewportChange);
      el.style.removeProperty("--visual-height");
    };
  }, [elementRef]);
}
