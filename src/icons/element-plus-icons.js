// Globally register Element Plus icon components (PascalCase names)
// Can be used directly in templates: <el-icon><InfoFilled /></el-icon>, no need to import per file
import * as ElementPlusIcons from '@element-plus/icons-vue'
import { legacyIconComponents } from './legacy-icon-map'

export function installElementPlusIcons(app) {
  for (const [name, component] of Object.entries(ElementPlusIcons)) {
    app.component(name, component)
  }

  // Compatible with legacy Element UI icon names, allowing templates like <el-icon-download /> to keep working.
  for (const [legacyName, component] of Object.entries(legacyIconComponents)) {
    app.component(legacyName, component)
  }
}

export default {
  install: installElementPlusIcons
}
