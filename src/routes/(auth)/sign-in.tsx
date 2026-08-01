import { useEffect, useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { authClient, signIn, useSession } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import { resolveLoginIdentifier } from '@/lib/auth-identifier';
import {
  DEFAULT_AUTH_REDIRECT_PATH,
  getSafeAuthCallbackPath,
} from '@/lib/auth-redirect';
import { m } from '@/paraglide/messages.js';
import { localizeHref } from '@/paraglide/runtime.js';
import { usePublicConfig } from '@/hooks/use-public-config';
import { TextField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import {
  authInputClassName,
  AuthPageShell,
  AuthSocialButton,
  EmailButtonContent,
} from './-auth-layout';

const signInSchema = z.object({
  email: z.string().trim().min(1, m['common.sign.login_identifier_required']()),
  password: z.string().min(1),
});

function SignInPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  // Set right before we navigate so the already-signed-in effect doesn't also fire.
  const navigatingRef = useRef(false);
  const [error, setError] = useState('');
  const [socialPending, setSocialPending] = useState<
    'google' | 'github' | null
  >(null);

  // redirect: client protocol, goes through auth-callback
  // callbackUrl: web page URL, goes directly after login
  const [redirectParam, setRedirectParam] = useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);
  const [paramsReady, setParamsReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectParam(params.get('redirect'));
    setCallbackUrl(params.get('callbackUrl'));
    setParamsReady(true);
  }, []);

  const safeCallbackUrl = getSafeAuthCallbackPath(callbackUrl);

  const afterLoginUrl = redirectParam
    ? `/auth-callback?redirect=${encodeURIComponent(redirectParam)}`
    : safeCallbackUrl || DEFAULT_AUTH_REDIRECT_PATH;

  // Already signed in (visited /sign-in directly, or a stale callbackUrl looped
  // back here) → continue to the intended destination.
  useEffect(() => {
    if (!paramsReady || sessionPending || navigatingRef.current) return;
    if (session?.user) {
      navigatingRef.current = true;
      window.location.assign(localizeHref(afterLoginUrl));
    }
  }, [afterLoginUrl, paramsReady, sessionPending, session?.user]);

  // Carry callbackUrl/redirect across to sign-up so the destination survives the switch.
  const switchQuery = (() => {
    const p = new URLSearchParams();
    if (safeCallbackUrl) p.set('callbackUrl', safeCallbackUrl);
    if (redirectParam) p.set('redirect', redirectParam);
    const s = p.toString();
    return s ? `?${s}` : '';
  })();

  const configQuery = usePublicConfig();
  const configs = configQuery.data ?? {};

  const configsLoaded = configQuery.isSuccess;
  const emailEnabled = configs.email_auth_enabled !== 'false';
  const googleEnabled = configs.google_auth_enabled === 'true';
  const githubEnabled = configs.github_auth_enabled === 'true';
  const passwordResetEnabled = configs.password_reset_enabled === 'true';
  const hasSocial = googleEnabled || githubEnabled;
  const hasAnyMethod = emailEnabled || hasSocial;

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmit: signInSchema },
    onSubmit: async ({ value }) => {
      setError('');
      try {
        const loginEmail = resolveLoginIdentifier(value.email);
        const result: any = await signIn.email({
          email: loginEmail,
          password: value.password,
        });
        if (result.error) {
          const status = result.error.status;
          const code = result.error.code;
          const msg = result.error.message || '';
          if (
            code === 'EMAIL_NOT_VERIFIED' ||
            (status === 403 && /not verified/i.test(msg))
          ) {
            const verifyPath = `/verify-email?sent=1&email=${encodeURIComponent(
              loginEmail
            )}&callbackUrl=${encodeURIComponent(afterLoginUrl)}`;
            void authClient.sendVerificationEmail({
              email: loginEmail,
              callbackURL: localizeHref(afterLoginUrl),
            });
            router.push(verifyPath);
            return;
          }
          setError(msg || 'Sign in failed');
        } else {
          // Hard navigation so the destination reloads with a fresh session
          // cookie — a client push would let the guard read a stale (logged-out)
          // session store and bounce straight back to /sign-in.
          navigatingRef.current = true;
          window.location.assign(localizeHref(afterLoginUrl));
        }
      } catch (err: any) {
        setError(err.message || 'Sign in failed');
      }
    },
  });

  async function handleSocial(provider: 'google' | 'github') {
    if (socialPending) return;
    setError('');
    setSocialPending(provider);
    try {
      const result = await signIn.social({
        provider,
        callbackURL: afterLoginUrl,
      });
      if (result?.error) {
        setError(result.error.message || m['common.error.message']());
        setSocialPending(null);
      }
    } catch (err: any) {
      setError(err?.message || m['common.error.message']());
      setSocialPending(null);
    }
  }

  return (
    <AuthPageShell mode="sign-in" switchQuery={switchQuery}>
      {configsLoaded && !hasAnyMethod ? (
        <div className="rounded-[8px] border border-dashed border-zinc-300 p-6 text-center dark:border-white/20">
          <p className="text-sm font-medium">
            {m['common.sign.no_methods_title']()}
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {m['common.sign.no_methods_description']()}
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup className="gap-4">
            {error && (
              <div className="bg-destructive/10 text-destructive rounded-[8px] p-3 text-sm">
                {error}
              </div>
            )}

            {hasSocial && (
              <Field className="gap-3">
                {googleEnabled && (
                  <AuthSocialButton
                    provider="google"
                    prominent
                    loading={socialPending === 'google'}
                    disabled={socialPending !== null}
                    onClick={() => handleSocial('google')}
                  >
                    {m['common.sign.google_continue']()}
                  </AuthSocialButton>
                )}
                {githubEnabled && (
                  <AuthSocialButton
                    provider="github"
                    loading={socialPending === 'github'}
                    disabled={socialPending !== null}
                    onClick={() => handleSocial('github')}
                  >
                    {m['common.sign.github_continue']()}
                  </AuthSocialButton>
                )}
              </Field>
            )}

            {hasSocial && emailEnabled && (
              <FieldSeparator className="my-1 *:data-[slot=field-separator-content]:bg-white">
                {m['common.sign.or']()}
              </FieldSeparator>
            )}

            {emailEnabled && (
              <>
                <form.Field name="email">
                  {(field) => (
                    <TextField
                      field={field}
                      label={m['common.sign.login_identifier_title']()}
                      type="text"
                      required
                      placeholder={m[
                        'common.sign.login_identifier_placeholder'
                      ]()}
                      inputClassName={authInputClassName}
                    />
                  )}
                </form.Field>
                <form.Field name="password">
                  {(field) => {
                    const err = field.state.meta.isTouched
                      ? (field.state.meta.errors?.[0] as any)
                      : null;
                    const errMsg =
                      err == null
                        ? null
                        : typeof err === 'string'
                          ? err
                          : err.message
                            ? String(err.message)
                            : String(err);
                    return (
                      <Field>
                        <div className="flex items-center justify-between">
                          <FieldLabel htmlFor={field.name}>
                            {m['common.sign.password_title']()}
                          </FieldLabel>
                          {passwordResetEnabled && (
                            <Link
                              href="/forgot-password"
                              className="text-sm text-zinc-500 underline underline-offset-4 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                            >
                              {m['common.sign.forgot_password']()}
                            </Link>
                          )}
                        </div>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="password"
                          className={authInputClassName}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          required
                          placeholder={m['common.sign.password_placeholder']()}
                          aria-invalid={errMsg ? true : undefined}
                        />
                        {errMsg && (
                          <p className="text-destructive text-sm">{errMsg}</p>
                        )}
                      </Field>
                    );
                  }}
                </form.Field>
                <Field className="gap-3 pt-1">
                  <form.Subscribe selector={(s) => s.isSubmitting}>
                    {(isSubmitting) => (
                      <Button
                        type="submit"
                        disabled={isSubmitting || socialPending !== null}
                        aria-busy={isSubmitting}
                        className="h-11 w-full rounded-full bg-[#db3ca3] text-sm font-semibold text-white shadow-sm shadow-pink-500/10 hover:bg-[#c92f94]"
                      >
                        <EmailButtonContent>
                          {isSubmitting
                            ? m['common.loading']()
                            : m['common.sign.email_sign_in']()}
                        </EmailButtonContent>
                      </Button>
                    )}
                  </form.Subscribe>
                </Field>
              </>
            )}
          </FieldGroup>
        </form>
      )}
    </AuthPageShell>
  );
}

export const Route = createFileRoute('/(auth)/sign-in')({
  component: SignInPage,
});
