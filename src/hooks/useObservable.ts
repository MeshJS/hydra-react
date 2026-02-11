import { useEffect, useState } from "react";
import { Observable } from "rxjs";

export function useObservableValue<T>(observable: Observable<T>, initial: T): T {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    const subscription = observable.subscribe((value) => setValue(value));
    return () => subscription.unsubscribe();
  }, [observable]);

  return value;
}