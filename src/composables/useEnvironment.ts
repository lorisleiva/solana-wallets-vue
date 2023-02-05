import { SolanaMobileWalletAdapterWalletName } from "@solana-mobile/wallet-adapter-mobile";
import type { Adapter } from "@solana/wallet-adapter-base";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { computed, Ref } from "vue";

export enum Environment {
  DESKTOP_WEB,
  MOBILE_WEB,
}

export function useEnvironment(adapters: Ref<Adapter[]>): {
  userAgent: string | null;
  uriForAppIdentity: string | null;
  environment: Ref<Environment>;
  isMobile: Ref<boolean>;
} {
  const userAgent = getUserAgent();
  const uriForAppIdentity = getUriForAppIdentity();
  const environment = computed(() => getEnvironment(adapters.value, userAgent));
  const isMobile = computed(() => environment.value === Environment.MOBILE_WEB);

  return {
    userAgent,
    uriForAppIdentity,
    environment,
    isMobile,
  };
}

let _userAgent: string | null;
function getUserAgent() {
  if (_userAgent === undefined) {
    _userAgent = globalThis.navigator?.userAgent ?? null;
  }
  return _userAgent;
}

function getUriForAppIdentity(): string | null {
  const location = globalThis.location;
  if (location == null) return null;
  return `${location.protocol}//${location.host}`;
}

function getEnvironment(
  adapters: Adapter[],
  userAgent: string | null
): Environment {
  const hasInstalledAdapters = adapters.some(
    (adapter) =>
      adapter.name !== SolanaMobileWalletAdapterWalletName &&
      adapter.readyState === WalletReadyState.Installed
  );

  /**
   * There are only two ways a browser extension adapter should be able to reach `Installed` status:
   *
   *     1. Its browser extension is installed.
   *     2. The app is running on a mobile wallet's in-app browser.
   *
   * In either case, we consider the environment to be desktop-like.
   */
  if (hasInstalledAdapters) {
    return Environment.DESKTOP_WEB;
  }

  const isMobile =
    userAgent &&
    // Check we're on a platform that supports MWA.
    isOsThatSupportsMwa(userAgent) &&
    // Ensure we are *not* running in a WebView.
    !isWebView(userAgent);

  if (isMobile) {
    return Environment.MOBILE_WEB;
  }

  return Environment.DESKTOP_WEB;
}

function isOsThatSupportsMwa(userAgent: string) {
  return /android/i.test(userAgent);
}

function isWebView(userAgent: string) {
  return /(WebView|Version\/.+(Chrome)\/(\d+)\.(\d+)\.(\d+)\.(\d+)|; wv\).+(Chrome)\/(\d+)\.(\d+)\.(\d+)\.(\d+))/i.test(
    userAgent
  );
}
