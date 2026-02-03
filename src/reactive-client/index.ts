// reactive-client.ts (unchanged, as it's the core RxJS sync layer)
import type { Observable } from "rxjs";
import { BehaviorSubject, from } from "rxjs";

import type {
  ClientMessage,
  hydraStatus,
  ServerOutput,
} from "../../../mesh-hydra/src";
import type { HydraProviderOptions, HydraReactive } from "../types";
import { HydraProvider } from "../../../mesh-hydra/src";

export class HydraReactiveClient {
  private readonly provider: HydraProvider;
  private readonly status$ = new BehaviorSubject<hydraStatus | null>(null);
  private readonly message$ = new BehaviorSubject<
    ServerOutput | ClientMessage | null
  >(null);
  private readonly listeners = new Set<
    (msg: ServerOutput | ClientMessage) => void
  >();
  private readonly reactiveApi: HydraReactive;

  constructor(options: HydraProviderOptions) {
    this.provider = new HydraProvider(options);
    this.provider.onStatusChange((s) => this.status$.next(s));
    this.provider.onMessage((msg) => {
      this.message$.next(msg);
      this.listeners.forEach((fn) => fn(msg));
    });
    this.reactiveApi = this.buildReactiveProxy();
  }

  get hydra(): HydraReactive {
    return this.reactiveApi;
  }

  get hydraProvider(): HydraProvider {
    return this.provider;
  }

  get observable_status(): Observable<hydraStatus | null> {
    return this.status$.asObservable();
  }

  get observable_message(): Observable<ServerOutput | ClientMessage | null> {
    return this.message$.asObservable();
  }

  get latestStatus(): hydraStatus | null {
    return this.status$.value;
  }

  get latestMessage(): ServerOutput | ClientMessage | null {
    return this.message$.value;
  }

  teardown(): void {
    this.listeners.clear();
    this.provider.onMessage(() => {});
  }

  private buildReactiveProxy(): HydraReactive {
    const self = this;

    return new Proxy(this.provider, {
      get(target, prop, receiver) {
        if (prop === "onMessage") {
          return (listener: (msg: ServerOutput | ClientMessage) => void) => {
            self.listeners.add(listener);
            return () => self.listeners.delete(listener);
          };
        }

        if (prop === "onStatusChange") {
          return (listener: (s: hydraStatus) => void) => {
            const sub = self.status$.subscribe((s) => {
              if (s !== null) listener(s);
            });
            return () => sub.unsubscribe();
          };
        }

        const value = Reflect.get(target, prop, receiver);
        if (typeof value === "function") {
          return (...args: any[]) => {
            const result = value.apply(target, args);

            if (result && typeof result.then === "function") {
              return from(result);
            }

            return result;
          };
        }

        return value;
      },
    }) as unknown as HydraReactive;
  }
}