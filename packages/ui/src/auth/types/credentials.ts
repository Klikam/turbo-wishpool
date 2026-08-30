import z from "zod";

const passMin = 8;
const passMax = 20;
const minLengthErrorMessage = `Password must contain at least ${passMin.toString()} characters`;
const maxLengthErrorMessage = `Password must contain no more than ${passMax.toString()} characters`;
const uppercaseErrorMessage = `Password must contain at least one uppercase letter`;
const lowercaseErrorMessage = `Password must contain at least one lowercase letter`;
const numberErrorMessage = `Password must contain at least one number`;
const specialCharacterErrorMessage = `Password must contain at least one special character`;

const passwordSchema = z
  .string()
  .min(passMin, minLengthErrorMessage)
  .max(passMax, maxLengthErrorMessage)
  .refine((password) => /[A-Z]/.test(password), uppercaseErrorMessage)
  .refine((password) => /[a-z]/.test(password), lowercaseErrorMessage)
  .refine((password) => /[0-9]/.test(password), numberErrorMessage)
  .refine(
    (password) => /[!@#$%^&*]/.test(password),
    specialCharacterErrorMessage,
  );

const nameMin = 3;
const nameMinLengthErrorMessage = `Name must contain at least ${nameMin.toString()} characters`;

export const RegisterSchema = z.object({
  name: z.string().min(nameMin, nameMinLengthErrorMessage),
  email: z.email(),
  password: passwordSchema,
});

export const SignInSchema = z.object({
  email: z.email(),
  password: passwordSchema,
});

export type Credentials = z.infer<typeof RegisterSchema>;

export type Mode = "signin" | "register";

export const getCredentialsSchema = (
  mode: Mode,
): typeof RegisterSchema | typeof SignInSchema =>
  mode === "register" ? RegisterSchema : SignInSchema;
