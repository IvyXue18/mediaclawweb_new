export const THEME_TRANSITION_STORAGE_KEY =
  'mediaclaw:disable-theme-transition';

const DISABLE_TRANSITIONS_STYLE_ID = 'mediaclaw-disable-theme-transitions';
const DISABLE_TRANSITIONS_CSS =
  '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}';

export function suppressThemeTransitions() {
  if (typeof document === 'undefined') return;

  document.getElementById(DISABLE_TRANSITIONS_STYLE_ID)?.remove();

  const style = document.createElement('style');
  style.id = DISABLE_TRANSITIONS_STYLE_ID;
  style.appendChild(document.createTextNode(DISABLE_TRANSITIONS_CSS));
  (document.head || document.documentElement).appendChild(style);

  const removeStyle = () => {
    window.setTimeout(() => {
      style.remove();
    }, 120);
  };

  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(removeStyle);
    });
  } else {
    removeStyle();
  }
}

export function prepareThemeStableNavigation() {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(THEME_TRANSITION_STORAGE_KEY, '1');
  } catch {
    // Storage can be unavailable in restrictive browser modes.
  }

  suppressThemeTransitions();
}
