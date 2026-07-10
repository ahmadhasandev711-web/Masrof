/** Strips Mongoose/BSON prototypes so data is safe for RSC and Client Components. */
export function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
