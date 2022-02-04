import { createApp } from 'vue-demi';
import App from './App.vue';
import SolanaWallets from '../src/index';

const walletOptions = {
  wallets: [],
  autoConnect: true,
}

createApp(App)
  .use(SolanaWallets, walletOptions)
  .mount('#app');
