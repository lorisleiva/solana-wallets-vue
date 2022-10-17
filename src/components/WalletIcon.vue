<script lang="ts">
import { defineComponent, PropType, toRefs } from "vue";
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
  <i class="swv-button-icon">
    <img
      v-if="wallet"
      :src="wallet.adapter.icon"
      :alt="`${wallet.adapter.name} icon`"
    />
  </i>
</template>
