import type {
  MessageSignerWalletAdapterProps,
  SignerWalletAdapterProps,
  WalletAdapterProps,
  WalletName,
  WalletReadyState,
} from "@solana/wallet-adapter-base";
import type { Cluster, PublicKey } from "@solana/web3.js";
import type { Ref } from "vue";
import type { Wallet } from "./Wallet";

export type WalletStore = {
  // Props.
  wallets: Ref<Wallet[]>;
  autoConnect: Ref<boolean>;
  cluster: Ref<Cluster>;

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
};
