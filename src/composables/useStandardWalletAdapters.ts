import type { Adapter, WalletName } from "@solana/wallet-adapter-base";
import { computed, Ref, shallowRef, watchEffect } from "vue";
import {
  isWalletAdapterCompatibleWallet,
  StandardWalletAdapter,
} from "@solana/wallet-standard-wallet-adapter-base";
import { DEPRECATED_getWallets } from "@wallet-standard/app";
import type { Wallet } from "@wallet-standard/base";

/**
 * Auto-discovers wallet adapters that follows the wallet standard
 * and adds them to the list of registered adapters.
 */
export function useStandardWalletAdapters(
  adapters: Ref<Adapter[]>
): Ref<Adapter[]> {
  const warnings = new Set<WalletName>();
  const { get, on } = DEPRECATED_getWallets();
  const swaAdapters = shallowRef<Readonly<StandardWalletAdapter[]>>(
    wrapWalletsInAdapters(get())
  );

  watchEffect((onInvalidate) => {
    const listeners = [
      on("register", (...wallets) => {
        return (swaAdapters.value = [
          ...swaAdapters.value,
          ...wrapWalletsInAdapters(wallets),
        ]);
      }),
      on("unregister", (...wallets) => {
        return (swaAdapters.value = swaAdapters.value.filter((swaAdapter) =>
          wallets.some((wallet) => wallet === swaAdapter.wallet)
        ));
      }),
    ];

    onInvalidate(() => listeners.forEach((destroy) => destroy()));
  });

  return computed<Adapter[]>(() => [
    ...swaAdapters.value,
    ...adapters.value.filter(({ name }: Adapter) => {
      if (swaAdapters.value.some((swaAdapter) => swaAdapter.name === name)) {
        if (!warnings.has(name)) {
          warnings.add(name);
          console.warn(
            `${name} was registered as a Standard Wallet. The Wallet Adapter for ${name} can be removed from your app.`
          );
        }
        return false;
      }
      return true;
    }),
  ]);
}

function wrapWalletsInAdapters(
  wallets: ReadonlyArray<Wallet>
): ReadonlyArray<StandardWalletAdapter> {
  return wallets
    .filter(isWalletAdapterCompatibleWallet)
    .map((wallet) => new StandardWalletAdapter({ wallet }));
}
