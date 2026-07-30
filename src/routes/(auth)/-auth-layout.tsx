import type { ReactNode } from 'react';
import { ArrowLeft, Github, Mail } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { Button, buttonVariants } from '@/components/ui/button';

import { AuthProductStory } from './-auth-product-story';

type AuthMode = 'sign-in' | 'sign-up';

// The auth card is intentionally always light (see AuthPageShell), but the
// shadcn Input still reacts to the global `.dark` class (dark:bg-input/30,
// border-input -> dark gray), which renders as gray boxes on the white card
// when the OS theme is dark. Pin the auth inputs to a light look regardless
// of theme.
export const authInputClassName =
  'h-11 rounded-[14px] border-slate-200 bg-white px-4 text-slate-950 placeholder:text-slate-400 focus-visible:border-slate-950 focus-visible:ring-slate-950/10 dark:border-slate-200 dark:bg-white dark:text-slate-950 dark:placeholder:text-slate-400';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M21.805 10.023h-9.58v3.955h5.512c-.238 1.276-.962 2.356-2.044 3.085v2.563h3.309c1.937-1.784 3.053-4.413 3.053-7.529 0-.724-.065-1.421-.25-2.074z"
        fill="#4285F4"
      />
      <path
        d="M12.225 22c2.767 0 5.091-.917 6.788-2.484l-3.309-2.563c-.917.615-2.09.981-3.479.981-2.67 0-4.93-1.803-5.737-4.226H3.07v2.646C4.758 19.707 8.225 22 12.225 22z"
        fill="#34A853"
      />
      <path
        d="M6.488 13.708A5.993 5.993 0 0 1 6.17 12c0-.593.114-1.169.318-1.708V7.646H3.07A9.997 9.997 0 0 0 2 12c0 1.614.386 3.14 1.07 4.354l3.418-2.646z"
        fill="#FBBC05"
      />
      <path
        d="M12.225 6.066c1.506 0 2.858.518 3.923 1.535l2.939-2.939C17.316 3.012 14.992 2 12.225 2 8.225 2 4.758 4.293 3.07 7.646l3.418 2.646c.807-2.423 3.067-4.226 5.737-4.226z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AuthTabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors',
        active
          ? 'bg-slate-950 text-white shadow-sm'
          : 'text-slate-500 hover:text-slate-950'
      )}
    >
      {children}
    </Link>
  );
}

function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex size-10 items-center justify-center overflow-hidden rounded-[15px] bg-slate-950 shadow-sm ring-1 ring-slate-950/10',
        className
      )}
    >
      <img
        src="/logo.png"
        alt=""
        className="size-full object-cover"
        loading="eager"
      />
    </span>
  );
}

export function AuthPageShell({
  mode,
  switchQuery,
  children,
}: {
  mode: AuthMode;
  switchQuery: string;
  children: ReactNode;
}) {
  const isSignIn = mode === 'sign-in';

  return (
    <div className="min-h-svh bg-[#fbfafc] text-slate-950">
      <div className="mx-auto flex min-h-svh w-full max-w-[1120px] items-center px-0 py-0 sm:px-6 sm:py-8 lg:px-8">
        <section className="grid min-h-svh w-full overflow-hidden bg-white shadow-none sm:min-h-[720px] sm:rounded-[34px] sm:border sm:border-slate-200/80 sm:shadow-[0_28px_90px_rgba(15,23,42,0.09)] lg:grid-cols-[440px_minmax(0,1fr)]">
          <main className="flex min-h-svh flex-col px-6 py-6 sm:min-h-[680px] sm:px-10 sm:py-8 lg:px-12">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <BrandMark />
                <span className="text-base font-bold tracking-tight">
                  {envConfigs.app_name}
                </span>
              </Link>

              <Link
                href="/"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'icon' }),
                  'size-9 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-950'
                )}
                aria-label="Back to home"
              >
                <ArrowLeft className="size-4" />
              </Link>
            </div>

            <div className="mx-auto flex w-full max-w-[360px] flex-1 flex-col pt-24 pb-10 sm:pt-28 lg:pt-32">
              <div className="mb-7 grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1">
                <AuthTabLink href={`/sign-in${switchQuery}`} active={isSignIn}>
                  {m['common.sign.sign_in_title']()}
                </AuthTabLink>
                <AuthTabLink href={`/sign-up${switchQuery}`} active={!isSignIn}>
                  {m['common.sign.sign_up_title']()}
                </AuthTabLink>
              </div>
              <h1 className="sr-only">
                {isSignIn
                  ? m['common.sign.sign_in_title']()
                  : m['common.sign.sign_up_title']()}
              </h1>

              {children}
            </div>
          </main>

          <AuthProductStory />
        </section>
      </div>
    </div>
  );
}

export function AuthSocialButton({
  provider,
  onClick,
  prominent,
  children,
}: {
  provider: 'google' | 'github';
  onClick: () => void;
  prominent?: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      variant="outline"
      type="button"
      onClick={onClick}
      className={cn(
        'h-11 w-full rounded-full text-sm font-semibold',
        prominent
          ? 'border-slate-950 bg-slate-950 text-white hover:bg-slate-800 hover:text-white'
          : 'border-slate-200 bg-white text-slate-950 hover:bg-slate-50'
      )}
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-white text-slate-950">
        {provider === 'google' ? (
          <GoogleIcon className="size-5" />
        ) : (
          <Github className="size-4" />
        )}
      </span>
      {children}
    </Button>
  );
}

export function EmailButtonContent({ children }: { children: ReactNode }) {
  return (
    <>
      <Mail className="size-5" />
      {children}
    </>
  );
}
