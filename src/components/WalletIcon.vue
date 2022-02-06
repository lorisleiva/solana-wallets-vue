<script lang="ts">
import { defineComponent, PropType, toRefs } from "vue-demi";
import { Wallet } from "@/createWalletStore";

export default defineComponent({
  props: {
    wallet: Object as PropType<Wallet>,
  },
  setup(props) {
    return toRefs(props);
  },
});
</script>

<template>
  <img v-if="wallet" :src="wallet.icon" :alt="`${wallet.name} icon`" />
</template>
