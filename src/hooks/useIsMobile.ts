import { useEffect, useState } from "react";

const DEFAULT_MOBILE_QUERY = "(max-width: 767px)";

export const useIsMobile = (query: string = DEFAULT_MOBILE_QUERY): boolean => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const mediaQuery = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return isMobile;
};
