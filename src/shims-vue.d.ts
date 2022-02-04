declare module '*.vue' {
  import { defineComponent } from 'vue-demi'
  const Component: ReturnType<typeof defineComponent>
  export default Component
}
