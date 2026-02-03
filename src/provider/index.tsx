"use client";

import type { ReactNode } from "react";
import { createContext, useEffect, useRef } from "react";

import type { HydraProviderOptions, InternalContextValue } from "../types";
import { HydraReactiveClient } from "../reactive-client";

export const HydraContext = createContext<InternalContextValue | undefined>(undefined);

export interface HydraReactProviderProps extends HydraProviderOptions {
  children: ReactNode;
  autoConnect?: boolean;
}

export const HydraReactProvider = ({
  children,
  autoConnect = false,
  ...options
}: HydraReactProviderProps) => {

  const clientRef = useRef<HydraReactiveClient | null>(null);
  const initialOptionsRef = useRef<HydraProviderOptions | null>(null);
  const warnedRef = useRef(false);

  if (!clientRef.current) {
    clientRef.current = new HydraReactiveClient(options);
    initialOptionsRef.current = { ...options };
  }

  useEffect(() => {
    if (warnedRef.current || !initialOptionsRef.current) return;

    const keys: (keyof HydraProviderOptions)[] = [
      "httpUrl",
      "wsUrl",
      "address",
      "history",
    ];

    const changed = keys.some((key) => {
      return initialOptionsRef.current![key] !== options[key];
    });

    if (changed) {
      console.warn(
        "HydraReactProvider props changed after initial mount. Provider must be remounted."
      );
      warnedRef.current = true;
    }
  }, [options]);

  useEffect(() => {
    if (!autoConnect || !clientRef.current) return;

    const sub = clientRef.current.hydra.connect().subscribe({
      error(err) {
        console.error("HydraReactProvider autoConnect failed:", err);
      },
    });

    return () => sub.unsubscribe();
  }, [autoConnect]);

  useEffect(() => {
    return () => clientRef.current?.teardown();
  }, []);

  return (
    <HydraContext.Provider value={{ client: clientRef.current! }}>
      {children}
    </HydraContext.Provider>
  );
};
