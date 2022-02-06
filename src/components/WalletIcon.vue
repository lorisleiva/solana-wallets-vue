<script lang="ts">
import { defineComponent, PropType, toRefs } from "vue-demi";
import { Adapter } from "@solana/wallet-adapter-base";

export default defineComponent({
  props: {
    wallet: Object as PropType<Adapter>,
  },
  setup(props) {
    return toRefs(props);
  },
});
</script>

<template>
  <img v-if="wallet" :src="wallet.icon" :alt="`${wallet.name} icon`" />
</template>
