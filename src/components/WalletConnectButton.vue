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

    const scope = {
      wallet,
      disabled,
      connecting,
      connected,
      content,
      onClick,
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
      :disabled="disabled || !wallet || connecting || connected"
      @click="onClick"
    >
      <wallet-icon v-if="wallet" :wallet="wallet"></wallet-icon>
      <p v-text="content"></p>
    </button>
  </slot>
</template>
