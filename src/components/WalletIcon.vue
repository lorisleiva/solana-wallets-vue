<script lang="ts">
import { defineComponent, PropType } from 'vue-demi';
import { Adapter } from '@solana/wallet-adapter-base';

export default defineComponent({
    name: 'wallet-icon',
    props: {
        wallet: Object as PropType<Adapter>,
    },
    setup({ wallet }) {
        return { wallet };
    },
});
</script>

<template>
    <img v-if="wallet" :src="wallet.icon" :alt="`${wallet.name} icon`" />
</template>
