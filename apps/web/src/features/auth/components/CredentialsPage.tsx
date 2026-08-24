'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import { login as onLogin, register as onRegister } from '../api/auth';
import {
  getCredentialsSchema,
  type Credentials,
  type Mode,
} from '../types/credentials';
import CredentialsButton from './CredentialsButton';
import CredentialsField from './CredentialsField';
import NotImplementedAlert from './NotImplementedAlert';
import ToastError from './ToastError';

export default function CredentialsPage() {
  const [mode, setMode] = useState<Mode>('signin');

  const onSubmit: SubmitHandler<Credentials> = async (data) => {
    console.log(data);
    const call = mode === 'register' ? onRegister : onLogin;
    const response = await call(data);
    if (response.error) {
      console.log(
        response.error.message ??
          `Something went wrong with the ${mode === 'register' ? 'registration' : 'login'}`,
      );
    } else {
      console.log(response.data.user);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Credentials>({
    resolver: zodResolver(getCredentialsSchema(mode)) as unknown as Resolver<Credentials>,
  });

  return (
    <>
      <div className="flex rounded-xl border border-border bg-secondary p-1 mb-5">
        <CredentialsButton
          label="Sign in"
          mode={mode}
          handleModeChange={() => {
            setMode('signin');
          }}
        />
        <CredentialsButton
          label="Register"
          mode={mode}
          handleModeChange={() => {
            setMode('register');
          }}
        />
      </div>

      <form
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        className="flex flex-col gap-3"
      >
        {mode === 'register' && (
          <CredentialsField
            label="Full name"
            field="name"
            placeholder="Emma Thornton"
            type="text"
            register={register}
          />
        )}

        <CredentialsField
          label="Email"
          field="email"
          placeholder="you@example.com"
          type="email"
          register={register}
        />

        <CredentialsField
          label="Password"
          field="password"
          placeholder="••••••••"
          type="password"
          register={register}
        />

        {errors.email?.message && <ToastError message={errors.email.message} />}

        {mode === 'register' && errors.name?.message && (
          <ToastError message={errors.name.message} />
        )}

        {errors.password?.message && <NotImplementedAlert />}

        <button
          type="submit"
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-[#3a1232] transition-colors mt-1"
        >
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </>
  );
}
