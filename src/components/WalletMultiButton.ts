import { computed, defineComponent, ref, toRefs } from "vue-demi";
import { onClickOutside, useClipboard } from "@vueuse/core";
import { useWallet } from "@/useWallet";
import { h, slotWithDefault } from "@/utils/render";
import WalletConnectButton from "./WalletConnectButton.vue";
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
    container: { type: String, default: 'body' },
    logo: String,
    dark: Boolean,
  },
  setup(props) {
    const { featured, container, logo, dark } = toRefs(props);
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
      container,
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

    return {
      scope,
      ...scope,
    };
  },
  render() {
    const slots = this.$slots
    const scope = this.scope

    const renderButton = (scope: any) => {
      if (!this.wallet) {
        return h('button', { class: 'swv-button swv-button-trigger', on: { click: scope.openModal } }, 'Select Wallet')
      } else if (!this.publicKeyBase58) {
        return h(WalletConnectButton)
      } else {
        return h('div', { class: 'swv-dropdown' }, [
          slotWithDefault(slots.dropdownButton, scope, () => [
            h('button', {
              class: 'swv-button swv-button-trigger',
              style: { pointerEvents: this.dropdownOpened ? 'none' : 'auto' },
              'aria-expanded': this.dropdownOpened,
              title: this.publicKeyBase58,
              on: { click: this.openDropdown },
            }, [
              h(WalletIcon, { props: { wallet: this.wallet } }),
              h('p', {}, this.publicKeyTrimmed)
            ])
          ]),
          slotWithDefault(slots.dropdown, scope, () => [
            h('ul', {
              'aria-label': 'dropdown-list',
              class: ['swv-dropdown-list', { 'swv-dropdown-list-active': this.dropdownOpened }],
              ref: 'dropdownPanel',
              role: 'menu',
            }, [
              slotWithDefault(slots.dropdownList, scope, () => [
                this.canCopy ? h('li', { on: { click: this.copyAddress }, class: 'swv-dropdown-list-item', role: 'menuitem' }, this.addressCopied ? 'Copied' : 'Copy address') : null,
                h('li', { on: { click: () => { scope.openModal(); this.closeDropdown(); } }, class: 'swv-dropdown-list-item', role: 'menuitem' }, 'Change wallet'),
                h('li', { on: { click: this.disconnect }, class: 'swv-dropdown-list-item', role: 'menuitem' }, 'Disconnect'),
              ])
            ])
          ]),
        ])
      }
    }

    return h(WalletModalProvider, { props: this.$props }, {
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
  }
});
