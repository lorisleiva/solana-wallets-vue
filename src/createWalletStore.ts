import {
  Adapter,
  WalletError,
  WalletName,
  WalletNotConnectedError,
  WalletNotReadyError,
  WalletReadyState,
  SignerWalletAdapter,
  MessageSignerWalletAdapter,
  SendTransactionOptions,
} from "@solana/wallet-adapter-base";
import type {
  Connection,
  PublicKey,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import { computed, Ref, ref, shallowRef, watch, watchEffect } from "vue";
import { WalletNotSelectedError } from "./errors";
import { useLocalStorage } from "@vueuse/core";

export type Wallet = Adapter;

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
  sendTransaction(
    transaction: Transaction,
    connection: Connection,
    options?: SendTransactionOptions
  ): Promise<TransactionSignature>;

  // Optional methods.
  signTransaction: Ref<SignerWalletAdapter["signTransaction"] | undefined>;
  signAllTransactions: Ref<
    SignerWalletAdapter["signAllTransactions"] | undefined
  >;
  signMessage: Ref<MessageSignerWalletAdapter["signMessage"] | undefined>;
}

export interface WalletStoreProps {
  wallets?: Wallet[] | Ref<Wallet[]>;
  autoConnect?: boolean | Ref<boolean>;
  onError?: (error: WalletError) => void;
  localStorageKey?: string;
}

export const createWalletStore = ({
  wallets: initialWallets = [],
  autoConnect: initialAutoConnect = false,
  onError = (error: WalletError) => console.error(error),
  localStorageKey = "walletName",
}: WalletStoreProps): WalletStore => {
  // Mutable values.
  const wallets: Ref<Wallet[]> = shallowRef(initialWallets);
  const autoConnect = ref(initialAutoConnect);
  const name: Ref<WalletName | null> = useLocalStorage<WalletName>(
    localStorageKey,
    null
  );
  const wallet = shallowRef<Wallet | null>(null);
  const publicKey = ref<PublicKey | null>(null);
  const readyState = ref<WalletReadyState>(WalletReadyState.NotDetected);
  const connected = ref<boolean>(false);
  const connecting = ref<boolean>(false);
  const disconnecting = ref<boolean>(false);
  const ready = computed(
    () =>
      readyState.value === WalletReadyState.Installed ||
      readyState.value === WalletReadyState.Loadable
  );

  // Helper methods to set and reset the main state variables.
  const setWallet = (newWallet: Wallet | null) => {
    wallet.value = newWallet;
    readyState.value = newWallet?.readyState ?? WalletReadyState.NotDetected;
    publicKey.value = newWallet?.publicKey ?? null;
    connected.value = newWallet?.connected ?? false;
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
        walletsByName[wallet.name] = wallet;
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
    const _wallet = wallet.value;
    if (!_wallet) return;

    _wallet.on("readyStateChange", onReadyStateChange);
    _wallet.on("connect", onConnect);
    _wallet.on("disconnect", onDisconnect);
    _wallet.on("error", onError);

    onInvalidate(() => {
      _wallet.off("readyStateChange", onReadyStateChange);
      _wallet.off("connect", onConnect);
      _wallet.off("disconnect", onDisconnect);
      _wallet.off("error", onError);
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
        window.open(wallet.value.url, "_blank");
      }

      throw newError(new WalletNotReadyError());
    }

    try {
      connecting.value = true;
      await wallet.value.connect();
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
      await wallet.value.disconnect();
    } finally {
      name.value = null;
      disconnecting.value = false;
    }
  };

  // Send a transaction using the provided connection.
  const sendTransaction = async (
    transaction: Transaction,
    connection: Connection,
    options?: SendTransactionOptions
  ) => {
    if (!wallet.value) throw newError(new WalletNotSelectedError());
    if (!connected.value) throw newError(new WalletNotConnectedError());
    return await wallet.value.sendTransaction(transaction, connection, options);
  };

  // Sign a transaction if the wallet supports it.
  const signTransaction = computed(() => {
    const _wallet = wallet.value;
    if (!(_wallet && "signTransaction" in _wallet)) return;
    return async (transaction: Transaction) => {
      if (!connected.value) throw newError(new WalletNotConnectedError());
      return await _wallet.signTransaction(transaction);
    };
  });

  // Sign multiple transactions if the wallet adapter supports it
  const signAllTransactions = computed(() => {
    const _wallet = wallet.value;
    if (!(_wallet && "signAllTransactions" in _wallet)) return;
    return async (transactions: Transaction[]) => {
      if (!connected.value) throw newError(new WalletNotConnectedError());
      return await _wallet.signAllTransactions(transactions);
    };
  });

  // Sign an arbitrary message if the wallet adapter supports it.
  const signMessage = computed(() => {
    const _wallet = wallet.value;
    if (!(_wallet && "signMessage" in _wallet)) return;
    return async (message: Uint8Array) => {
      if (!connected.value) throw newError(new WalletNotConnectedError());
      return await _wallet.signMessage(message);
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
      await wallet.value.connect();
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
