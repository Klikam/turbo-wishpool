import { http, HttpResponse } from 'msw';
/**
 * MSW handlers for the better-auth REST endpoints, for use in Storybook
 * stories. The browser calls them on its own origin (`/api/auth/*`, proxied to
 * the backend by Next.js, see `lib/auth-client.ts`).
 */
const authUrl = (path: string) => `/api/auth${path}`;

export const mockAuthUser = {
  id: '1',
  email: 'emma@example.com',
  name: 'Emma Thornton',
};

export const signInSuccess = http.post(authUrl('/sign-in/email'), () =>
  HttpResponse.json({ redirect: false, user: mockAuthUser }),
);

export const signInInvalidCredentials = http.post(
  authUrl('/sign-in/email'),
  () =>
    HttpResponse.json(
      { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' },
      { status: 401 },
    ),
);

export const signUpSuccess = http.post(authUrl('/sign-up/email'), () =>
  HttpResponse.json({ token: null, user: mockAuthUser }),
);

// An already registered email isn't an error: with email verification
// required, better-auth answers it like a successful sign-up.
export const signUpRateLimited = http.post(authUrl('/sign-up/email'), () =>
  HttpResponse.json(
    { message: 'Too many requests. Please try again later.' },
    { status: 429 },
  ),
);
