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
    }
  },
  render() {
    return slotWithDefault(this.$slots.default, this.scope, () => (
      h('button', {
        class: 'swv-button swv-button-trigger',
        disabled: this.disabled || !this.wallet || this.connecting || this.connected,
        on: { click: this.onClick },
      }, [
        this.wallet ? h(WalletIcon, { props: { wallet: this.wallet }}) : null,
        h('p', {}, this.content),
      ])
    ))
  },
});
