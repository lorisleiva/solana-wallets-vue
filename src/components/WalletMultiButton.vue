<script lang="ts">
import { computed, defineComponent, ref } from "vue-demi";
import { onClickOutside } from "@vueuse/core";
import { useWallet } from "@/useWallet";
import WalletButton from "./WalletButton.vue";
import WalletConnectButton from "./WalletConnectButton.vue";
import WalletIcon from "./WalletIcon.vue";
import WalletModalProvider from "./WalletModalProvider.vue";

export default defineComponent({
  components: {
    WalletConnectButton,
    WalletButton,
    WalletIcon,
    WalletModalProvider,
  },
  setup() {
    const { publicKey, wallet, disconnect } = useWallet();
    const copied = ref(false);
    const active = ref(false);
    const dropdown = ref<HTMLElement>();

    const base58 = computed(() => publicKey.value?.toBase58());
    const content = computed(() => {
      if (!wallet.value || !base58.value) return null;
      return base58.value.slice(0, 4) + ".." + base58.value.slice(-4);
    });

    const copyAddress = async () => {
      if (!base58.value) return;
      await navigator.clipboard.writeText(base58.value);
      copied.value = true;
      setTimeout(() => (copied.value = false), 400);
    };

    const openDropdown = () => (active.value = true);
    const closeDropdown = () => (active.value = false);
    onClickOutside(dropdown, closeDropdown);

    return {
      wallet,
      content,
      base58,
      active,
      copied,
      dropdown,
      openDropdown,
      closeDropdown,
      copyAddress,
      disconnect,
    };
  },
});
</script>

<template>
  <wallet-modal-provider #default="{ open }">
    <wallet-button v-if="!wallet" class="wallet-adapter-button-trigger" @click="open">
        <slot>Select Wallet</slot>
    </wallet-button>
    <wallet-connect-button v-else-if="!base58">
      <slot></slot>
    </wallet-connect-button>
    <div v-else class="wallet-adapter-dropdown">
      <wallet-button
        class="wallet-adapter-button-trigger"
        :style="{ pointerEvents: active ? 'none' : 'auto' }"
        :aria-expanded="active"
        :title="base58"
        @click="openDropdown"
      >
        <template #start-icon>
          <wallet-icon :wallet="wallet"></wallet-icon>
        </template>
        <slot>{{ content }}</slot>
      </wallet-button>
      <ul
        aria-label="dropdown-list"
        class="wallet-adapter-dropdown-list"
        :class="{ 'wallet-adapter-dropdown-list-active': active }"
        ref="dropdown"
        role="menu"
      >
        <li @click="copyAddress" class="wallet-adapter-dropdown-list-item" role="menuitem">
          {{ copied ? "Copied" : "Copy address" }}
        </li>
        <li @click="open(); closeDropdown();" class="wallet-adapter-dropdown-list-item" role="menuitem">
          Change wallet
        </li>
        <li @click="disconnect" class="wallet-adapter-dropdown-list-item" role="menuitem">
          Disconnect
        </li>
      </ul>
    </div>
  </wallet-modal-provider>
</template>
