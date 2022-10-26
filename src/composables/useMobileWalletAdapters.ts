import type { Adapter } from "@solana/wallet-adapter-base";
import { Ref } from "vue";

/**
 * Auto-discovers wallet adapters that follows the mobile wallet standard
 * and adds them to the list of registered adapters.
 */
export function useMobileWalletAdapters(
  adapters: Ref<Adapter[]>
): Ref<Adapter[]> {
  // TODO
  return adapters;
}
