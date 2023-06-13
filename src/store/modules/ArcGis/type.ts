export interface ArcGisStore {
    ArcGisView: __esri.SceneView | null
    mapEmitter: any
    popupVisible: boolean
    popupData: PopupData | null
    coordinate: any
}