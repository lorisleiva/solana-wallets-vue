import { computed, defineComponent, ref, toRefs } from "vue-demi";
import { onClickOutside, useClipboard } from "@vueuse/core";
import { useWallet } from "@/useWallet";
import { h, slotWithDefault } from "@/utils/render";
import WalletConnectButton from "./WalletConnectButton";
import WalletIcon from "./WalletIcon";
import WalletModalProvider from "./WalletModalProvider";

export default defineComponent({
  components: {
    WalletConnectButton,
    WalletIcon,
    WalletModalProvider,
  },
  props: {
    featured: { type: Number, default: 3 },
    logo: String,
    dark: Boolean,
  },
  setup(props, { slots }) {
    const { featured, logo, dark } = toRefs(props);
    const { publicKey, wallet, disconnect } = useWallet();

    const dropdownPanel = ref<HTMLElement>();
    const dropdownOpened = ref(false);
    const openDropdown = () => (dropdownOpened.value = true);
    const closeDropdown = () => (dropdownOpened.value = false);
    onClickOutside(dropdownPanel, closeDropdown);

    const publicKeyBase58 = computed(() => publicKey.value?.toBase58());
    const publicKeyTrimmed = computed(() => {
      if (!wallet.value || !publicKeyBase58.value) return null;
      return publicKeyBase58.value.slice(0, 4) + ".." + publicKeyBase58.value.slice(-4);
    });

    const { copy, copied: addressCopied, isSupported: canCopy } = useClipboard()
    const copyAddress = () => publicKeyBase58.value && copy(publicKeyBase58.value);

    // Define the bindings given to scoped slots.
    const scope = {
      featured,
      logo,
      dark,
      wallet,
      publicKey,
      publicKeyTrimmed,
      publicKeyBase58,
      canCopy,
      addressCopied,
      dropdownPanel,
      dropdownOpened,
      openDropdown,
      closeDropdown,
      copyAddress,
      disconnect,
    }

    const renderButton = (scope: any) => {
      if (!wallet.value) {
        return h('button', { class: 'swv-button swv-button-trigger', on: { click: scope.openModal } }, 'Select Wallet')
      } else if (!publicKeyBase58.value) {
        return h(WalletConnectButton)
      } else {
        return h('div', { class: 'swv-dropdown' }, [
          slotWithDefault(slots.dropdownButton, scope, () => [
            h('button', {
              class: 'swv-button swv-button-trigger',
              style: { pointerEvents: dropdownOpened.value ? 'none' : 'auto' },
              'aria-expanded': dropdownOpened.value,
              title: publicKeyBase58.value,
              on: { click: openDropdown },
            }, [
              h(WalletIcon, { props: { wallet: wallet.value } }),
              h('p', {}, publicKeyTrimmed.value)
            ])
          ]),
          slotWithDefault(slots.dropdown, scope, () => [
            h('ul', {
              'aria-label': 'dropdown-list',
              class: ['swv-dropdown-list', { 'swv-dropdown-list-active': dropdownOpened.value }],
              ref: 'dropdownPanel',
              role: 'menu',
            }, [
              slotWithDefault(slots.dropdownList, scope, () => [
                canCopy ? h('li', { on: { click: copyAddress }, class: 'swv-dropdown-list-item', role: 'menuitem' }, addressCopied.value ? 'Copied' : 'Copy address') : null,
                h('li', { on: { click: () => { scope.openModal(); closeDropdown(); } }, class: 'swv-dropdown-list-item', role: 'menuitem' }, 'Change wallet'),
                h('li', { on: { click: disconnect }, class: 'swv-dropdown-list-item', role: 'menuitem' }, 'Disconnect'),
              ])
            ])
          ]),
        ])
      }
    }

    return () => h(WalletModalProvider, { props }, {
      default (modalScope: any) {
        return slots.default?.({ ...modalScope, ...scope }) ?? renderButton({ ...modalScope, ...scope })
      },
      overlay (modalScope: any) {
        return slots.modalOverlay?.({ ...modalScope, ...scope }) ?? null
      },
      modal (modalScope: any) {
        return slots.modal?.({ ...modalScope, ...scope }) ?? null
      },
    })
  },
});
