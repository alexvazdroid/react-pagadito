import { getSessionToken, setSessionToken } from '@/lib/session';

describe('session token store', () => {
  afterEach(() => {
    setSessionToken(null);
  });

  it('starts with no token', () => {
    expect(getSessionToken()).toBeNull();
  });

  it('reflects the most recently set token', () => {
    setSessionToken('sess_abc');
    expect(getSessionToken()).toBe('sess_abc');

    setSessionToken(null);
    expect(getSessionToken()).toBeNull();
  });
});
