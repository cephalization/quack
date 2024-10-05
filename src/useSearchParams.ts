import { useSyncExternalStore } from "react";

const subscribe = (callback: (searchParams: string) => void) => {
  const listener = () => {
    callback(window.location.search);
  };
  window.addEventListener("popstate", listener);
  return () => {
    window.removeEventListener("popstate", listener);
  };
};

const getSnapshot = () => {
  return window.location.search;
};

const getServerSnapshot = () => {
  return window.location.search;
};

const setSearchParams = (searchParams: Record<string, string>) => {
  const url = new URL(window.location.href);
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  window.history.pushState({}, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

export const useSearchParams = () => {
  // using useSyncExternalStore to get the search params
  // when the url changes, emit the new value and convert it to an object
  // return an additional setter to update the search params with an object that is converted to a string and merged with the existing search params
  const searchParams = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return {
    searchParams,
    setSearchParams,
  };
};
