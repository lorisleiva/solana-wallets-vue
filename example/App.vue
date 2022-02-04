<script>
import { ref, computed, watchEffect } from 'vue-demi'
import { Connection, PublicKey, Keypair, clusterApiUrl, SystemProgram } from '@solana/web3.js'
import { Program, Provider } from '@project-serum/anchor'
import { WalletModalProvider, WalletMultiButton, useAnchorWallet, useLocalStorage } from '../src'
import idl from './idl.json'

const programID = new PublicKey(idl.metadata.address)
const preflightCommitment = 'processed'

export default {
  components: {
    WalletModalProvider,
    WalletMultiButton,
  },
  setup () {
    const wallet = useAnchorWallet()
    const connection = new Connection(clusterApiUrl('devnet'), preflightCommitment)
    const provider = computed(() => new Provider(connection, wallet.value, { preflightCommitment }))
    const program = computed(() => new Program(idl, programID, provider.value))

    const counterPublicKey = useLocalStorage('counterPublicKey', null);
    const counter = ref(0);
    watchEffect(async () => {
      if (!counterPublicKey.value) return;
      const account = await program.value.account.baseAccount.fetch(counterPublicKey.value)
      counter.value = account.count.toNumber()
    })

    const createCounter = async () => {
      const newCounter = Keypair.generate();
      await program.value.rpc.create({
        accounts: {
          baseAccount: newCounter.publicKey,
          user: wallet.value.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [newCounter],
      })
      counterPublicKey.value = newCounter.publicKey;
    }

    const incrementCounter = async () => {
      await program.value.rpc.increment({
        accounts: {
          baseAccount: counterPublicKey.value
        }
      })
      counter.value += 1
    }

    return { 
      counterPublicKey,
      counter,
      createCounter,
      incrementCounter,
    }
  },
}
</script>

<template>
  <div>
    <wallet-modal-provider>
      <wallet-multi-button></wallet-multi-button>
    </wallet-modal-provider>

    <div>
      {{ $wallet.publicKey.value?.toBase58() ?? 'Not connected' }}
    </div>

    <div>
      <div>{{ counterPublicKey }}</div>
      <div>{{ counter }}</div>
      <button @click="createCounter">New Counter</button>
      <button @click="incrementCounter">Increment Counter</button>
    </div>
  </div>
</template>
