/** Express's `trust proxy` setting from its TRUST_PROXY env var form. */
export function trustProxy(value = 'loopback'): boolean | number | string {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}
