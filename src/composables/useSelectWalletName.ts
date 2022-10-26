import type { WalletName } from "@solana/wallet-adapter-base";
import { useLocalStorage } from "@vueuse/core";
import { Ref } from "vue";

/**
 * Selects a wallet from its name and stores it in local storage.
 */
export function useSelectWalletName(localStorageKey: string): {
  name: Ref<string | null>;
  select: (name: WalletName) => void;
  deselect: () => void;
} {
  const name: Ref<WalletName | null> = useLocalStorage<WalletName>(
    localStorageKey,
    null
  );

  const select = (walletName: WalletName): void => {
    if (name.value !== walletName) {
      name.value = walletName;
    }
  };

  const deselect = (): void => {
    name.value = null;
  };

  return { name, select, deselect };
}
