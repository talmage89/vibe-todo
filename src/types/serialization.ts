export type SerializedDate<T> = {
  [K in keyof T]: T[K] extends Date
    ? string
    : T[K] extends Date | null
      ? string | null
      : T[K] extends Array<infer U>
        ? Array<SerializedDate<U>>
        : T[K];
};
