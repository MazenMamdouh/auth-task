import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthCard, Field, FormError, SubmitButton } from '@/components/ui';
import { useSignIn } from '@/hooks/useAuth';
import { errorMessage } from '@/lib/api';
import { signInSchema, type SignInValues } from '@/lib/validation';

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const signIn = useSignIn();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema), mode: 'onTouched', defaultValues: { email: '', password: '' } });

  const onSubmit = handleSubmit((values) => signIn.mutate(values, { onSuccess: () => navigate(from, { replace: true }) }));

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-semibold text-indigo-600 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError message={signIn.isError ? errorMessage(signIn.error) : null} />
        <Field label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Field label="Password" type="password" autoComplete="current-password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
        <SubmitButton loading={signIn.isPending}>Sign in</SubmitButton>
      </form>
    </AuthCard>
  );
}
