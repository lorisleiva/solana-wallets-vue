import type { Adapter, WalletError } from "@solana/wallet-adapter-base";
import type { Ref } from "vue";

export type WalletStoreProps = {
  wallets?: Adapter[] | Ref<Adapter[]>;
  autoConnect?: boolean | Ref<boolean>;
  onError?: (error: WalletError, adapter?: Adapter) => void;
  localStorageKey?: string;
};
