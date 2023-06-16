import mitt from 'mitt'
import { defineStore } from "pinia"
import { ArcGisStore } from "./type"


export const useArcGisStore = defineStore("useArcGisStore", {
    state: (): ArcGisStore => ({
        ArcGisView: null,
        mapEmitter: mitt(),
        popupVisible: false,
        popupData: null,
        coordinate: null,
        customPointArr: null,
        isMove: false,
        nowMoveLayer: null,
        oldLayerAttrData: undefined,
        moveConfirmCenter: null,
        nowSelectAreaName: null
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
        },
        setCustomPointArr(arr: __esri.Layer[] | null) {
            this.customPointArr = arr
        },
        setIsMove(isMove: boolean) {
            this.isMove = isMove
        },
        setNowMoveLayer(layer: __esri.Layer | null) {
            this.nowMoveLayer = layer
        },
        setOldLayerAttrData(data: SinglePointItem | undefined) {
            this.oldLayerAttrData = data
        },
        setMoveConfirmCenter(center: [number, number] | null) {
            this.moveConfirmCenter = center
        },
        setNowSelectAreaName(name: number | null) {
            this.nowSelectAreaName = name
        }

    },

})