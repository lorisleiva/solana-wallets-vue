import type { Wallet } from "@/types";
import type {
  Adapter,
  MessageSignerWalletAdapterProps,
  SignerWalletAdapterProps,
  WalletAdapterProps,
  WalletError,
} from "@solana/wallet-adapter-base";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { computed, Ref } from "vue";
import { WalletNotSelectedError } from "../errors";

/**
 * Gets all the methods that can be used to interact with the wallet.
 * This includes sending transactions, signing transaction and signing messages.
 */
export function useTransactionMethods(
  wallet: Ref<Wallet | null>,
  handleError: (error: WalletError, adapter?: Adapter) => WalletError
) {
  // Send a transaction using the provided connection.
  const sendTransaction: WalletAdapterProps["sendTransaction"] = async (
    transaction,
    connection,
    options?
  ) => {
    const adapter = wallet.value?.adapter;
    if (!adapter) throw handleError(new WalletNotSelectedError());
    if (!adapter.connected)
      throw handleError(new WalletNotConnectedError(), adapter);
    return await adapter.sendTransaction(transaction, connection, options);
  };

  // Sign a transaction if the wallet supports it.
  const signTransaction = computed<
    SignerWalletAdapterProps["signTransaction"] | undefined
  >(() => {
    const adapter = wallet.value?.adapter;
    if (!(adapter && "signTransaction" in adapter)) return;
    return async (transaction) => {
      if (!adapter.connected) throw handleError(new WalletNotConnectedError());
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
      if (!adapter.connected) throw handleError(new WalletNotConnectedError());
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
      if (!adapter.connected) throw handleError(new WalletNotConnectedError());
      return await adapter.signMessage(message);
    };
  });

  return {
    sendTransaction,
    signTransaction,
    signAllTransactions,
    signMessage,
  };
}
