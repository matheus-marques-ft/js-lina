## Props

```ts
export default {
  // ...
  props: {
    /**
     * support all el-form's props
     * @see: https://element.eleme.io/#/zh-CN/component/form#form-attributes
     */

    /**
     * the form config's array, each item represents a form-item
     */
    content: {
      type: Array, // type: Content[], check Content's definition below
      required: true
    },

    /**
     * disable all form-items
     */
    disabled: {
      type: Boolean,
      default: false
    }
  }
}

/**
 * definition of form-item written in typescript.
 * support all el-form-item's props. The component's props need to be set at prop el
 */
interface Content {
  // key of form-item value in form value. Must be unique
  id: string

  /**
   * support all element's form component, e.g., type 'input' will render as 'el-input'.
   * you can create nested form value with type 'group' and use items to define that form value's shape. The type of this form value will be 'object'
   */
  type: string

  /**
   * using with type 'group'
   * the `id` in each item of items must be unique
   */
  items: Content[]

  /**
   * FIXME: don't use a keyword as a key
   */
  default?: any

  /**
   * shows the text value when type === 'input'
   * shows the corresponding label when type === 'select'
   * for other components this is equivalent to disabled = true
   */
  readonly = false

  /**
   * @deprecated
   */
  enableWhen?: object | string

  /**
   * hide the form-item when return true
   * formValue is same as what getFormValue returns, and item is the config of this form-item
   */
  hidden?: (formValue: Object, item: Content) => boolean

  /**
   * use with type: select, radio-group, radio-button, checkbox-group, checkbox-button
   */
  options?: {label: string; value?: any}[]

  /**
   * @see https://zhuanlan.zhihu.com/p/97827063
   *
   * use remote to set one prop! remote accept following props:
   * url: remote api address
   * prop: prop name that data inject
   * request: optional, customize how to get your options
   * dataPath: optional, data's path in response
   * onResponse: optional, deal with your response
   * onError: optional, deal with request error
   * and, we treat select, radio-group, checkbox-group specially and the resp will be map as an el-option's group! following props only suitable for this case
   * label: optional, label key in resp
   * value: optional, value key in resp
   */
  remote?: {
    url: string
    request = () => this.$axios.get(url).then(resp => resp.data)
    prop = 'options'
    dataPath = ''
    onResponse = resp => {
      if (dataPath) resp = _get(resp, dataPath)
      switch (this.data.type) {
        case 'select':
        case 'checkbox-group':
        case 'radio-group':
          return resp.map(item => ({
            label: item[label],
            value: item[value]
          }))
        default:
          return resp
      }
    }
    onError = error => console.error(error.message)
    label = 'label'
    value = 'value'
  }

  attrs?: object // html attributes
  /**
   * use to define props of the actual component of this form-item, such as placeholder of el-input
   */
  el?: object

  /**
   * custom component
   * use it when element's form components are not enough
   */
  component?: Vue

  /**
   * whether to override the validation rules written in custom components
   * `true` to override, default `false`
   */
  overrideRules: boolean

  label?: string //set el-form-item's label
  trim = true // trim value at change event

  // obj is param you passed to updateForm. You can use this function to hijack this process and customize the form value
  inputFormat?: (obj: any) => any

  // used to hijack the getFormValue's process and customize the return value
  outputFormat?: (val: any) => any

  // set el-form-item's rules
  rules?: object

  // @deprecated
  atChange?: (id: string, value: any) => void

  /**
   * listen to any events emitted by component of form item
   * @param {any[]} args - what that event emits
   * @param {function} updateForm - same as methods.updateForm
   */
  on?: {
    [eventName: string]: (args: any[], updateForm: function) => void
  }
}

/**
 * a tour of typescript
 */
interface obj {
  a: string // type string
  b?: string // type string, optional
  c = true // type boolean, optional, default true
  d: string[] // type array, each item must be string
  e: any // could be any valid js type
  f: (a: number) => void // type function, which receives a param 'a' as number and return nothing
  h: Vue // instance of Vue
  i: {[a: string]: number} // type object, whose key is type string, and value is type number
}
```

## Methods

support all [el-form's methods](https://element.eleme.io/#/zh-CN/component/form#form-methods)

## Slots

| Slot     | Description                                 |
| -------- | ------------------------------------------- |
| default  | insert at bottom                            |
| id:hello | insert before form-item whose id is 'hello' |
