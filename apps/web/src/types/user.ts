import z from 'zod';

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatar: z.string(),
  provider: z.enum(['google', 'github', 'facebook', 'email']),
});

export const UserArraySchema = z.array(UserSchema);
export type User = z.infer<typeof UserSchema>;
