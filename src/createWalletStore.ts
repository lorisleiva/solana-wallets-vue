import {
  WalletReadyState,
  WalletNotReadyError,
  WalletNotConnectedError,
} from "@solana/wallet-adapter-base";
import type {
  Adapter,
  MessageSignerWalletAdapterProps,
  SignerWalletAdapterProps,
  WalletAdapterProps,
  WalletError,
  WalletName,
} from "@solana/wallet-adapter-base";
import type { PublicKey } from "@solana/web3.js";
import { useLocalStorage } from "@vueuse/core";
import type { Ref } from "vue";
import { computed, ref, shallowRef, watch, watchEffect } from "vue";
import { WalletNotSelectedError } from "./errors";
import type { Wallet, WalletStore, WalletStoreProps } from "./types";
import {
  useAdapterListeners,
  useErrorHandler,
  useReadyStateListeners,
  useSelectWallet,
  useTransactionMethods,
  useUnloadingWindow,
  useWrapAdaptersInWallets,
} from "./composables";

export const createWalletStore = ({
  wallets: initialAdapters = [],
  autoConnect: initialAutoConnect = false,
  onError,
  localStorageKey = "walletName",
}: WalletStoreProps): WalletStore => {
  const unloadingWindow = useUnloadingWindow();
  const handleError = useErrorHandler(unloadingWindow, onError);

  // Mutable values.
  const adapters: Ref<Adapter[]> = shallowRef(initialAdapters);
  const autoConnect = ref(initialAutoConnect);
  const connecting = ref<boolean>(false);
  const disconnecting = ref<boolean>(false);

  const wallets = useWrapAdaptersInWallets(adapters);
  const { name, wallet, select } = useSelectWallet(wallets, localStorageKey);

  // Computed values.
  const publicKey = computed<PublicKey | null>(() => {
    return wallet.value?.adapter.publicKey ?? null;
  });
  const connected = computed<boolean>(() => {
    return wallet.value?.adapter.connected ?? false;
  });
  const readyState = computed<WalletReadyState>(() => {
    return wallet.value?.readyState ?? WalletReadyState.NotDetected;
  });
  const ready = computed<boolean>(() => {
    return (
      readyState.value === WalletReadyState.Installed ||
      readyState.value === WalletReadyState.Loadable
    );
  });

  useReadyStateListeners(wallets);
  useAdapterListeners(
    wallet,
    name,
    connecting,
    disconnecting,
    unloadingWindow,
    handleError
  );

  // Connect the wallet.
  const connect = async (): Promise<void> => {
    if (connected.value || connecting.value || disconnecting.value) return;
    if (!wallet.value) throw handleError(new WalletNotSelectedError());
    const adapter = wallet.value.adapter;

    if (!ready.value) {
      name.value = null;

      if (typeof window !== "undefined") {
        window.open(adapter.url, "_blank");
      }

      throw handleError(new WalletNotReadyError());
    }

    try {
      connecting.value = true;
      await adapter.connect();
    } catch (error: any) {
      name.value = null;
      // handleError will also be called.
      throw error;
    } finally {
      connecting.value = false;
    }
  };

  // Disconnect the wallet adapter.
  const disconnect = async (): Promise<void> => {
    if (disconnecting.value) return;
    if (!wallet.value) {
      name.value = null;
      return;
    }

    try {
      disconnecting.value = true;
      await wallet.value.adapter.disconnect();
    } catch (error: any) {
      name.value = null;
      // handleError will also be called.
      throw error;
    } finally {
      disconnecting.value = false;
    }
  };

  const { sendTransaction, signTransaction, signAllTransactions, signMessage } =
    useTransactionMethods(wallet, handleError);

  // If autoConnect is enabled, try to connect when the wallet adapter changes and is ready.
  watchEffect(async (): Promise<void> => {
    if (
      !autoConnect.value ||
      !wallet.value ||
      !ready.value ||
      connected.value ||
      connecting.value
    ) {
      return;
    }

    try {
      connecting.value = true;
      await wallet.value.adapter.connect();
    } catch (error: any) {
      name.value = null;
      // Don't throw error, but handleError will still be called.
    } finally {
      connecting.value = false;
    }
  });

  // Return the created store.
  return {
    // Props.
    wallets,
    autoConnect,

    // Data.
    wallet,
    publicKey,
    readyState,
    ready,
    connected,
    connecting,
    disconnecting,

    // Methods.
    select,
    connect,
    disconnect,
    sendTransaction,
    signTransaction,
    signAllTransactions,
    signMessage,
  };
};
