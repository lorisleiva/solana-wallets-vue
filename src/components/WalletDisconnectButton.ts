import { computed, defineComponent, toRefs } from "vue-demi";
import { useWallet } from "@/useWallet";
import WalletIcon from "./WalletIcon";
import { h, slotWithDefault } from "@/utils/render";

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

    const onClick = (event: MouseEvent) => {
      emit("click", event);
      if (event.defaultPrevented) return;
      disconnect().catch(() => {});
    };

    const scope = {
      wallet,
      disconnecting,
      // disabled,
      content,
      onClick,
    };

    return {
      scope,
      ...scope,
    }
  },
  render() {
    return slotWithDefault(this.$slots.default, this.scope, () => (
      h('button', {
        class: 'swv-button swv-button-trigger',
        disabled: this.disabled || !this.wallet || this.disconnecting,
        on: { click: this.onClick },
      }, [
        this.wallet ? h(WalletIcon, { props: { wallet: this.wallet }}) : null,
        h('p', {}, this.content),
      ])
    ))
  },
});
