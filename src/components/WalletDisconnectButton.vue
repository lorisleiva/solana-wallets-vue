<script lang="ts">
import { computed, defineComponent, toRefs } from "vue";
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

    const scope = {
      wallet,
      disconnecting,
      disabled,
      content,
      handleClick,
    };

    return {
      scope,
      ...scope,
    };
  },
});
</script>

<template>
  <slot v-bind="scope">
    <button
      class="swv-button swv-button-trigger"
      :disabled="disabled || disconnecting || !wallet"
      @click="handleClick"
    >
      <wallet-icon v-if="wallet" :wallet="wallet"></wallet-icon>
      <p v-text="content"></p>
    </button>
  </slot>
</template>
