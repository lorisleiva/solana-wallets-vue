import { App } from 'vue-demi';
import { WalletStoreProps } from './createWalletStore';
import { initWallet, useWallet } from './useWallet';

export * from './components';
export * from './createWalletStore';
export * from './errors';
export * from './useAnchorWallet';
export * from './useLocalStorage';
export * from './useWallet';

function install(Vue: App, options: WalletStoreProps) {
  initWallet(options);
  Vue.config.globalProperties.$wallet = useWallet();
}

export default { install }
