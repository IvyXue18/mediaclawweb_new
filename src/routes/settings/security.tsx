import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { useSession } from '@/core/auth/client';
import { apiPost } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import { TextField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const passwordSchema = z
  .object({
    password: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm new password is required'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

function SecurityPage() {
  const session = useSession();
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');

  const mutation = useMutation({
    mutationFn: (values: {
      password: string;
      newPassword: string;
      confirmPassword: string;
    }) => apiPost('/api/user/security/password', values),
  });

  const form = useForm({
    defaultValues: {
      password: '',
      newPassword: '',
      confirmPassword: '',
    },
    validators: { onSubmit: passwordSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      setSuccess('');
      try {
        await mutation.mutateAsync(value);
        setSuccess(m['settings.security.password_updated']());
        toast.success(m['settings.security.password_updated']());
      } catch (error: any) {
        const message = error?.message || m['settings.security.save_failed']();
        setServerError(message);
        toast.error(message);
      }
    },
  });

  const email = session.data?.user?.email || '';
  const isSessionLoading = session.isPending;

  return (
    <form
      className="space-y-6 p-6"
      data-settings-security-page
      data-security-password-form
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <div>
        <h1 className="text-2xl font-bold">{m['settings.security.title']()}</h1>
        <p className="text-muted-foreground">
          {m['settings.security.description']()}
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            {m['settings.security.reset_password.title']()}
          </CardTitle>
          <CardDescription>
            {m['settings.security.reset_password.description']()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pb-2">
          <div className="space-y-2">
            <Label htmlFor="security-email">
              {m['settings.security.fields.email']()}
            </Label>
            <Input
              id="security-email"
              type="email"
              value={email}
              disabled
              className="opacity-60"
              placeholder={
                isSessionLoading ? m['settings.security.loading_user']() : ''
              }
            />
          </div>

          <form.Field name="password">
            {(field) => (
              <TextField
                field={field}
                label={m['settings.security.fields.password']()}
                type="password"
                autoComplete="current-password"
                required
              />
            )}
          </form.Field>

          <form.Field name="newPassword">
            {(field) => (
              <TextField
                field={field}
                label={m['settings.security.fields.new_password']()}
                type="password"
                autoComplete="new-password"
                required
              />
            )}
          </form.Field>

          <form.Field name="confirmPassword">
            {(field) => (
              <TextField
                field={field}
                label={m['settings.security.fields.confirm_password']()}
                type="password"
                autoComplete="new-password"
                required
              />
            )}
          </form.Field>

          {serverError ? (
            <p
              className="text-destructive border-destructive/30 bg-destructive/5 rounded-md border px-3 py-2 text-sm"
              role="alert"
              data-security-password-error
            >
              {serverError}
            </p>
          ) : null}
          {success ? (
            <p
              className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
              data-security-password-success
            >
              {success}
            </p>
          ) : null}
        </CardContent>
        <CardFooter>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button
                type="submit"
                disabled={
                  isSubmitting || mutation.isPending || isSessionLoading
                }
                data-security-password-submit
              >
                {isSubmitting || mutation.isPending
                  ? m['settings.security.saving']()
                  : m['settings.security.reset_password.buttons.submit']()}
              </Button>
            )}
          </form.Subscribe>
        </CardFooter>
      </Card>
    </form>
  );
}

export const Route = createFileRoute('/settings/security')({
  component: SecurityPage,
});
