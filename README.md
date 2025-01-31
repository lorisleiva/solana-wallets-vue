# Solana Wallets Vue

Integrates Solana wallets in your Vue 3 applications.

⚡️ [View demo](https://solana-wallets-vue-demo.netlify.app/) / [Browse demo code](./example)

<img width="1230" alt="solana-wallets-vue" src="https://user-images.githubusercontent.com/3642397/152684955-079b4505-a7bb-4be7-976b-a0a5a59acf92.png">

## Installation

To get started, you'll need to install the `solana-wallets-vue` npm package as well as the wallets adapters provided by Solana.

```shell
npm install solana-wallets-vue @solana/wallet-adapter-wallets
```

## Setup

Next, you can install Solana Wallets Vue as a plugin like so.

```js
import { createApp } from 'vue';
import App from './App.vue';
import SolanaWallets from 'solana-wallets-vue';

// You can either import the default styles or create your own.
import 'solana-wallets-vue/styles.css';

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

import {
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';

const walletOptions = {
  wallets: [
    new PhantomWalletAdapter(),
    new SlopeWalletAdapter(),
    new SolflareWalletAdapter({ network: WalletAdapterNetwork.Devnet }),
  ],
  autoConnect: true,
};

createApp(App).use(SolanaWallets, walletOptions).mount('#app');
```

This will initialise the wallet store and create a new `$wallet` global property that you can access inside any component.

Note that you can also initialise the wallet store manually using the `initWallet` method like so.

```js
import { initWallet } from 'solana-wallets-vue';
initWallet(walletOptions);
```

Finally, import and render the `WalletMultiButton` component to allow users to select a wallet et connect to it.

```vue
<script setup>
import { WalletMultiButton } from 'solana-wallets-vue';
</script>

<template>
  <wallet-multi-button></wallet-multi-button>
</template>
```

If you prefer the dark mode, simply provide the `dark` boolean props to the component above.

```html
<wallet-multi-button dark></wallet-multi-button>
```

## Usage

You can then call `useWallet()` at any time to access the wallet store — or access the `$wallet` global propery instead.

Here's an example of a function that sends one lamport to a random address.

```js
import { useWallet } from 'solana-wallets-vue';
import { Connection, clusterApiUrl, Keypair, SystemProgram, Transaction } from '@solana/web3.js';

export const sendOneLamportToRandomAddress = () => {
  const connection = new Connection(clusterApiUrl('devnet'))
  const { publicKey, sendTransaction } = useWallet();
  if (!publicKey.value) return;

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: publicKey.value,
      toPubkey: Keypair.generate().publicKey,
      lamports: 1,
    })
  );

  const signature = await sendTransaction(transaction, connection);
  await connection.confirmTransaction(signature, 'processed');
};
```

## Anchor usage

If you're using Anchor, then you might want to define your own store that encapsulates `useWallet` into something that will also provide information on the current connection, provider and program.

```js
import { computed } from 'vue';
import { useAnchorWallet } from 'solana-wallets-vue';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import idl from '@/idl.json';

const preflightCommitment = 'processed';
const commitment = 'confirmed';
const programID = new PublicKey(idl.metadata.address);

const workspace = null;
export const useWorkspace = () => workspace;

export const initWorkspace = () => {
  const wallet = useAnchorWallet();
  const connection = new Connection(clusterApiUrl('devnet'), commitment);
  const provider = computed(
    () =>
      new AnchorProvider(connection, wallet.value, {
        preflightCommitment,
        commitment,
      })
  );
  const program = computed(() => new Program(idl, programID, provider.value));

  workspace = {
    wallet,
    connection,
    provider,
    program,
  };
};
```

This allows you to access the Anchor program anywhere within your application in just a few lines of code.

```js
import { useWorkspace } from './useWorkspace';

const { program } = useWorkspace();
await program.value.rpc.myInstruction(/* ... */);
```

## Configurations

The table below shows all options you can provide when initialising the wallet store. Note that some options accepts `Ref` types so you can update them at runtime and keep their reactivity.

| Option                        | Type                          | Description                                                                                                                       |
| ----------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `wallets`                     | `Adapter[] \| Ref<Adapter[]>` | The wallet adapters available the use. Defaults to `[]`.                                                                          |
| `autoConnect`                 | `boolean \| Ref<boolean>`     | Whether or not we should try to automatically connect the wallet when loading the page. Defaults to `false`.                      |
| `cluster`                     | `Cluster \| Ref<Cluster>`     | The Solana cluster used by the wallets. Defaults to `mainnet-beta`.                                                               |
| `onError(error: WalletError)` | `void`                        | Will be called whenever an error occurs on the wallet selection/connection workflow. Defaults to `error => console.error(error)`. |
| `localStorageKey`             | `string`                      | The key to use when storing the selected wallet type (e.g. `Phantom`) in the local storage. Defaults to `walletName`.             |

## `useWallet()` references

The table below shows all the properties and methods you can get from `useWallet()`.

| Property/Method       | Type                     | Description                                                                             |
| --------------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `wallets`             | `Ref<Wallet[]>`          | The wallets available the use.                                                          |
| `autoConnect`         | `Ref<boolean>`           | Whether or not we should try to automatically connect the wallet when loading the page. |
| `cluster`             | `Ref<Cluster>`           | The Solana cluster used by the wallets — e.g. `mainnet-beta`.                           |
| `wallet`              | `Ref<Wallet \| null>`    | The connected wallet. Null if not connected.                                            |
| `publicKey`           | `Ref<PublicKey \| null>` | The public key of the connected wallet. Null if not connected.                          |
| `readyState`          | `Ref<WalletReadyState>`  | The ready state of the selected wallet.                                                 |
| `ready`               | `Ref<boolean>`           | Whether the selected wallet is ready to connect.                                        |
| `connected`           | `Ref<boolean>`           | Whether a wallet has been selected and connected.                                       |
| `connecting`          | `Ref<boolean>`           | Whether we are connecting a wallet.                                                     |
| `disconnecting`       | `Ref<boolean>`           | Whether we are disconnecting a wallet.                                                  |
| `select(walletName)`  | `void`                   | Select a given wallet.                                                                  |
| `connect()`           | `Promise<void>`          | Connects the selected wallet.                                                           |
| `disconnect()`        | `Promise<void>`          | Disconnect the selected wallet.                                                         |
| `sendTransaction`     | Function                 | Send a transation whilst adding the connected wallet as a signer.                       |
| `signTransaction`     | Function or undefined    | Signs the given transaction. Undefined if not supported by the selected wallet.         |
| `signAllTransactions` | Function or undefined    | Signs all given transactions. Undefined if not supported by the selected wallet.        |
| `signMessage`         | Function or undefined    | Signs the given message. Undefined if not supported by the selected wallet.             |

# Nuxt 3 Setup

1. Create a new plugin, ex. `plugins/solana.ts`

```ts
import 'solana-wallets-vue/styles.css';
import SolanaWallets from 'solana-wallets-vue';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';

const walletOptions = {
  wallets: [
    new PhantomWalletAdapter(),
    new SlopeWalletAdapter(),
    new SolflareWalletAdapter({ network: WalletAdapterNetwork.Devnet }),
  ],
  autoConnect: true,
};

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(SolanaWallets, walletOptions);
});
```

2. Update the `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  vite: {
    esbuild: {
      target: 'esnext',
    },
    build: {
      target: 'esnext',
    },
    optimizeDeps: {
      include: ['@coral-xyz/anchor', '@solana/web3.js', 'buffer'],
      esbuildOptions: {
        target: 'esnext',
      },
    },
    define: {
      'process.env.BROWSER': true,
    },
  },
});
```

3. On your `app.vue`

```vue
<script lang="ts" setup>
import { WalletMultiButton } from 'solana-wallets-vue';
</script>

<template>
  <ClientOnly>
    <WalletMultiButton />
  </ClientOnly>
</template>
```
