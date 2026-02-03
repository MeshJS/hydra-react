"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { HydraContext } from "../provider";
import { HydraReactiveClient } from "../reactive-client";
import type { HydraProviderOptions } from "../types";
import type { Observable } from "rxjs";

// ---------------------------------------------
// Shared RxJS → React state bridge
// ---------------------------------------------
function useObservableValue<T>(observable: Observable<T>, initial: T): T {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    const sub = observable.subscribe((val) => setValue(val));
    return () => sub.unsubscribe();
  }, [observable]);

  return value;
}

// ---------------------------------------------
// useHydra Hook
// ---------------------------------------------
export const useHydra = (hydraParameters?: HydraProviderOptions) => {
  // Always run in a Client Component


  // Attempt to read provider context (may be null)
  const context = useContext(HydraContext);

  // Persistent instance for standalone mode
  const clientRef = useRef<HydraReactiveClient | null>(null);
  const paramsRef = useRef<HydraProviderOptions | null>(null);

  let client: HydraReactiveClient;

  // ---------------------------------------------
  // Standalone Mode (parameters supplied)
  // ---------------------------------------------
  if (hydraParameters) {
    const changed =
      !paramsRef.current ||
      hydraParameters.httpUrl !== paramsRef.current.httpUrl ||
      hydraParameters.wsUrl !== paramsRef.current.wsUrl ||
      hydraParameters.address !== paramsRef.current.address ||
      hydraParameters.history !== paramsRef.current.history;

    if (!clientRef.current || changed) {
      clientRef.current = new HydraReactiveClient(hydraParameters);
      paramsRef.current = { ...hydraParameters };
    }

    client = clientRef.current;

    // Destroy client on unmount
    useEffect(() => {
      return () => {
        clientRef.current?.teardown();
      };
    }, []);
  }

  // ---------------------------------------------
  // Provider Mode (<HydraProvider> supplies client)
  // ---------------------------------------------
  else {
    if (!context) {
      throw new Error(
        "useHydra must be called either with hydraParameters or inside <HydraProvider>."
      );
    }

    client = context.client;
  }

  // ---------------------------------------------
  // Observables → React
  // ---------------------------------------------
  const status = useObservableValue(
    client.observable_status,
    client.latestStatus
  );

  const message = useObservableValue(
    client.observable_message,
    client.latestMessage
  );

  return {
    hydra: client.hydra,
    provider: client.hydraProvider,
    status,
    observable_status: client.observable_status,
    message,
    observable_message: client.observable_message,
  };
};
