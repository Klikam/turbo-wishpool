import { trustProxy } from './trust-proxy';

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
