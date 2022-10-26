import type { Wallet } from "@/types";
import type { Adapter, WalletError } from "@solana/wallet-adapter-base";
import { Ref, watchEffect } from "vue";

/**
 * Handles the auto-connect logic of the wallet.
 */
export function useAutoConnect(
  handleError: (error: WalletError, adapter?: Adapter) => WalletError
) {
  //
}
