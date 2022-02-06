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

    const dropdown = ref<HTMLElement>();
    const dropdownOpened = ref(false);
    const openDropdown = () => (dropdownOpened.value = true);
    const closeDropdown = () => (dropdownOpened.value = false);
    onClickOutside(dropdown, closeDropdown);

    const base58 = computed(() => publicKey.value?.toBase58());
    const content = computed(() => {
      if (!wallet.value || !base58.value) return null;
      return base58.value.slice(0, 4) + ".." + base58.value.slice(-4);
    });

    const copied = ref(false);
    const copyAddress = async () => {
      if (!base58.value) return;
      await navigator.clipboard.writeText(base58.value);
      copied.value = true;
      setTimeout(() => (copied.value = false), 400);
    };

    return {
      wallet,
      content,
      base58,
      copied,
      dropdown,
      dropdownOpened,
      openDropdown,
      closeDropdown,
      copyAddress,
      disconnect,
    };
  },
});
</script>

<template>
  <wallet-modal-provider #default="{ openModal }">
    <wallet-button v-if="!wallet" class="wallet-adapter-button-trigger" @click="openModal">
      <slot>Select Wallet</slot>
    </wallet-button>
    <wallet-connect-button v-else-if="!base58">
      <slot></slot>
    </wallet-connect-button>
    <div v-else class="wallet-adapter-dropdown">
      <wallet-button
        class="wallet-adapter-button-trigger"
        :style="{ pointerEvents: dropdownOpened ? 'none' : 'auto' }"
        :aria-expanded="dropdownOpened"
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
        :class="{ 'wallet-adapter-dropdown-list-active': dropdownOpened }"
        ref="dropdown"
        role="menu"
      >
        <li @click="copyAddress" class="wallet-adapter-dropdown-list-item" role="menuitem">
          {{ copied ? "Copied" : "Copy address" }}
        </li>
        <li @click="openModal(); closeDropdown();" class="wallet-adapter-dropdown-list-item" role="menuitem">
          Change wallet
        </li>
        <li @click="disconnect" class="wallet-adapter-dropdown-list-item" role="menuitem">
          Disconnect
        </li>
      </ul>
    </div>
  </wallet-modal-provider>
</template>
