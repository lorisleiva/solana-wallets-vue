import { h as hDemi, isVue2 } from 'vue-demi'

interface Options {
  props?: object,
  domProps?: object
  on?: object
}

const adaptOnsV3 = (ons: object) => {
  if (!ons) return null
  return Object.entries(ons).reduce((ret, [key, handler]) => {
    key = key.charAt(0).toUpperCase() + key.slice(1)
    key = `on${key}`
    return { ...ret, [key]: handler }
  }, {})
}

export const h = (type: string | object, options: Options & any = {}, chidren?: any) => {
  if (isVue2)
    return hDemi(type, options, chidren)

  const { props, domProps, on, ...extraOptions } = options

  let ons = adaptOnsV3(on)
  const params = { ...extraOptions, ...props, ...domProps, ...ons }
  return hDemi(type, params, chidren)
}

export const slotWithDefault = (slot: any, scope: object, defaultCb?: any) => {
  const renderedSlot = slot?.(scope)

  if (! renderedSlot || (renderedSlot?.length === 1 && !renderedSlot[0].el)) {
    return defaultCb?.(scope)
  }

  return renderedSlot
}
