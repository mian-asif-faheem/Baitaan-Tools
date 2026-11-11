/** Turns an `as const` rate table into its shape: literal numbers become `number`, so next year's table fits the same type. */
export type Widen<T> = T extends number
  ? number
  : T extends string
    ? string
    : T extends readonly (infer U)[]
      ? readonly Widen<U>[]
      : T extends object
        ? { readonly [K in keyof T]: Widen<T[K]> }
        : T;
