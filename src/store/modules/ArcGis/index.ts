import mitt from 'mitt'
import { defineStore } from "pinia"
import { ArcGisStore } from "./type"


export const useArcGisStore = defineStore("useArcGisStore", {
    state: (): ArcGisStore => ({
        ArcGisView: null,
        mapEmitter: mitt(),
        popupVisible: false,
        popupData: null,
        coordinate: null
    }),
    getters: {},
    persist: true,
    actions: {
        setArcGisView(view: __esri.SceneView | null) {
            this.ArcGisView = view
        },
        setPopupVisible(visible: boolean) {
            this.popupVisible = visible
        },
        setPopupData(data: PopupData | null) {
            this.popupData = data
        },
        setCoordinate(coordinate: any) {
            this.coordinate = coordinate
        }

    },

})