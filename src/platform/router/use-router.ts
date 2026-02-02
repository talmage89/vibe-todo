import { useEffect, useState } from "react";

/**
 * Simple hash-based router hook.
 * Returns the current route (hash without the #) and a navigation function.
 */
export const useRouter = () => {
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash.slice(1);
    return hash || "/";
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      setRoute(hash || "/");
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  return { route, navigate };
};
