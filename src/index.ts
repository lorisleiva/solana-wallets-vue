import { ref, Ref } from 'vue-demi'

type MagicNumber = number;

export const foo: MagicNumber = 3;

export const bar: Ref<MagicNumber> = ref(42);
