import i18n from '@/i18n/i18n'
import rules from '@/components/Form/DataForm/rules'
import { JsonEditor } from '@/components/Form/FormFields'
import { assetFieldsMeta } from '@/views/assets/const'
import AutomationMethodField from './AutomationMethodField'

const needSettingParamsFields = ['push_account', 'change_secret']

export const platformFieldsMeta = (vm) => {
  const assetMeta = assetFieldsMeta(vm)
  return {
    automation: {
      initial: {
        ansible_config: ''
      },
      fields: [
        'ansible_enabled',
        'ansible_config',
        'ping_enabled',
        'ping_method',
        'ping_params',
        'gather_facts_enabled',
        'gather_facts_method',
        'gather_facts_params',
        'change_secret_enabled',
        'change_secret_method',
        'change_secret_params',
        'push_account_enabled',
        'push_account_method',
        'push_account_params',
        'verify_account_enabled',
        'verify_account_method',
        'verify_account_params',
        'gather_accounts_enabled',
        'gather_accounts_method',
        'gather_accounts_params',
        'remove_account_enabled',
        'remove_account_method',
        'remove_account_params'
      ],
      fieldsMeta: {
        ansible_config: {
          component: JsonEditor,
          hidden: (formValue) => !formValue['ansible_enabled']
        },
        gather_facts_enabled: {},
        remove_account_enabled: {},
        ping_method: {},
        ping_params: {
          label: ''
        },
        gather_facts_method: {},
        push_account_method: {},
        remove_account_method: {},
        remove_account_params: {},
        push_account_params: {
          label: ''
        },
        change_secret_method: {
          on: {
            change: ([val]) => {
              vm.fieldsMeta.automation.fieldsMeta.change_secret_params.el.method = val
            }
          }
        },
        change_secret_params: {
          label: '',
          el: {
            title: vm.$t('ChangeSecretParams'),
            method: 'change_secret_posix'
          }
        },
        verify_account_method: {}
      }
    },
    category_type: {
      type: 'cascader',
      label: i18n.t('Type'),
      rules: [rules.Required],
      el: {
        multiple: false,
        options: [],
        disabled: true
      },
      hidden: (formValue) => {
        if (formValue?.category_type?.[0] === undefined) {
          formValue.category_type = vm.initial.category_type
        }
      }
    },
    charset: {},
    gateway_enabled: {
      el: {
        disabled: false
      }
    },
    ds_enabled: {
      el: {
        disabled: false
      }
    },

    protocols: {
      label: i18n.t('SupportedProtocol'),
      ...assetMeta.protocols,
      el: {
        choices: []
      },
      helpText: i18n.t('SupportedProtocolHelpText')
    },
    su_method: {
      type: 'select',
      options: [],
      hidden: (form) => !form['su_enabled']
    }
  }
}

export const setAutomations = (vm) => {
  const automation = vm.defaultOptions.automation || {}
  const autoFieldsMeta = vm.fieldsMeta.automation.fieldsMeta
  const autoFields = vm.fieldsMeta.automation.fields
    .filter((item) => item.endsWith('_method'))
    .map((item) => item.replace('_method', ''))

  const initial = vm.initial.automation || {}
  initial['ansible_enabled'] = automation['ansible_enabled']
  initial['ansible_config'] = automation['ansible_config']

  if (initial['ansible_enabled'] === false) {
    _.set(autoFieldsMeta, `ansible_enabled.el.disabled`, true)
  }

  for (const item of autoFields) {
    const itemEnabledKey = item + '_enabled'
    const itemMethodKey = item + '_method'
    const itemParamsKey = item + '_params'
    const itemEnabled = automation[itemEnabledKey]
    // Set enableKey disabled state and default value
    if (itemEnabled === false) {
      initial[itemEnabledKey] = false
      _.set(autoFieldsMeta, `${itemEnabledKey}.el.disabled`, true)
    } else {
      initial[itemEnabledKey] = true
    }

    // Set enableKey hidden
    _.set(autoFieldsMeta, `${itemEnabledKey}.hidden`, (formValue) => {
      return !formValue['ansible_enabled']
    })
    // Set enableMethod hidden
    _.set(autoFieldsMeta, `${itemMethodKey}.hidden`, (formValue) => {
      return !formValue[itemEnabledKey] || !formValue['ansible_enabled']
    })
    _.set(autoFieldsMeta, `${itemEnabledKey}.attrs.class`, 'item-enable')
    // Set enableMethod className
    _.set(autoFieldsMeta, `${itemMethodKey}.attrs.class`, 'item-method')
    // Set enableParams hidden
    // The params field is no longer rendered separately (the gear button has been merged
    // into the method composite component), but its value still needs to be submitted
    // with the form, so its form row is always hidden and only its value is kept.
    _.set(autoFieldsMeta, `${itemParamsKey}.hidden`, () => true)
    // The method field now uses a composite component: el-select joined with the
    // params-setting button into a single input-group
    const methods = automation[itemMethodKey + 's'] || []
    const options = methods.map((method) => {
      return { value: method['id'], label: method['name'] }
    })
    _.set(autoFieldsMeta, `${itemMethodKey}.component`, AutomationMethodField)
    _.set(autoFieldsMeta, `${itemMethodKey}.el.options`, options)
    _.set(
      autoFieldsMeta,
      `${itemMethodKey}.el.paramsUrl`,
      '/api/v1/assets/platform-automation-methods/'
    )
    _.set(
      autoFieldsMeta,
      `${itemMethodKey}.el.paramsTitle`,
      autoFieldsMeta[itemParamsKey]?.el?.title
    )
    _.set(autoFieldsMeta, `${itemMethodKey}.el.paramsKey`, itemParamsKey)
    _.set(autoFieldsMeta, `${itemMethodKey}.el.paramsValue`, initial[itemParamsKey] || {})
    _.set(initial, `${itemMethodKey}`, options[0]?.value)

    // Write the params back: the paramsChange event emitted by the composite component
    // is merged back into the _params field via updateForm; the existing on handlers
    // for method (e.g. change_secret's cascading change) are preserved.
    const existingOn = autoFieldsMeta[itemMethodKey].on || {}
    _.set(autoFieldsMeta, `${itemMethodKey}.on`, {
      ...existingOn,
      paramsChange: (args, updateForm) => {
        if (updateForm) {
          updateForm({ [itemParamsKey]: args[0] })
        }
      }
    })
  }
}

export const updateAutomationParams = (vm, obj) => {
  needSettingParamsFields.forEach((v) => {
    const value = _.get(obj.automation, `${v}_method`)
    _.set(vm.fieldsMeta.automation.fieldsMeta, `${v}_params.el.method`, value)
  })
}
