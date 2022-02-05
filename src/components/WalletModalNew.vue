<script lang="ts">
import { computed, defineComponent, ref } from "vue-demi";
import { onClickOutside, onKeyStroke } from "@vueuse/core";
import { useWallet } from "../useWallet";
import WalletButton from './WalletButton.vue';
import WalletListItem from './WalletListItem.vue';

export default defineComponent({
  components: {
    WalletButton,
    WalletListItem,
  },
  props: {
    featured: { type: Number, default: 3 },
    container: { type: String, default: 'body' },
    logo: String,
  },
  setup({ featured, container, logo }) {
    const panel = ref<HTMLElement | null>(null);
    const opened = ref(true);
    const expanded = ref(false);
    const close = () => opened.value = false;

    const { wallets, select } = useWallet();
    const featuredWallets = computed(() => wallets.value.slice(0, featured));
    const otherWallets = computed(() => wallets.value.slice(featured));

    onClickOutside(panel, close);
    onKeyStroke("Escape", close);

    return {
      container,
      panel,
      opened,
      expanded,
      open,
      close,
      featuredWallets,
      otherWallets,
      select,
      logo,
    }
  },
});
</script>

<template>
  <teleport :to="container" v-if="opened">
    <div
      aria-labelledby="wallet-adapter-modal-title"
      aria-modal="true"
      class="wallet-adapter-modal wallet-adapter-modal-fade-in"
      role="dialog"
    >
      <div class="wallet-adapter-modal-overlay" />
      <div class="wallet-adapter-modal-container" ref="panel">
        <div
          class="wallet-adapter-modal-wrapper"
          :class="{ 'wallet-adapter-modal-wrapper-no-logo': !$slots.logo }"
        >
          <div class="wallet-adapter-modal-logo-wrapper" v-if="$slots.logo">
            <slot name="logo">
              <img alt="logo" class="wallet-adapter-modal-logo" :src="logo" />
            </slot>
          </div>
          <h1 class="wallet-adapter-modal-title" id="wallet-adapter-modal-title">
            Connect Wallet
          </h1>
          <button @click.prevent="close" class="wallet-adapter-modal-button-close">
            <svg width="14" height="14">
              <path d="M14 12.461 8.3 6.772l5.234-5.233L12.006 0 6.772 5.234 1.54 0 0 1.539l5.234 5.233L0 12.006l1.539 1.528L6.772 8.3l5.69 5.7L14 12.461z" />
            </svg>
          </button>
          <ul class="wallet-adapter-modal-list">
            <wallet-list-item
              v-for="wallet in featuredWallets"
              :key="wallet.name"
              :wallet="wallet"
              @click="selectWallet(wallet.name)"
            ></wallet-list-item>
          </ul>
          <template v-if="otherWallets.length > 0">
            <ul class="wallet-adapter-modal-list" v-if="expanded">
              <wallet-list-item
                v-for="wallet in otherWallets"
                :key="wallet.name"
                :wallet="wallet"
                @click="selectWallet(wallet.name)"
              ></wallet-list-item>
            </ul>
            <wallet-button
              aria-controls="wallet-adapter-modal-collapse"
              :aria-expanded="expanded"
              class="wallet-adapter-modal-collapse-button"
              :class="{ 'wallet-adapter-modal-collapse-button-active': expanded }"
              @click="expanded = !expanded"
            >
              {{ expanded ? "Less" : "More" }} options
              <template #end-icon>
                <svg width="11" height="6" xmlns="http://www.w3.org/2000/svg">
                  <path d="m5.938 5.73 4.28-4.126a.915.915 0 0 0 0-1.322 1 1 0 0 0-1.371 0L5.253 3.736 1.659.272a1 1 0 0 0-1.371 0A.93.93 0 0 0 0 .932c0 .246.1.48.288.662l4.28 4.125a.99.99 0 0 0 1.37.01z" />
                </svg>
              </template>
            </wallet-button>
          </template>
        </div>
      </div>
    </div>
  </teleport>
</template>
