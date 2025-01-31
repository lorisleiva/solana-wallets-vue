import { createApp } from "vue";
import App from "./App.vue";
import SolanaWallets from "../src/index";
import "../styles.css";

import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";

const walletOptions = {
  wallets: [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network: "devnet" }),
    new TorusWalletAdapter(),
  ],
  autoConnect: true,
};

createApp(App).use(SolanaWallets, walletOptions).mount("#app");
