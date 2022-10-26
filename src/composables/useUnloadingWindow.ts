import { ref, Ref, watchEffect } from "vue";

/**
 * Provides a boolean that tells us if the window is unloading.
 * This is only relevant in the browser.
 */
export function useUnloadingWindow(): Ref<boolean> {
  const unloadingWindow = ref<boolean>(false);

  if (typeof window !== "undefined") {
    watchEffect((onInvalidate) => {
      const handler = () => (unloadingWindow.value = true);
      window.addEventListener("beforeunload", handler);
      onInvalidate(() => window.removeEventListener("beforeunload", handler));
    });
  }

  return unloadingWindow;
}
