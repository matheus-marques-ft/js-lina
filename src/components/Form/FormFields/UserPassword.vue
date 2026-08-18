<template>
  <div class="user-password">
    <PasswordInput :attrs="inputAttrs" :value="value" @input="handleInput" />
    <ul v-if="requirements.length" class="user-password__requirements">
      <li v-for="req in requirements" :key="req.key" :class="{ satisfied: req.satisfied }">
        <el-icon v-if="req.satisfied"><CircleCheckFilled /></el-icon>
        <span v-else class="user-password__dot" />
        {{ req.label }}
      </li>
    </ul>
  </div>
</template>

<script>
import PasswordInput from './PasswordInput.vue'
import { mapGetters } from 'vuex'
import store from '@/store'
import i18n from '@/i18n/i18n'

const SPECIAL_CHAR_PATTERN = new RegExp(
  "[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？_+-]"
)

export default {
  name: 'UserPassword',
  components: { PasswordInput },
  inheritAttrs: false,
  emits: ['input'],
  props: {
    value: {
      type: String,
      default: ''
    }
  },
  rules(item) {
    let userIsOrgAdmin = item.el.userIsOrgAdmin
    // undefined means the personal info update or change-password page, using the current user; otherwise use the value passed in the update-user form
    userIsOrgAdmin =
      userIsOrgAdmin === undefined ? store.getters.currentUserIsAdmin : userIsOrgAdmin

    const passwordRule = store.getters.publicSettings.PASSWORD_RULE
    const validatePassword = function (rule, value, callback) {
      if (!value) {
        return callback()
      }
      const patterns = []
      if (passwordRule['SECURITY_PASSWORD_UPPER_CASE']) {
        patterns.push([/[A-Z]/, i18n.t('UPPER_CASE_REQUIRED')])
      }
      if (passwordRule['SECURITY_PASSWORD_LOWER_CASE']) {
        patterns.push([/[a-z]/, i18n.t('LOWER_CASE_REQUIRED')])
      }
      if (passwordRule['SECURITY_PASSWORD_NUMBER']) {
        patterns.push([/\d/, i18n.t('NUMBER_REQUIRED')])
      }
      if (passwordRule['SECURITY_PASSWORD_SPECIAL_CHAR']) {
        patterns.push([SPECIAL_CHAR_PATTERN, i18n.t('SPECIAL_CHAR_REQUIRED')])
      }
      for (const [pattern, msg] of patterns) {
        if (!pattern.test(value)) {
          return callback(new Error(msg))
        }
      }
      let secureLength = passwordRule ? passwordRule['SECURITY_PASSWORD_MIN_LENGTH'] : 7
      if (userIsOrgAdmin) {
        secureLength = passwordRule ? passwordRule.SECURITY_ADMIN_USER_PASSWORD_MIN_LENGTH : 7
      }
      if (value.length < secureLength) {
        return callback(new Error(i18n.t('MIN_LENGTH_ERROR', [secureLength])))
      }
      callback()
    }
    return [{ required: false, trigger: 'change', validator: validatePassword }]
  },
  computed: {
    ...mapGetters(['publicSettings']),
    inputAttrs() {
      const { modelValue, userIsOrgAdmin, ...attrs } = this.$attrs
      return {
        ...Object.fromEntries(Object.entries(attrs).filter(([name]) => !/^on[A-Z]/.test(name))),
        showStrengthMeter: true
      }
    },
    passwordRule() {
      return this.publicSettings.PASSWORD_RULE || {}
    },
    userIsOrgAdmin() {
      const attrValue = this.$attrs.userIsOrgAdmin
      return attrValue === undefined ? store.getters.currentUserIsAdmin : attrValue
    },
    minLength() {
      const rule = this.passwordRule
      return this.userIsOrgAdmin
        ? rule.SECURITY_ADMIN_USER_PASSWORD_MIN_LENGTH || 7
        : rule.SECURITY_PASSWORD_MIN_LENGTH || 7
    },
    requirements() {
      const rule = this.passwordRule
      const value = this.value || ''
      const items = [
        {
          key: 'length',
          label: this.$t('MIN_LENGTH_ERROR', [this.minLength]),
          satisfied: value.length >= this.minLength
        }
      ]
      if (rule.SECURITY_PASSWORD_UPPER_CASE) {
        items.push({
          key: 'upper',
          label: this.$t('UPPER_CASE_REQUIRED'),
          satisfied: /[A-Z]/.test(value)
        })
      }
      if (rule.SECURITY_PASSWORD_LOWER_CASE) {
        items.push({
          key: 'lower',
          label: this.$t('LOWER_CASE_REQUIRED'),
          satisfied: /[a-z]/.test(value)
        })
      }
      if (rule.SECURITY_PASSWORD_NUMBER) {
        items.push({
          key: 'number',
          label: this.$t('NUMBER_REQUIRED'),
          satisfied: /\d/.test(value)
        })
      }
      if (rule.SECURITY_PASSWORD_SPECIAL_CHAR) {
        items.push({
          key: 'special',
          label: this.$t('SPECIAL_CHAR_REQUIRED'),
          satisfied: SPECIAL_CHAR_PATTERN.test(value)
        })
      }
      return items
    }
  },
  methods: {
    handleInput(value) {
      this.$emit('input', value)
    }
  }
}
</script>

<style lang="scss" scoped>
.user-password__requirements {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--color-text-secondary);

    .el-icon {
      color: var(--color-success);
    }
  }

  .user-password__dot {
    flex-shrink: 0;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-disabled);
  }

  li.satisfied {
    color: var(--color-success);
  }
}
</style>
