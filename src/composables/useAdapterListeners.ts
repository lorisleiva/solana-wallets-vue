import type { Wallet } from "@/types";
import type { Adapter, WalletError } from "@solana/wallet-adapter-base";
import { Ref, watchEffect } from "vue";

/**
 * Handles the wallet adapter events.
 */
export function useAdapterListeners(
  wallet: Ref<Wallet | null>,
  name: Ref<string | null>,
  unloadingWindow: Ref<boolean>,
  refreshWalletState: () => void,
  handleError: (error: WalletError, adapter?: Adapter) => WalletError
) {
  watchEffect((onInvalidate) => {
    const adapter = wallet.value?.adapter;
    if (!adapter) return;

    const handleAdapterConnect = () => {
      refreshWalletState();
    };

    const handleAdapterDisconnect = () => {
      if (unloadingWindow.value) return;
      // TODO: Return early if SolanaMobileWalletAdapterWalletName
      name.value = null;
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
