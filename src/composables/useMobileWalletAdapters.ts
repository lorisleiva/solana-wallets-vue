import {
  createDefaultAddressSelector,
  createDefaultAuthorizationResultCache,
  createDefaultWalletNotFoundHandler,
  SolanaMobileWalletAdapter,
  SolanaMobileWalletAdapterWalletName,
} from "@solana-mobile/wallet-adapter-mobile";
import type { Adapter } from "@solana/wallet-adapter-base";
import { computed, Ref } from "vue";

/**
 * Auto-discovers wallet adapters that follows the mobile wallet standard
 * and adds them to the list of registered adapters.
 */
export function useMobileWalletAdapters(
  adapters: Ref<Adapter[]>,
  isMobile: Ref<boolean>,
  uriForAppIdentity: string | null
): Ref<Adapter[]> {
  const mwaAdapter = computed(() => {
    if (!isMobile.value) return null;

    const existingMobileWalletAdapter = adapters.value.find(
      (adapter) => adapter.name === SolanaMobileWalletAdapterWalletName
    );
    if (existingMobileWalletAdapter) {
      return existingMobileWalletAdapter;
    }
    return new SolanaMobileWalletAdapter({
      addressSelector: createDefaultAddressSelector(),
      appIdentity: { uri: uriForAppIdentity || undefined },
      authorizationResultCache: createDefaultAuthorizationResultCache(),
      cluster: "mainnet-beta",
      onWalletNotFound: createDefaultWalletNotFoundHandler(),
    });
  });

  return computed(() => {
    if (
      mwaAdapter.value == null ||
      adapters.value.indexOf(mwaAdapter.value) !== -1
    ) {
      return adapters.value;
    }

    return [mwaAdapter.value, ...adapters.value];
  });
}
