import { computed, defineComponent, toRefs } from "vue-demi";
import { useWallet } from "@/useWallet";
import WalletIcon from "./WalletIcon";
import { h, slotWithDefault } from "@/utils/render";

export default defineComponent({
  name: 'wallet-disconnect-button',
  props: {
    disabled: Boolean,
  },
  setup(props, { emit, slots }) {
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
      disabled,
      content,
      onClick,
    };

    return () => slotWithDefault(slots.default, scope, () => (
      h('button', {
        class: 'swv-button swv-button-trigger',
        disabled: disabled.value || !wallet.value || disconnecting.value,
        on: { click: onClick },
      }, [
        wallet.value ? h(WalletIcon, { props: { wallet: wallet.value }}, []) : null,
        h('p', {}, content.value),
      ])
    ))
  },
});
