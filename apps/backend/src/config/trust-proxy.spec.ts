import { describe, expect, it } from 'vitest';
import { trustProxy, trustProxyProblem } from './trust-proxy';

describe('trustProxyProblem', () => {
  it('refuses true in production, only warns elsewhere', () => {
    expect(trustProxyProblem('true', true)?.level).toBe('error');
    expect(trustProxyProblem('true', false)?.level).toBe('warning');
  });

  it('warns about the loopback default and false in production', () => {
    expect(trustProxyProblem(undefined, true)?.level).toBe('warning');
    expect(trustProxyProblem('false', true)?.level).toBe('warning');
  });

  it('is quiet in development and for explicit proxy settings', () => {
    expect(trustProxyProblem(undefined, false)).toBeNull();
    expect(trustProxyProblem('1', true)).toBeNull();
    expect(trustProxyProblem('loopback, 10.0.0.0/8', true)).toBeNull();
  });
});

describe('trustProxy', () => {
  it('trusts only loopback when unset', () => {
    expect(trustProxy(undefined)).toBe('loopback');
  });

  it('parses booleans and hop counts', () => {
    expect(trustProxy('true')).toBe(true);
    expect(trustProxy('false')).toBe(false);
    expect(trustProxy('2')).toBe(2);
  });

  it('passes address lists through', () => {
    expect(trustProxy('loopback, 10.0.0.0/8')).toBe('loopback, 10.0.0.0/8');
  });
});
