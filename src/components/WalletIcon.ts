import { defineComponent, PropType, toRefs } from "vue-demi";
import { Wallet } from "@/createWalletStore";
import { h } from "@/utils/render";

export default defineComponent({
  name: 'wallet-icon',
  props: {
    wallet: Object as PropType<Wallet>,
  },
  setup(props) {
    const { wallet } = toRefs(props);
    const image = wallet.value
      ? h('img', { src: wallet.value.icon, alt: `${wallet.value.name} icon` })
      : undefined;

    return () => h('i', { class: 'swv-button-icon'}, [image]);
  }
});
