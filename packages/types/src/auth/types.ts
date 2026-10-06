import { z } from "zod";

const passMin = 8;
const passMax = 64;
const passMaxBytes = 72;
const minLengthErrorMessage = `Password must contain at least ${passMin.toString()} characters`;
const maxLengthErrorMessage = `Password must contain no more than ${passMax.toString()} characters`;
const maxBytesErrorMessage = "Password is too long, use fewer special characters";

const passwordSchema = z
  .string()
  .min(passMin, minLengthErrorMessage)
  .max(passMax, maxLengthErrorMessage)
  .refine(
    (password) => new TextEncoder().encode(password).length <= passMaxBytes,
    maxBytesErrorMessage,
  );

const nameMin = 2;
const nameMinLengthErrorMessage = `Name must contain at least ${nameMin.toString()} characters`;

const RegisterSchema = z.object({
  name: z.string().min(nameMin, nameMinLengthErrorMessage),
  email: z.email(),
  password: passwordSchema,
});

const SignInSchema = z.object({
  email: z.email(),
  password: passwordSchema,
});

export type RegisterCredentials = z.infer<typeof RegisterSchema>;
export type SignInCredentials = z.infer<typeof SignInSchema>

export type Mode = "signin" | "register";

export const getCredentialsSchema = (
  mode: Mode,
): typeof RegisterSchema | typeof SignInSchema =>
  mode === "register" ? RegisterSchema : SignInSchema;
