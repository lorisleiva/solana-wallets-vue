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
import { useReadyStateListeners } from "./composables";

export const createWalletStore = ({
  wallets: initialAdapters = [],
  autoConnect: initialAutoConnect = false,
  onError = (error: WalletError) => console.error(error),
  localStorageKey = "walletName",
}: WalletStoreProps): WalletStore => {
  // Mutable values.
  const adapters: Ref<Adapter[]> = shallowRef(initialAdapters);
  const autoConnect = ref(initialAutoConnect);
  const name: Ref<WalletName | null> = useLocalStorage<WalletName>(
    localStorageKey,
    null
  );
  const wallet = shallowRef<Wallet | null>(null);
  const publicKey = ref<PublicKey | null>(null);
  const readyState = ref<WalletReadyState>(WalletReadyState.Unsupported);
  const connected = ref<boolean>(false);
  const connecting = ref<boolean>(false);
  const disconnecting = ref<boolean>(false);
  const unloadingWindow = ref<boolean>(false);
  const ready = computed(
    () =>
      readyState.value === WalletReadyState.Installed ||
      readyState.value === WalletReadyState.Loadable
  );

  // Map adapters to wallets.
  const wallets = shallowRef<Wallet[]>([]);
  watchEffect(() => {
    wallets.value = adapters.value.map((newAdapter) => ({
      adapter: newAdapter,
      readyState: newAdapter.readyState,
    }));
  });

  // Helper methods to set and reset the main state variables.
  const setWallet = (newWallet: Wallet | null) => {
    wallet.value = newWallet;
    readyState.value = newWallet?.readyState ?? WalletReadyState.NotDetected;
    publicKey.value = newWallet?.adapter.publicKey ?? null;
    connected.value = newWallet?.adapter.connected ?? false;
  };

  // Set the active wallet if the name changes or different wallets are provided.
  watchEffect(() => {
    const foundWallet =
      name.value &&
      wallets.value.find(({ adapter }) => adapter.name === name.value);
    setWallet(foundWallet ?? null);
  });

  // If the window is closing or reloading, ignore disconnect and error events from the adapter
  watchEffect((onInvalidate) => {
    const handler = () => (unloadingWindow.value = true);
    window.addEventListener("beforeunload", handler);
    onInvalidate(() => window.removeEventListener("beforeunload", handler));
  });

  useReadyStateListeners(wallets);

  // Select a wallet adapter by name.
  const select = async (walletName: WalletName): Promise<void> => {
    if (name.value === walletName) return;
    name.value = walletName;
  };

  // Handle the wallet adapter events.
  const handleConnect = () => setWallet(wallet.value);
  const handleDisconnect = () => {
    if (unloadingWindow.value) return;
    name.value = null;
  };
  const handleError = (error: WalletError): WalletError => {
    if (!unloadingWindow.value) onError(error);
    return error;
  };
  watchEffect((onInvalidate) => {
    const adapter = wallet.value?.adapter;
    if (!adapter) return;

    adapter.on("connect", handleConnect);
    adapter.on("disconnect", handleDisconnect);
    adapter.on("error", handleError);

    onInvalidate(() => {
      adapter.off("connect", handleConnect);
      adapter.off("disconnect", handleDisconnect);
      adapter.off("error", handleError);
    });
  });

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

  // Send a transaction using the provided connection.
  const sendTransaction: WalletAdapterProps["sendTransaction"] = async (
    transaction,
    connection,
    options?
  ) => {
    const adapter = wallet.value?.adapter;
    if (!adapter) throw handleError(new WalletNotSelectedError());
    if (!connected.value) throw handleError(new WalletNotConnectedError());
    return await adapter.sendTransaction(transaction, connection, options);
  };

  // Sign a transaction if the wallet supports it.
  const signTransaction = computed<
    SignerWalletAdapterProps["signTransaction"] | undefined
  >(() => {
    const adapter = wallet.value?.adapter;
    if (!(adapter && "signTransaction" in adapter)) return;
    return async (transaction) => {
      if (!connected.value) throw handleError(new WalletNotConnectedError());
      return await adapter.signTransaction(transaction);
    };
  });

  // Sign multiple transactions if the wallet adapter supports it
  const signAllTransactions = computed<
    SignerWalletAdapterProps["signAllTransactions"] | undefined
  >(() => {
    const adapter = wallet.value?.adapter;
    if (!(adapter && "signAllTransactions" in adapter)) return;
    return async (transactions) => {
      if (!connected.value) throw handleError(new WalletNotConnectedError());
      return await adapter.signAllTransactions(transactions);
    };
  });

  // Sign an arbitrary message if the wallet adapter supports it.
  const signMessage = computed<
    MessageSignerWalletAdapterProps["signMessage"] | undefined
  >(() => {
    const adapter = wallet.value?.adapter;
    if (!(adapter && "signMessage" in adapter)) return;
    return async (message: Uint8Array) => {
      if (!connected.value) throw handleError(new WalletNotConnectedError());
      return await adapter.signMessage(message);
    };
  });

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
