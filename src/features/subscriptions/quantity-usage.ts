export type QuantityUsage = {
  used: number;
  limit: number;
  unlimited: boolean;
  atLimit: boolean;
};

export function toQuantityUsage(used: number, limit: number): QuantityUsage {
  const unlimited = limit === -1;
  return {
    used,
    limit,
    unlimited,
    atLimit: !unlimited && used >= limit,
  };
}
