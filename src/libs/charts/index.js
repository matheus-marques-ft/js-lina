import {
  BarChart,
  GaugeChart,
  LineChart,
  MapChart,
  PieChart,
  RadarChart,
  ScatterChart
} from 'echarts/charts'
import {
  DatasetComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  VisualMapComponent
} from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import VueECharts from 'vue-echarts'
// vue-echarts 7+ moved the root element's x-vue-echarts{width:100%;height:100%} styles into a
// separate css file, which must be imported explicitly, otherwise the chart container size is 0
// and it errors with "[ECharts] Can't get DOM width or height"
import 'vue-echarts/style.css'

/**
 * Initialize and register ECharts extensions
 */
function initECharts() {
  use([
    CanvasRenderer,
    BarChart,
    LineChart,
    PieChart,
    ScatterChart,
    MapChart,
    RadarChart,
    GaugeChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
    DatasetComponent,
    ToolboxComponent,
    DataZoomComponent,
    VisualMapComponent
  ])
}

/**
 * Charts plugin
 * Unified wrapper for all ECharts-related setup
 */
const ChartsPlugin = {
  install(app) {
    // Initialize and register ECharts extensions
    initECharts()

    // Register ECharts components on the Vue app
    app.component('Echarts', VueECharts)
    app.component('Echart', VueECharts)
  }
}

// Export the plugin for use with app.use()
export default ChartsPlugin

// Export the VueECharts component for use elsewhere
export { default as VueECharts } from 'vue-echarts'
