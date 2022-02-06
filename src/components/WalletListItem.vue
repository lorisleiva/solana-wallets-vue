<script lang="ts">
import { Adapter } from "@solana/wallet-adapter-base";
import { defineComponent, PropType, toRefs } from "vue-demi";
import WalletButton from "./WalletButton.vue";
import WalletIcon from "./WalletIcon.vue";

export default defineComponent({
  components: {
    WalletButton,
    WalletIcon,
  },
  props: {
    wallet: Object as PropType<Adapter>,
  },
  setup(props) {
    return toRefs(props);
  },
});
</script>

<template>
  <li v-if="wallet">
    <wallet-button @click="$emit('click')">
      <slot>
        {{ wallet.name }}
      </slot>
      <template #end-icon>
        <wallet-icon :wallet="wallet"></wallet-icon>
      </template>
    </wallet-button>
  </li>
</template>
