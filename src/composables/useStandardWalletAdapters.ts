import type { Adapter } from "@solana/wallet-adapter-base";
import { Ref } from "vue";

/**
 * Auto-discovers wallet adapters that follows the wallet standard
 * and adds them to the list of registered adapters.
 */
export function useStandardWalletAdapters(
  adapters: Ref<Adapter[]>
): Ref<Adapter[]> {
  // TODO
  return adapters;
}
