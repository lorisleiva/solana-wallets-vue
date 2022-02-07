import { computed, defineComponent, Teleport, nextTick, ref, toRefs, watch } from "vue-demi";
import { onClickOutside, onKeyStroke, useScrollLock } from "@vueuse/core";
import { useWallet } from "@/useWallet";
import WalletIcon from './WalletIcon';
import { h, slotWithDefault } from "@/utils/render";

export default defineComponent({
  components: {
    WalletIcon,
  },
  props: {
    featured: { type: Number, default: 3 },
    container: { type: String, default: 'body' },
    logo: String,
    dark: Boolean,
  },
  setup(props, { slots }) {
    const { featured, container, logo, dark } = toRefs(props);
    const modalPanel = ref<HTMLElement | null>(null);
    const modalOpened = ref(false);
    const openModal = () => modalOpened.value = true;
    const closeModal = () => modalOpened.value = false;
    const hasLogo = computed(() => !!slots.logo || !!logo.value)

    const { wallets, select: selectWallet } = useWallet();
    const expandedWallets = ref(false);
    const featuredWallets = computed(() => wallets.value.slice(0, featured.value));
    const hiddenWallets = computed(() => wallets.value.slice(featured.value));
    const walletsToDisplay = computed(() => expandedWallets.value ? wallets.value : featuredWallets.value)

    // Close the modal when clicking outside of it or when pressing Escape.
    onClickOutside(modalPanel, closeModal);
    onKeyStroke("Escape", closeModal);

    // Ensures pressing Tab backwards and forwards stays within the modal.
    onKeyStroke("Tab", (event: KeyboardEvent) => {
      const focusableElements = modalPanel.value?.querySelectorAll("button") ?? [];
      const firstElement = focusableElements?.[0];
      const lastElement = focusableElements?.[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement && lastElement) {
        lastElement.focus();
        event.preventDefault();
      } else if (! event.shiftKey && document.activeElement === lastElement && firstElement) {
        firstElement.focus();
        event.preventDefault();
      }
    });

    // Bring focus inside the modal when it opens.
    watch(modalOpened, isOpened => {
      if (! isOpened) return;
      nextTick(() => modalPanel.value?.querySelectorAll("button")?.[0]?.focus())
    });

    // Lock the body scroll when the modal opens.
    const scrollLock = useScrollLock(document.body);
    watch(modalOpened, isOpened => scrollLock.value = isOpened);

    // Define the bindings given to scoped slots.
    const scope = {
      dark,
      logo,
      hasLogo,
      featured,
      container,
      modalPanel,
      modalOpened,
      openModal,
      closeModal,
      expandedWallets,
      walletsToDisplay,
      featuredWallets,
      hiddenWallets,
      selectWallet,
    }

    return {
      scope,
      ...scope,
    }
  },
  render() {
    const renderLogo = () => {
      if (!this.hasLogo) return;
      return h('div', { class: 'swv-modal-logo-wrapper' }, [
        h('img', { claass: 'swv-modal-logo', src: this.logo, alt: 'logo' }),
      ])
    }

    const renderCloseButton = () => {
      return h('button', { class: 'swv-modal-button-close', on: { click: this.closeModal } }, [
        h('svg', { width: '14', height: '14' }, [
          h('path', { d: 'M14 12.461 8.3 6.772l5.234-5.233L12.006 0 6.772 5.234 1.54 0 0 1.539l5.234 5.233L0 12.006l1.539 1.528L6.772 8.3l5.69 5.7L14 12.461z' })
        ])
      ])
    }

    const renderExpandButton = () => {
      if (this.hiddenWallets.length <= 0) return;
      return h('button', {
        'aria-controls': 'swv-modal-collapse',
        'aria-expanded': this.expandedWallets,
        class: ['swv-button swv-modal-collapse-button', { 'swv-modal-collapse-button-active': this.expandedWallets }],
        on: { click: () => { this.expandedWallets = !this.expandedWallets } }
      }, [
        h('p', {}, (this.expandedWallets ? "Less" : "More") + ' options'),
        h('i', { class: 'swv-button-icon' }, [
          h('svg', { width: '11', height: '6' }, [
            h('path', { d: 'm5.938 5.73 4.28-4.126a.915.915 0 0 0 0-1.322 1 1 0 0 0-1.371 0L5.253 3.736 1.659.272a1 1 0 0 0-1.371 0A.93.93 0 0 0 0 .932c0 .246.1.48.288.662l4.28 4.125a.99.99 0 0 0 1.37.01z' })
          ])
        ])
      ])
    }

    const renderModal = () => {
      if (!this.modalOpened) return null;
      return h(Teleport, { to: this.container, }, [
        h('div', {
          'aria-labelledby': 'swv-modal-title',
          'aria-modal': true,
          class: ['swv-modal', this.dark ? 'swv-dark' : ''],
          role: 'dialog',
        }, [
          slotWithDefault(this.$slots.overlay, this.scope, () => h('div', { class: 'swv-modal-overlay' })),
          h('div', { class: 'swv-modal-container', ref: 'modalPanel' }, [
            slotWithDefault(this.$slots.modal, this.scope, () => (
              h('div', { class: ['swv-modal-wrapper', { 'swv-modal-wrapper-no-logo': ! this.hasLogo }] }, [
                this.$slots.logo?.(this.scope) ?? renderLogo(),
                h('h1', { class: 'swv-modal-title', id: 'swv-modal-title' }, 'Connect Wallet'),
                renderCloseButton(),
                h('ul', { class: 'swv-modal-list' }, [
                  this.walletsToDisplay.map(wallet => (
                    h('li', { key: wallet.name, on: { click: () => { this.selectWallet(wallet.name); this.closeModal(); } } }, [
                      h('button', { class: 'swv-button' }, [
                        h('p', {}, wallet.name),
                        h(WalletIcon, { props: { wallet } }),
                      ])
                    ])
                  ))
                ]),
                renderExpandButton(),
              ])
            )),
          ])
        ])
      ])
    }

    return h('div', { class: this.dark ? 'swv-dark' : '' }, [
      this.$slots.default?.(this.scope),
      renderModal(),
    ])
  },
});
