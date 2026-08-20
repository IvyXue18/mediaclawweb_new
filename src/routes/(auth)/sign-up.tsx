import { useEffect, useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { authClient, signIn, signUp, useSession } from '@/core/auth/client';
import { useRouter } from '@/core/i18n/navigation';
import { apiPost } from '@/lib/api-client';
import {
  normalizePhoneIdentifier,
  resolveLoginIdentifier,
  usesPhoneAuthEmailDomain,
} from '@/lib/auth-identifier';
import {
  DEFAULT_AUTH_REDIRECT_PATH,
  getSafeAuthCallbackPath,
} from '@/lib/auth-redirect';
import { recordAnalyticsEventSafe } from '@/lib/client-analytics';
import { m } from '@/paraglide/messages.js';
import { localizeHref } from '@/paraglide/runtime.js';
import { usePublicConfig } from '@/hooks/use-public-config';
import { TextField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldSeparator } from '@/components/ui/field';

import {
  authInputClassName,
  AuthPageShell,
  AuthSocialButton,
  EmailButtonContent,
} from './-auth-layout';

const signUpSchema = z
  .object({
    name: z.string().min(1),
    identifier: z
      .string()
      .trim()
      .min(1, m['common.sign.login_identifier_required']())
      .refine(
        (value) =>
          Boolean(normalizePhoneIdentifier(value)) ||
          (z.email().safeParse(value).success &&
            !usesPhoneAuthEmailDomain(value)),
        m['common.sign.registration_identifier_invalid']()
      ),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    inviteCode: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: m['common.sign.password_mismatch'](),
  });

function normalizeReferralCode(value?: string | null) {
  const raw = String(value || '');
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {}
  return decoded
    .trim()
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 64);
}

function SignUpPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  // Set right before we navigate so the already-signed-in effect doesn't also fire.
  const navigatingRef = useRef(false);
  const [error, setError] = useState('');
  const [socialPending, setSocialPending] = useState<
    'google' | 'github' | null
  >(null);

  const [redirectParam, setRedirectParam] = useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [paramsReady, setParamsReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectParam(params.get('redirect'));
    setCallbackUrl(params.get('callbackUrl'));
    setReferralCode(
      normalizeReferralCode(
        params.get('ref') ||
          params.get('ref_code') ||
          params.get('referral_code')
      ) || null
    );
    setParamsReady(true);
  }, []);

  const safeCallbackUrl = getSafeAuthCallbackPath(callbackUrl);

  const afterLoginUrl = redirectParam
    ? `/auth-callback?redirect=${encodeURIComponent(redirectParam)}`
    : safeCallbackUrl || DEFAULT_AUTH_REDIRECT_PATH;

  // Already signed in (visited /sign-up directly, or a stale callbackUrl looped
  // back here) → continue to the intended destination.
  useEffect(() => {
    if (!paramsReady || sessionPending || navigatingRef.current) return;
    if (session?.user) {
      navigatingRef.current = true;
      window.location.assign(localizeHref(afterLoginUrl));
    }
  }, [afterLoginUrl, paramsReady, sessionPending, session?.user]);

  // Carry callbackUrl/redirect across to sign-in so the destination survives the switch.
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
  const emailVerificationEnabled =
    configs.email_verification_enabled === 'true';
  const inviteCodeRequired = configs.invite_code_required === 'true';
  const hasSocial = googleEnabled || githubEnabled;
  const hasAnyMethod = emailEnabled || hasSocial;

  const form = useForm({
    defaultValues: {
      name: '',
      identifier: '',
      password: '',
      confirmPassword: '',
      inviteCode: '',
    },
    validators: { onSubmit: signUpSchema },
    onSubmit: async ({ value }) => {
      setError('');
      const trimmedInvite = value.inviteCode.trim();
      if (inviteCodeRequired && !trimmedInvite) {
        setError(m['common.sign.invite_code_required']());
        return;
      }
      try {
        const phone = normalizePhoneIdentifier(value.identifier);
        const authEmail = resolveLoginIdentifier(value.identifier);

        // Pre-validate invite code so we don't create an unredeemable account.
        if (inviteCodeRequired) {
          try {
            await apiPost('/api/invite-codes/validate', {
              code: trimmedInvite,
            });
          } catch (err: any) {
            setError(err?.message || m['common.sign.invite_code_invalid']());
            return;
          }
        }

        const result = await signUp.email({
          name: value.name,
          email: authEmail,
          password: value.password,
        });
        if (result.error) {
          setError(result.error.message || 'Sign up failed');
          return;
        }
        recordAnalyticsEventSafe('sign_up_success', {
          authMethod: phone ? 'phone' : 'email',
          callbackUrl: afterLoginUrl,
          referralCode: referralCode || undefined,
        });

        // Try to redeem when feature is enabled.
        // - Without email verification: we have a session immediately, redeem now.
        // - With email verification: redeem after sign-in; we still attempt now in
        //   case autoSignIn is on, and silently swallow the unauthorized failure.
        if (inviteCodeRequired && trimmedInvite) {
          try {
            await apiPost('/api/invite-codes/redeem', { code: trimmedInvite });
          } catch {}
        }
        if (referralCode) {
          try {
            await apiPost('/api/referral/relations', { referralCode });
          } catch {}
        }

        if (emailVerificationEnabled && !phone) {
          const verifyPath = `/verify-email?sent=1&email=${encodeURIComponent(
            authEmail
          )}&callbackUrl=${encodeURIComponent(afterLoginUrl)}`;
          void authClient.sendVerificationEmail({
            email: authEmail,
            callbackURL: localizeHref(afterLoginUrl),
          });
          router.push(verifyPath);
        } else {
          // Email verification is a global Better Auth setting. Phone-backed
          // accounts are marked verified by the server hook, but sign-up still
          // skips auto-login while that global setting is enabled, so establish
          // the session explicitly for phone registrations.
          if (phone && emailVerificationEnabled) {
            const loginResult = await signIn.email({
              email: authEmail,
              password: value.password,
            });
            if (loginResult.error) {
              setError(loginResult.error.message || 'Sign in failed');
              return;
            }
          }
          // Hard navigation so the destination reloads with a fresh session
          // cookie — a client push would let the guard read a stale (logged-out)
          // session store and bounce straight back to /sign-in.
          navigatingRef.current = true;
          window.location.assign(localizeHref(afterLoginUrl));
        }
      } catch (err: any) {
        setError(err.message || 'Sign up failed');
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
    <AuthPageShell mode="sign-up" switchQuery={switchQuery}>
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
                <form.Field name="name">
                  {(field) => (
                    <TextField
                      field={field}
                      label={m['common.sign.name_title']()}
                      type="text"
                      required
                      placeholder={m['common.sign.name_placeholder']()}
                      inputClassName={authInputClassName}
                    />
                  )}
                </form.Field>
                <form.Field name="identifier">
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
                  {(field) => (
                    <TextField
                      field={field}
                      label={m['common.sign.password_title']()}
                      type="password"
                      required
                      placeholder={m['common.sign.password_placeholder']()}
                      inputClassName={authInputClassName}
                    />
                  )}
                </form.Field>
                <form.Field name="confirmPassword">
                  {(field) => (
                    <TextField
                      field={field}
                      label={m['common.sign.confirm_password_title']()}
                      type="password"
                      required
                      placeholder={m[
                        'common.sign.confirm_password_placeholder'
                      ]()}
                      inputClassName={authInputClassName}
                    />
                  )}
                </form.Field>
                {inviteCodeRequired && (
                  <form.Field name="inviteCode">
                    {(field) => (
                      <TextField
                        field={field}
                        label={m['common.sign.invite_code_title']()}
                        type="text"
                        required
                        placeholder={m['common.sign.invite_code_placeholder']()}
                        inputClassName={authInputClassName}
                      />
                    )}
                  </form.Field>
                )}
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
                            : m['common.sign.email_sign_up']()}
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

export const Route = createFileRoute('/(auth)/sign-up')({
  component: SignUpPage,
});
