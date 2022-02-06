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

    const dropdownPanel = ref<HTMLElement>();
    const dropdownOpened = ref(false);
    const openDropdown = () => (dropdownOpened.value = true);
    const closeDropdown = () => (dropdownOpened.value = false);
    onClickOutside(dropdownPanel, closeDropdown);

    const publicKeyBase58 = computed(() => publicKey.value?.toBase58());
    const publicKeyTrimmed = computed(() => {
      if (!wallet.value || !publicKeyBase58.value) return null;
      return publicKeyBase58.value.slice(0, 4) + ".." + publicKeyBase58.value.slice(-4);
    });

    const addressCopied = ref(false);
    const copyAddress = async () => {
      if (!publicKeyBase58.value) return;
      await navigator.clipboard.writeText(publicKeyBase58.value);
      addressCopied.value = true;
      setTimeout(() => (addressCopied.value = false), 400);
    };

    // Define the bindings given to scoped slots.
    const scope = {
      wallet,
      publicKey,
      publicKeyTrimmed,
      publicKeyBase58,
      addressCopied,
      dropdownPanel,
      dropdownOpened,
      openDropdown,
      closeDropdown,
      copyAddress,
      disconnect,
    }

    return scope;
  },
});
</script>

<template>
  <wallet-modal-provider #default="{ openModal }">
    <wallet-button v-if="!wallet" class="wallet-adapter-button-trigger" @click="openModal">
      <slot>Select Wallet</slot>
    </wallet-button>
    <wallet-connect-button v-else-if="!publicKeyBase58">
      <slot></slot>
    </wallet-connect-button>
    <div v-else class="wallet-adapter-dropdown">
      <wallet-button
        class="wallet-adapter-button-trigger"
        :style="{ pointerEvents: dropdownOpened ? 'none' : 'auto' }"
        :aria-expanded="dropdownOpened"
        :title="publicKeyBase58"
        @click="openDropdown"
      >
        <template #start-icon>
          <wallet-icon :wallet="wallet"></wallet-icon>
        </template>
        {{ publicKeyTrimmed }}
      </wallet-button>
      <ul
        aria-label="dropdown-list"
        class="wallet-adapter-dropdown-list"
        :class="{ 'wallet-adapter-dropdown-list-active': dropdownOpened }"
        ref="dropdownPanel"
        role="menu"
      >
        <li @click="copyAddress" class="wallet-adapter-dropdown-list-item" role="menuitem">
          {{ addressCopied ? "Copied" : "Copy address" }}
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
