import { SolanaMobileWalletAdapterWalletName } from "@solana-mobile/wallet-adapter-mobile";
import type { Wallet } from "@/types";
import type { Adapter, WalletError } from "@solana/wallet-adapter-base";
import { Ref, watch, watchEffect } from "vue";

/**
 * Handles the wallet adapter events.
 */
export function useAdapterListeners(
  wallet: Ref<Wallet | null>,
  unloadingWindow: Ref<boolean>,
  isUsingMwaAdapterOnMobile: Ref<boolean>,
  deselect: () => void,
  refreshWalletState: () => void,
  handleError: (error: WalletError, adapter?: Adapter) => WalletError
) {
  // Disconnect previous wallet when selecting a new one.
  watch(wallet, (newWallet, oldWallet) => {
    const newAdapter = newWallet?.adapter;
    const oldAdapter = oldWallet?.adapter;
    if (!newAdapter || !oldAdapter) return;
    if (newAdapter.name === oldAdapter.name) return;
    if (oldAdapter.name === SolanaMobileWalletAdapterWalletName) return;
    oldAdapter.disconnect();
  });

  // Add connect, disconnect and error listeners on the wallet adapter.
  watchEffect((onInvalidate) => {
    const adapter = wallet.value?.adapter;
    if (!adapter) return;

    const handleAdapterConnect = () => {
      refreshWalletState();
    };

    const handleAdapterDisconnect = () => {
      if (unloadingWindow.value || isUsingMwaAdapterOnMobile.value) return;
      deselect();
    };

    const handleAdapterError = (error: WalletError): WalletError => {
      return handleError(error, adapter);
    };

    adapter.on("connect", handleAdapterConnect);
    adapter.on("disconnect", handleAdapterDisconnect);
    adapter.on("error", handleAdapterError);

    onInvalidate(() => {
      adapter.off("connect", handleAdapterConnect);
      adapter.off("disconnect", handleAdapterDisconnect);
      adapter.off("error", handleAdapterError);
    });
  });
}
