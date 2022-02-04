<script>
import { WalletModalProvider, WalletMultiButton } from '../src'

export default {
  components: {
    WalletModalProvider,
    WalletMultiButton,
  }
}
</script>

<template>
  <div>
    <wallet-modal-provider>
        <wallet-multi-button></wallet-multi-button>
    </wallet-modal-provider>
  </div>
</template>
