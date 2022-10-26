import type { Wallet } from "@/types";
import type { Adapter, WalletError } from "@solana/wallet-adapter-base";
import { Ref, watchEffect } from "vue";

/**
 * Handles the wallet adapter events.
 */
export function useAdapterListeners(
  wallet: Ref<Wallet | null>,
  name: Ref<string | null>,
  connecting: Ref<boolean>,
  disconnecting: Ref<boolean>,
  unloadingWindow: Ref<boolean>,
  handleError: (error: WalletError, adapter?: Adapter) => WalletError
) {
  watchEffect((onInvalidate) => {
    const adapter = wallet.value?.adapter;
    if (!adapter) return;

    const handleAdapterConnect = () => {
      connecting.value = false;
      disconnecting.value = false;
    };

    const handleAdapterDisconnect = () => {
      if (unloadingWindow.value) return;
      name.value = null; // TODO: Remove?
      connecting.value = false;
      disconnecting.value = false;
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
