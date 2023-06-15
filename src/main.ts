import { createApp } from 'vue'
import App from './App.vue'
import router from "./router"
import pinia from "./store"
import ArcoVue from '@arco-design/web-vue';
import '@arco-design/web-vue/dist/arco.css';
import 'uno.css'
import '@/assets/style/custom.less'
import "@arcgis/core/assets/esri/themes/light/main.css" // 引入ArcGis样式

const app = createApp(App)
app.use(router)
app.use(pinia)
app.use(ArcoVue)

app.mount('#app')
