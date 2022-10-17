<script lang="ts">
import type { Wallet } from "@/createWalletStore";
import { useWallet } from "@/useWallet";
import { WalletName, WalletReadyState } from "@solana/wallet-adapter-base";
import { onClickOutside, onKeyStroke, useScrollLock } from "@vueuse/core";
import {
  computed,
  defineComponent,
  nextTick,
  Ref,
  ref,
  toRefs,
  watch,
} from "vue";
import WalletIcon from "./WalletIcon.vue";

type WalletModalProviderRawBindings = WalletModelProviderScope & {
  scope: WalletModelProviderScope;
};

type WalletModelProviderScope = {
  dark: Ref<boolean>;
  logo: Ref<string | undefined>;
  hasLogo: Ref<boolean>;
  featured: Ref<number>;
  container: Ref<string>;
  modalPanel: Ref<HTMLElement | null>;
  modalOpened: Ref<boolean>;
  openModal: () => void;
  closeModal: () => void;
  expandedWallets: Ref<boolean>;
  walletsToDisplay: Ref<Wallet[]>;
  featuredWallets: Ref<Wallet[]>;
  hiddenWallets: Ref<Wallet[]>;
  selectWallet: (name: WalletName) => void;
};

export default defineComponent({
  components: {
    WalletIcon,
  },
  props: {
    featured: { type: Number, default: 3 },
    container: { type: String, default: "body" },
    logo: String,
    dark: Boolean,
  },
  setup(this: void, props, { slots }): WalletModalProviderRawBindings {
    const { featured, container, logo, dark } = toRefs(props);
    const modalPanel = ref(null) as Ref<HTMLElement | null>;
    const modalOpened = ref(false);
    const openModal = () => (modalOpened.value = true);
    const closeModal = () => (modalOpened.value = false);
    const hasLogo = computed(() => !!slots.logo || !!logo.value);

    const { wallets, select: selectWallet } = useWallet();
    const orderedWallets = computed(() => {
      const installed: Wallet[] = [];
      const notDetected: Wallet[] = [];
      const loadable: Wallet[] = [];

      wallets.value.forEach((wallet) => {
        if (wallet.readyState === WalletReadyState.NotDetected) {
          notDetected.push(wallet);
        } else if (wallet.readyState === WalletReadyState.Loadable) {
          loadable.push(wallet);
        } else if (wallet.readyState === WalletReadyState.Installed) {
          installed.push(wallet);
        }
      });

      return [...installed, ...loadable, ...notDetected];
    });

    const expandedWallets = ref(false);
    const featuredWallets = computed(() =>
      orderedWallets.value.slice(0, featured.value)
    );
    const hiddenWallets = computed(() =>
      orderedWallets.value.slice(featured.value)
    );
    const walletsToDisplay = computed(() =>
      expandedWallets.value ? wallets.value : featuredWallets.value
    );

    // Close the modal when clicking outside of it or when pressing Escape.
    onClickOutside(modalPanel, closeModal);
    onKeyStroke("Escape", closeModal);

    // Ensures pressing Tab backwards and forwards stays within the modal.
    onKeyStroke("Tab", (event: KeyboardEvent) => {
      const focusableElements =
        modalPanel.value?.querySelectorAll("button") ?? [];
      const firstElement = focusableElements?.[0];
      const lastElement = focusableElements?.[focusableElements.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === firstElement &&
        lastElement
      ) {
        lastElement.focus();
        event.preventDefault();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement &&
        firstElement
      ) {
        firstElement.focus();
        event.preventDefault();
      }
    });

    // Bring focus inside the modal when it opens.
    watch(modalOpened, (isOpened) => {
      if (!isOpened) return;
      nextTick(() =>
        modalPanel.value?.querySelectorAll("button")?.[0]?.focus()
      );
    });

    // Lock the body scroll when the modal opens.
    const scrollLock = useScrollLock(document.body);
    watch(modalOpened, (isOpened) => (scrollLock.value = isOpened));

    // Define the bindings given to scoped slots.
    const scope = {
      dark,
      logo,
      hasLogo,
      featured,
      container,
      modalPanel,
      modalOpened,
      openModal,
      closeModal,
      expandedWallets,
      walletsToDisplay,
      featuredWallets,
      hiddenWallets,
      selectWallet,
    };

    return {
      scope,
      ...scope,
    };
  },
});
</script>

<template>
  <div :class="dark ? 'swv-dark' : ''">
    <slot v-bind="scope"></slot>
  </div>
  <teleport :to="container" v-if="modalOpened">
    <div
      aria-labelledby="swv-modal-title"
      aria-modal="true"
      class="swv-modal"
      :class="dark ? 'swv-dark' : ''"
      role="dialog"
    >
      <slot name="overlay" v-bind="scope">
        <div class="swv-modal-overlay" />
      </slot>
      <div class="swv-modal-container" ref="modalPanel">
        <slot name="modal" v-bind="scope">
          <div
            class="swv-modal-wrapper"
            :class="{ 'swv-modal-wrapper-no-logo': !hasLogo }"
          >
            <div class="swv-modal-logo-wrapper" v-if="hasLogo">
              <slot name="logo" v-bind="scope">
                <img alt="logo" class="swv-modal-logo" :src="logo" />
              </slot>
            </div>
            <h1 class="swv-modal-title" id="swv-modal-title">Connect Wallet</h1>
            <button @click.prevent="closeModal" class="swv-modal-button-close">
              <svg width="14" height="14">
                <path
                  d="M14 12.461 8.3 6.772l5.234-5.233L12.006 0 6.772 5.234 1.54 0 0 1.539l5.234 5.233L0 12.006l1.539 1.528L6.772 8.3l5.69 5.7L14 12.461z"
                />
              </svg>
            </button>
            <ul class="swv-modal-list">
              <li
                v-for="wallet in walletsToDisplay"
                :key="wallet.adapter.name"
                @click="
                  selectWallet(wallet.adapter.name);
                  closeModal();
                "
              >
                <button class="swv-button">
                  <wallet-icon :wallet="wallet"></wallet-icon>
                  <p v-text="wallet.adapter.name"></p>
                  <div
                    v-if="wallet.readyState === 'Installed'"
                    class="swv-wallet-status"
                  >
                    Detected
                  </div>
                </button>
              </li>
            </ul>
            <button
              v-if="hiddenWallets.length > 0"
              aria-controls="swv-modal-collapse"
              :aria-expanded="expandedWallets"
              class="swv-button swv-modal-collapse-button"
              :class="{ 'swv-modal-collapse-button-active': expandedWallets }"
              @click="expandedWallets = !expandedWallets"
            >
              {{ expandedWallets ? "Less" : "More" }} options
              <i class="swv-button-icon">
                <svg width="11" height="6" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="m5.938 5.73 4.28-4.126a.915.915 0 0 0 0-1.322 1 1 0 0 0-1.371 0L5.253 3.736 1.659.272a1 1 0 0 0-1.371 0A.93.93 0 0 0 0 .932c0 .246.1.48.288.662l4.28 4.125a.99.99 0 0 0 1.37.01z"
                  />
                </svg>
              </i>
            </button>
          </div>
        </slot>
      </div>
    </div>
  </teleport>
</template>
