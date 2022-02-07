import { App, isVue2, isVue3 } from 'vue-demi';
import { WalletStoreProps } from './createWalletStore';
import { initWallet, useWallet } from './useWallet';

export * from './components';
export * from './createWalletStore';
export * from './errors';
export * from './useAnchorWallet';
export * from './useWallet';

export default { 
  install: (app: App, options: WalletStoreProps = {}) => {
    console.log({ isVue2, isVue3 })
    initWallet(options);
    app.config.globalProperties.$wallet = useWallet();
  },
}
