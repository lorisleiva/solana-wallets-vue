import { SolanaMobileWalletAdapterWalletName } from "@solana-mobile/wallet-adapter-mobile";
import type { WalletName } from "@solana/wallet-adapter-base";
import { useLocalStorage } from "@vueuse/core";
import { computed, Ref } from "vue";

/**
 * Selects a wallet from its name and stores it in local storage.
 */
export function useSelectWalletName(
  localStorageKey: string,
  isMobile: Ref<boolean>
): {
  name: Ref<string | null>;
  isUsingMwaAdapter: Ref<boolean>;
  isUsingMwaAdapterOnMobile: Ref<boolean>;
  select: (name: WalletName) => void;
  deselect: () => void;
} {
  const name: Ref<WalletName | null> = useLocalStorage<WalletName | null>(
    localStorageKey,
    isMobile.value ? SolanaMobileWalletAdapterWalletName : null
  );

  const isUsingMwaAdapter = computed<boolean>(
    () => name.value === SolanaMobileWalletAdapterWalletName
  );

  const isUsingMwaAdapterOnMobile = computed<boolean>(
    () => isUsingMwaAdapter.value && isMobile.value
  );

  const select = (walletName: WalletName): void => {
    if (name.value !== walletName) {
      name.value = walletName;
    }
  };

  const deselect = (): void => {
    name.value = null;
  };

  return {
    name,
    isUsingMwaAdapter,
    isUsingMwaAdapterOnMobile,
    select,
    deselect,
  };
}
