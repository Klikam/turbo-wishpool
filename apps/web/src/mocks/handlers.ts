import { http, HttpResponse } from 'msw';
import { getBackendUrl } from '@/config/config';

/**
 * MSW handlers for better-auth's REST endpoints, for use in Storybook stories
 * (via `parameters.msw.handlers`) so the sign-in/sign-up form can be
 * exercised end-to-end without a real backend. Response shapes were verified
 * against a real better-auth server: a 2xx body is `{ token, user }`, an
 * error body is `{ code, message }` and better-auth surfaces `message` as
 * `response.error.message`.
 */
const authUrl = (path: string) => `${getBackendUrl()}/api/auth${path}`;

export const mockAuthUser = {
  id: 'user-1',
  email: 'emma@example.com',
  name: 'Emma Thornton',
  image: null,
  emailVerified: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const signInSuccess = http.post(authUrl('/sign-in/email'), () =>
  HttpResponse.json({ token: 'mock-token', user: mockAuthUser }),
);

export const signInInvalidCredentials = http.post(authUrl('/sign-in/email'), () =>
  HttpResponse.json(
    { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' },
    { status: 401 },
  ),
);

export const signUpSuccess = http.post(authUrl('/sign-up/email'), () =>
  HttpResponse.json({ token: 'mock-token', user: mockAuthUser }),
);

export const signUpEmailTaken = http.post(authUrl('/sign-up/email'), () =>
  HttpResponse.json(
    {
      code: 'USER_ALREADY_EXISTS',
      message: 'An account with this email already exists',
    },
    { status: 422 },
  ),
);
