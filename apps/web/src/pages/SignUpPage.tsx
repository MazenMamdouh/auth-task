import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { PasswordChecklist } from '@/components/PasswordChecklist';
import { AuthCard, Field, FormError, SubmitButton } from '@/components/ui';
import { useSignUp } from '@/hooks/useAuth';
import { errorMessage } from '@/lib/api';
import { signUpSchema, type SignUpValues } from '@/lib/validation';

export default function SignUpPage() {
  const navigate = useNavigate();
  const signUp = useSignUp();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema), mode: 'onTouched', defaultValues: { email: '', name: '', password: '' } });

  const onSubmit = handleSubmit((values) => signUp.mutate(values, { onSuccess: () => navigate('/', { replace: true }) }));

  return (
    <AuthCard
      title="Create your account"
      subtitle="It takes less than a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/signin" className="font-semibold text-indigo-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError message={signUp.isError ? errorMessage(signUp.error) : null} />
        <Field label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Field label="Name" autoComplete="name" placeholder="Jane Doe" error={errors.name?.message} {...register('name')} />
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.password?.message}
          hint={<PasswordChecklist value={watch('password') ?? ''} />}
          {...register('password')}
        />
        <SubmitButton loading={signUp.isPending}>Create account</SubmitButton>
      </form>
    </AuthCard>
  );
}
