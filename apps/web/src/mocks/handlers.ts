import { http, HttpResponse } from 'msw';
/**
 * MSW handlers for auth REST endpoints, for use in Storybook stories.
 *
 * Only registration goes through the browser (via the `/backend` Next.js
 * proxy, see `lib/auth.ts`). Login/logout are server actions, mocked in
 * `actions/__mocks__/auth.ts` instead.
 *
 * The mock response shape mirrors the NestJS backend (`apps/backend/src/auth`).
 */
const authUrl = (path: string) => `/backend/auth${path}`;

export const mockAuthUser = {
  id: 1,
  email: 'emma@example.com',
  name: 'Emma Thornton',
};

export const signUpSuccess = http.post(authUrl('/register'), () =>
  HttpResponse.json([mockAuthUser], { status: 201 }),
);

export const signUpEmailTaken = http.post(authUrl('/register'), () =>
  HttpResponse.json(
    {
      message: `User with email ${mockAuthUser.email} already existed.`,
      error: 'Conflict',
      statusCode: 409,
    },
    { status: 409 },
  ),
);
