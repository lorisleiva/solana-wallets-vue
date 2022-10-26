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
  useSelectWalletName,
  useTransactionMethods,
  useUnloadingWindow,
  useWalletState,
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
  const { name, select } = useSelectWalletName(localStorageKey);
  const {
    wallet,
    publicKey,
    connected,
    readyState,
    ready,
    refreshWalletState,
  } = useWalletState(wallets, name);

  useReadyStateListeners(wallets);
  useAdapterListeners(
    wallet,
    name,
    unloadingWindow,
    refreshWalletState,
    handleError
  );

  // Connect the wallet.
  const connect = async (): Promise<void> => {
    if (connected.value || connecting.value || disconnecting.value) return;
    if (!wallet.value) throw handleError(new WalletNotSelectedError());
    const adapter = wallet.value.adapter;
    if (!ready.value) throw handleError(new WalletNotReadyError(), adapter);

    try {
      connecting.value = true;
      await adapter.connect();
    } catch (error: any) {
      // TODO: Don't disconnect if SolanaMobileWalletAdapterWalletName
      name.value = null;

      // handleError will also be called.
      throw error;
    } finally {
      connecting.value = false;
    }
  };

  // Disconnect the wallet adapter.
  const disconnect = async (): Promise<void> => {
    if (disconnecting.value || !wallet.value) return;
    try {
      disconnecting.value = true;
      await wallet.value.adapter.disconnect();
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
