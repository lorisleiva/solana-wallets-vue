<script lang="ts">
import { computed, defineComponent, toRefs } from "vue-demi";
import { useWallet } from "@/useWallet";
import WalletIcon from "./WalletIcon.vue";

export default defineComponent({
  components: {
    WalletIcon,
  },
  props: {
    disabled: Boolean,
  },
  setup(props, { emit }) {
    const { disabled } = toRefs(props);
    const { wallet, disconnect, disconnecting } = useWallet();

    const content = computed(() => {
      if (disconnecting.value) return "Disconnecting ...";
      if (wallet.value) return "Disconnect";
      return "Disconnect Wallet";
    });

    const handleClick = (event: MouseEvent) => {
      emit("click", event);
      if (event.defaultPrevented) return;
      disconnect().catch(() => {});
    };

    return {
      wallet,
      disconnecting,
      disabled,
      content,
      handleClick,
    };
  },
});
</script>

<template>
  <button
    type="button"
    class="wallet-adapter-button wallet-adapter-button-trigger"
    :disabled="disabled || disconnecting || !wallet"
    @click="handleClick"
  >
    <i class="wallet-adapter-button-start-icon" v-if="wallet">
      <wallet-icon :wallet="wallet"></wallet-icon>
    </i>
    <slot>
      {{ content }}
    </slot>
  </button>
</template>
