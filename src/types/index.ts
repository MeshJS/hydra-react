// types.ts (updated to include context-based hook type if needed, but mostly unchanged)
import { Observable } from "rxjs";

import {
  ClientMessage,
  hydraStatus,
  ServerOutput,
} from "../../../mesh-hydra/src/types";
import { HydraProvider } from "../../../mesh-hydra/src";

import { HydraReactiveClient } from "../reactive-client";

export type HydraProviderOptions = ConstructorParameters<
  typeof HydraProvider
>[0];

export interface InternalContextValue {
  client: HydraReactiveClient;
}

export interface IUseHydra {
  hydra: HydraReactive; // Proxy to interact with Hydra backend
  provider: HydraProvider; // The underlying HydraProvider instance
  status: hydraStatus | null; // Latest status from Hydra as plain value
  message: ServerOutput | ClientMessage | null; // Most recent message received/sent
  observable_status: Observable<hydraStatus | null>; // Observable emitting status changes
  observable_message: Observable<ServerOutput | ClientMessage | null>; // Observable emitting messages
}

type AsyncMethods<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => Promise<any> ? K : never;
}[keyof T];

type AsyncToObservable<T extends (...args: any[]) => Promise<any>> = (
  ...args: Parameters<T>
) => Observable<Awaited<ReturnType<T>>>;

type WrapAsyncWithObservable<T> = {
  [K in AsyncMethods<T>]: T[K] extends (...args: any[]) => Promise<any>
    ? AsyncToObservable<T[K]>
    : never;
};

type KeepSyncMethods<T> = Omit<T, AsyncMethods<T>>;

export type HydraReactive = WrapAsyncWithObservable<HydraProvider> &
  KeepSyncMethods<HydraProvider> & {
    onMessage: (
      listener: (message: ServerOutput | ClientMessage) => void,
    ) => () => void;
    onStatusChange: (listener: (status: hydraStatus) => void) => () => void;
  };

// Re-export types from mesh-hydra for convenience
export type { hydraStatus, ServerOutput, ClientMessage } from "../../../mesh-hydra/src/types";