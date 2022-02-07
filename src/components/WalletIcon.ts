import { defineComponent, PropType } from "vue-demi";
import { Wallet } from "@/createWalletStore";
import { h } from "@/utils/render";

export default defineComponent({
  props: {
    wallet: Object as PropType<Wallet>,
  },
  render () {
    const image = this.wallet
      ? h('img', { src: this.wallet.icon, alt: `${this.wallet.name} icon` })
      : undefined

    return h('i', { class: 'swv-button-icon'}, [image])
  }
});
