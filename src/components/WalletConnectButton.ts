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
  setup(props, { emit, slots }) {
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

    return () => slotWithDefault(slots.default, scope, () => (
      h('button', {
        class: 'swv-button swv-button-trigger',
        disabled: disabled.value || !wallet.value || connecting.value || connected.value,
        on: { click: onClick },
      }, [
        wallet.value ? h(WalletIcon, { props: { wallet: wallet.value }}) : null,
        h('p', {}, content.value),
      ])
    ))
  },
});
