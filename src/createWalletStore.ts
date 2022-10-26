import type { Adapter } from "@solana/wallet-adapter-base";
import { WalletNotReadyError } from "@solana/wallet-adapter-base";
import type { Ref } from "vue";
import { ref, shallowRef } from "vue";
import {
  useAdapterListeners,
  useAutoConnect,
  useErrorHandler,
  useMobileWalletAdapters,
  useReadyStateListeners,
  useSelectWalletName,
  useStandardWalletAdapters,
  useTransactionMethods,
  useUnloadingWindow,
  useWalletState,
  useWrapAdaptersInWallets,
} from "./composables";
import { WalletNotSelectedError } from "./errors";
import type { WalletStore, WalletStoreProps } from "./types";

export const createWalletStore = ({
  wallets: initialAdapters = [],
  autoConnect: initialAutoConnect = false,
  onError,
  localStorageKey = "walletName",
}: WalletStoreProps): WalletStore => {
  // Loading states and error handling.
  const connecting = ref<boolean>(false);
  const disconnecting = ref<boolean>(false);
  const unloadingWindow = useUnloadingWindow();
  const handleError = useErrorHandler(unloadingWindow, onError);

  // From raw adapters to computed list of wallets.
  const rawAdapters: Ref<Adapter[]> = shallowRef(initialAdapters);
  const rawAdaptersWithSwa = useStandardWalletAdapters(rawAdapters);
  const adapters = useMobileWalletAdapters(rawAdaptersWithSwa);
  const wallets = useWrapAdaptersInWallets(adapters);

  // Wallet selection and state.
  const { name, select, deselect } = useSelectWalletName(localStorageKey);
  const {
    wallet,
    publicKey,
    connected,
    readyState,
    ready,
    refreshWalletState,
  } = useWalletState(wallets, name);

  // Wallet listeners.
  useReadyStateListeners(wallets);
  useAdapterListeners(
    wallet,
    unloadingWindow,
    deselect,
    refreshWalletState,
    handleError
  );

  // Auto-connect feature.
  const autoConnect = useAutoConnect(
    initialAutoConnect,
    wallet,
    connecting,
    connected,
    ready,
    deselect
  );

  // Transaction methods.
  const { sendTransaction, signTransaction, signAllTransactions, signMessage } =
    useTransactionMethods(wallet, handleError);

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
      deselect();

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
