export interface ArcGisStore {
    ArcGisView: __esri.SceneView | null
    mapEmitter: any
    popupVisible: boolean
    popupData: PopupData | null
    coordinate: any
    customPointArr: __esri.Layer[] | null
    isMove: boolean,
    nowMoveLayer: __esri.Layer | null
    oldLayerAttrData: SinglePointItem | undefined
}