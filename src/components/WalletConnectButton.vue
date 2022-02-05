<script lang="ts">
import { computed, defineComponent } from "vue-demi";
import { useWallet } from "@/useWallet";
import WalletIcon from "./WalletIcon.vue";

export default defineComponent({
  components: {
    WalletIcon,
  },
  props: {
    disabled: Boolean,
  },
  setup({ disabled }, { emit }) {
    const { wallet, connect, connecting, connected } = useWallet();

    const content = computed(() => {
      if (connecting.value) return "Connecting ...";
      if (connected.value) return "Connected";
      if (wallet.value) return "Connect";
      return "Connect Wallet";
    });

    const onClick = (event: MouseEvent) => {
      emit("click", event);
      if (event.defaultPrevented) return;
      connect().catch(() => {});
    };

    return {
      wallet,
      disabled,
      connecting,
      connected,
      content,
      onClick,
    };
  },
});
</script>

<template>
  <button
    type="button"
    class="wallet-adapter-button wallet-adapter-button-trigger"
    :disabled="disabled || !wallet || connecting || connected"
    @click="onClick"
  >
    <i class="wallet-adapter-button-start-icon" v-if="wallet">
      <wallet-icon :wallet="wallet"></wallet-icon>
    </i>
    <slot>
      {{ content }}
    </slot>
  </button>
</template>
