import { ValidationPipe } from '@nestjs/common';

// Same options as the global pipe in main.ts.
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  stopAtFirstError: true,
});

export const validate = (metatype: new () => object, value: object) =>
  pipe.transform(value, { type: 'body', metatype });

/** The messages a user would see for an invalid body, or [] if it is valid. */
export async function messagesFor(metatype: new () => object, value: object) {
  try {
    await validate(metatype, value);
    return [];
  } catch (error) {
    return (error as { response: { message: string[] } }).response.message;
  }
}
