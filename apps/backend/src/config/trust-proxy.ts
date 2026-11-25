/** Express's `trust proxy` setting from its TRUST_PROXY env var form. */
export function trustProxy(value = 'loopback'): boolean | number | string {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}

/**
 * What is wrong with this TRUST_PROXY value, if anything. The rate limit keys
 * on the visitor IP that this setting decides, so a wrong value either lets
 * anyone dodge the limit or makes all visitors share one allowance. See
 * docs/adr/0003-rate-limit-visitor-ip.md.
 *
 * `error` means the setting makes the limit trivially bypassable, `warning`
 * means it is only right for some deployments.
 */
export function trustProxyProblem(
  value: string | undefined,
  production: boolean,
): { level: 'error' | 'warning'; message: string } | null {
  const setting = trustProxy(value);

  if (setting === true) {
    return {
      level: production ? 'error' : 'warning',
      message:
        'TRUST_PROXY=true trusts every X-Forwarded-For entry, so any visitor ' +
        'can pick their own IP and bypass the rate limit. Use a hop count ' +
        '(e.g. 1) or the address of your proxy instead.',
    };
  }

  if (production && setting === 'loopback') {
    return {
      level: 'warning',
      message:
        'TRUST_PROXY is unset (loopback). That is only right when the web ' +
        'server runs on the same host as the backend; otherwise every ' +
        'visitor shares one rate limit. Set TRUST_PROXY to match your proxy ' +
        'setup.',
    };
  }

  if (production && setting === false) {
    return {
      level: 'warning',
      message:
        'TRUST_PROXY=false makes every visitor look like the web server, ' +
        'so they all share one rate limit.',
    };
  }

  return null;
}
