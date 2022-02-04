<script>
import { computed, ref } from 'vue-demi'
import { Connection, PublicKey, Keypair, clusterApiUrl } from '@solana/web3.js'
import { Program, Provider } from '@project-serum/anchor'
import { WalletModalProvider, WalletMultiButton, useAnchorWallet } from '../src'
import idl from './idl.json'

const programID = new PublicKey(idl.metadata.address)
const preflightCommitment = 'processed'

export default {
  components: {
    WalletModalProvider,
    WalletMultiButton,
  },
  setup () {
    const baseAccount = Keypair.generate()
    const wallet = useAnchorWallet()
    const connection = new Connection(clusterApiUrl('devnet'), preflightCommitment)
    const provider = computed(() => new Provider(connection, wallet.value, { preflightCommitment }))
    const program = computed(() => new Program(idl, programID, provider.value))
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
  </div>
</template>
