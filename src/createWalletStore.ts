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
import type { PublicKey, Transaction } from "@solana/web3.js";
import { useLocalStorage } from "@vueuse/core";
import type { Ref } from "vue";
import { computed, ref, shallowRef, watch, watchEffect } from "vue";
import { WalletNotSelectedError } from "./errors";

export type Wallet = {
  adapter: Adapter;
  readyState: WalletReadyState;
};

export interface WalletStore {
  // Props.
  wallets: Ref<Wallet[]>;
  autoConnect: Ref<boolean>;

  // Data.
  wallet: Ref<Wallet | null>;
  publicKey: Ref<PublicKey | null>;
  readyState: Ref<WalletReadyState>;
  ready: Ref<boolean>;
  connected: Ref<boolean>;
  connecting: Ref<boolean>;
  disconnecting: Ref<boolean>;

  // Methods.
  select(walletName: WalletName): void;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendTransaction: WalletAdapterProps["sendTransaction"];

  // Optional methods.
  signTransaction: Ref<SignerWalletAdapterProps["signTransaction"] | undefined>;
  signAllTransactions: Ref<
    SignerWalletAdapterProps["signAllTransactions"] | undefined
  >;
  signMessage: Ref<MessageSignerWalletAdapterProps["signMessage"] | undefined>;
}

export interface WalletStoreProps {
  wallets?: Adapter[] | Ref<Adapter[]>;
  autoConnect?: boolean | Ref<boolean>;
  onError?: (error: WalletError) => void;
  localStorageKey?: string;
}

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
  const ready = computed(
    () =>
      readyState.value === WalletReadyState.Installed ||
      readyState.value === WalletReadyState.Loadable
  );

  // Map adapters to wallets.
  const wallets = shallowRef<Wallet[]>([]);
  watch(adapters, (newAdapters) => {
    wallets.value = newAdapters.map((newAdapter) => ({
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

  // Helper method to return an error whilst using the onError callback.
  const newError = (error: WalletError): WalletError => {
    onError(error);
    return error;
  };

  // Create a dictionary of wallet adapters keyed by their name.
  const walletsByName = computed(() => {
    return wallets.value.reduce<Record<WalletName, Wallet>>(
      (walletsByName, wallet) => {
        walletsByName[wallet.adapter.name] = wallet;
        return walletsByName;
      },
      {}
    );
  });

  // Update the wallet adapter based on the wallet provider.
  watch(
    name,
    (): void => {
      setWallet(walletsByName.value?.[name.value as WalletName] ?? null);
    },
    { immediate: true }
  );

  // Select a wallet adapter by name.
  const select = async (walletName: WalletName): Promise<void> => {
    if (name.value === walletName) return;
    name.value = walletName;
  };

  // Handle the wallet adapter events.
  const onReadyStateChange = () => setWallet(wallet.value);
  const onConnect = () => setWallet(wallet.value);
  const onDisconnect = () => (name.value = null);
  const invalidateListeners = watchEffect((onInvalidate) => {
    const adapter = wallet.value?.adapter;
    if (!adapter) return;

    adapter.on("readyStateChange", onReadyStateChange);
    adapter.on("connect", onConnect);
    adapter.on("disconnect", onDisconnect);
    adapter.on("error", onError);

    onInvalidate(() => {
      adapter.off("readyStateChange", onReadyStateChange);
      adapter.off("connect", onConnect);
      adapter.off("disconnect", onDisconnect);
      adapter.off("error", onError);
    });
  });

  if (typeof window !== "undefined") {
    // Ensure the wallet listeners are invalidated before refreshing the page.
    // This is because Vue does not unmount components when the page is being refreshed.
    window.addEventListener("unload", invalidateListeners);
  }

  // Connect the wallet.
  const connect = async (): Promise<void> => {
    if (connected.value || connecting.value || disconnecting.value) return;
    if (!wallet.value) throw newError(new WalletNotSelectedError());

    if (!ready.value) {
      name.value = null;

      if (typeof window !== "undefined") {
        window.open(wallet.value.adapter.url, "_blank");
      }

      throw newError(new WalletNotReadyError());
    }

    try {
      connecting.value = true;
      await wallet.value.adapter.connect();
    } catch (error: any) {
      name.value = null;
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
    } finally {
      name.value = null;
      disconnecting.value = false;
    }
  };

  // Send a transaction using the provided connection.
  const sendTransaction: WalletAdapterProps["sendTransaction"] = async (
    transaction,
    connection,
    options?
  ) => {
    if (!wallet.value) throw newError(new WalletNotSelectedError());
    if (!connected.value) throw newError(new WalletNotConnectedError());
    return await wallet.value.adapter.sendTransaction(
      transaction,
      connection,
      options
    );
  };

  // Sign a transaction if the wallet supports it.
  const signTransaction = computed<
    SignerWalletAdapterProps["signTransaction"] | undefined
  >(() => {
    const adapter = wallet.value?.adapter;
    if (!(adapter && "signTransaction" in adapter)) return;
    return async (transaction) => {
      if (!connected.value) throw newError(new WalletNotConnectedError());
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
      if (!connected.value) throw newError(new WalletNotConnectedError());
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
      if (!connected.value) throw newError(new WalletNotConnectedError());
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
    )
      return;
    try {
      connecting.value = true;
      await wallet.value.adapter.connect();
    } catch (error: any) {
      // Clear the selected wallet
      name.value = null;
      // Don't throw error, but onError will still be called
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
