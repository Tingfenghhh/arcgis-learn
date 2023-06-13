import { createPinia } from "pinia"
import { useArcGisStore } from "./modules/ArcGis"

// 引入持久化插件
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'


const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
export { useArcGisStore }
export default pinia