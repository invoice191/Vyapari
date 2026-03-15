import { useState, useEffect } from "react";

export function useBreakpoint() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1440);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return { w, isMobile: w < 640, isTablet: w >= 640 && w < 1024, isDesktop: w >= 1024 };
}

// Shorthand: pick value by breakpoint
export function rv(bp: any, mobile: any, tablet: any, desktop: any) {
  if (!bp || bp.isMobile) return mobile;
  if (bp.isTablet) return tablet;
  return desktop;
}
