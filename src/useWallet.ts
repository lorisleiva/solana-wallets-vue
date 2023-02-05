import { WalletNotInitializedError } from "./errors";
import { createWalletStore } from "./createWalletStore";
import type { WalletStore, WalletStoreProps } from "./types";

let walletStore: WalletStore | null = null;

export const useWallet = (): WalletStore => {
  if (walletStore) return walletStore;
  throw new WalletNotInitializedError(
    "Wallet not initialized. Please use the `initWallet` method to initialize the wallet."
  );
};

export const initWallet = (walletStoreProps: WalletStoreProps): void => {
  walletStore = createWalletStore(walletStoreProps);
};
