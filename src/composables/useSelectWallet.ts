import type { Wallet } from "@/types";
import type { WalletName } from "@solana/wallet-adapter-base";
import { useLocalStorage } from "@vueuse/core";
import { Ref, shallowRef, watchEffect } from "vue";

/**
 * Selects a wallet from its name and stores it in local storage.
 * It also updates the wallet's instance when its name changes.
 */
export function useSelectWallet(
  wallets: Ref<Wallet[]>,
  localStorageKey: string
): {
  name: Ref<string | null>;
  wallet: Ref<Wallet | null>;
  select: (name: WalletName) => void;
} {
  const wallet = shallowRef<Wallet | null>(null);
  const name: Ref<WalletName | null> = useLocalStorage<WalletName>(
    localStorageKey,
    null
  );

  const select = (walletName: WalletName): void => {
    if (name.value !== walletName) {
      name.value = walletName;
    }
  };

  // Set the active wallet if the name changes or different wallets are provided.
  watchEffect(() => {
    wallet.value = name.value
      ? wallets.value.find(({ adapter }) => adapter.name === name.value) ?? null
      : null;
  });

  return { name, wallet, select };
}
