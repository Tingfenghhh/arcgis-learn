import { toRaw } from 'vue'
import useModal from "./modal"
import { MapEnum } from '../enums/MapEnum'
import { storeToRefs } from 'pinia'
import { Handler } from 'mitt'
import { useArcGisStore } from '@/store'
import _ from 'lodash' // 引入lodash
import Map from '@arcgis/core/Map' // 引入ArcGis地图
import SceneView from '@arcgis/core/views/SceneView' // 引入ArcGis地图视图
import WebTileLayer from '@arcgis/core/layers/WebTileLayer' // 引入ArcGis使用网络图层
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer' // GraphicsLayer
import PictureMarkerSymbol from '@arcgis/core/symbols/PictureMarkerSymbol' // 引入ArcGis图片标记
import TextSymbol from '@arcgis/core/symbols/TextSymbol' // 引入ArcGis文字标记
import Graphic from '@arcgis/core/Graphic' // 引入ArcGis标记
import Point from '@arcgis/core/geometry/Point' // 引入ArcGis点
import __esri from '@arcgis/core/intl' // 引入ArcGis的TS所有类型合集
import { Message } from '@arco-design/web-vue'
import location from '@/assets/images/accepted.png'

const MapKey = import.meta.env.VITE_APP_MAP_TOKEN // 天地图key

/**
 * 加载完成
 */
const LOADEND = Symbol('LOADEND')

/**
 * 点击事件(包含点击到的实体和地图点)
 */
const CLICK = Symbol('CLICK')

/**
 * 左键点击事件(只包含地图点)
 */

const LEFT_CLICK = Symbol('LEFT_CLICK')

/**
 * 摄像机高度变化事件
 */
const CAMREAHEIGHT = Symbol('camera.position.z')

type ClearList = 'CLICK' | 'MOUSEMOVE' | 'RIGHTCLICK'

export const useArcGis = () => {
    const { ModalInfo } = useModal()
    const ArcGisStore = useArcGisStore()
    const { mapEmitter, popupVisible, popupData, customPointArr, isMove, ArcGisView, nowMoveLayer, oldLayerAttrData } = storeToRefs(ArcGisStore)
    const { setArcGisView, setPopupVisible, setPopupData, setIsMove, setNowMoveLayer, setOldLayerAttrData } = ArcGisStore
    const { MAXIMUMZOOMDISTANCE, MINIMUMZOOMDISTANCE, DEFAULT_LONGITUDE, DEFAULT_LATITUDE, BOUNDARY_CITY_HEIGHT, CITY_HEIGHT } = MapEnum
    let viewScene: SceneView | null = null // 地图视图
    let clickEvent: __esri.ViewClickEvent | null = null // 当前点击的实体或者地图点
    let coordinate: Point | null = null
    let z = 0 // 摄像机高度
    let nowSingePointHighLight: __esri.Handle | null = null // 当前高亮的点
    let mouseOnMove: IHandle | null = null // 存放鼠标移动的监听
    let mouseOnMovePoint: IHandle | null = null // 存放鼠标移动标签的监听

    /**
     * 初始化地图
     * @date 2023/6/7
     * @param container 地图容器id
     * @returns
     */
    const initMap = async (container: string): Promise<void> => {
        try {
            if (!container) return Promise.reject('container is null')
            // 高德图层
            const gaodeLayer = new WebTileLayer({
                id: 'gaode',
                urlTemplate: 'https://webst01.is.autonavi.com/appmaptile?style=8&ltype=4&x={col}&y={row}&z={level}',
                opacity: 1,
                visible: false
            })

            // 天地图图层
            const tiandituLayer = new WebTileLayer({
                id: 'tianditu',
                urlTemplate: `http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={level}&TILEROW={row}&TILECOL={col}&tk=${MapKey}`,
                opacity: 1,
                visible: true
            })

            // 地图
            const map = new Map({
                layers: [tiandituLayer, gaodeLayer]
            })

            // 视图
            const view = new SceneView({
                // 设置容器 一个div 的 id
                container,
                // 设置地图
                map: map,
                // 设置默认缩放层级
                zoom: 1,
                // 设置地图中心点
                center: [DEFAULT_LONGITUDE, DEFAULT_LATITUDE],
                // 设置渲染质量
                qualityProfile: 'low',
                // 限制缩放层级高度
                constraints: {
                    altitude: {
                        max: MAXIMUMZOOMDISTANCE,
                        min: MINIMUMZOOMDISTANCE
                    }
                },
                // 地球透明度
                alphaCompositingEnabled: true,
                // 地球环境 设置背景颜色 (还需将地球盒子的div或者父级div的背景颜色设置想要的颜色即可)
                environment: {
                    background: {
                        type: "color",
                        color: [255, 252, 244, 0],
                    },
                    // 星空启用
                    starsEnabled: true,
                    // 大气层启用
                    atmosphereEnabled: true,
                    // 光照模拟 sun 就是太阳有光照效果区分白天和黑夜 virtual 就是没有光照效果
                    lighting: {
                        type: "virtual"
                    }
                },
            })
            viewScene = view
            setArcGisView(view)

            // 监听视图点击事件
            view.on(
                'click',
                _.throttle(async (event: __esri.ViewClickEvent) => {
                    // hitTest 方法在点击位置上如果存在 Graphic（线或点），即可获取 Graphic 对象的整个数据
                    view.hitTest(event).then((response: __esri.SceneViewHitTestResult) => {
                        try {
                            if (response.results.length > 0) {
                                if (isMove.value) {
                                    moveIconConfirm()
                                    return
                                }
                                setPopupVisible(false)
                                // 利用点击到的图标经纬度（这里的经纬度是渲染时json里面的或者是第一次点击地图添加图标时的经纬度数据，和再次点击图标时的经纬度有差异），替换event.mapPoint里面的经纬度，以减小误差 （不替换经纬度数据会导致弹窗位置差异很大）
                                // 这里处理的是默认弹窗
                                const res = response.results[0] as __esri.SceneViewGraphicHit
                                const { longitude, latitude } = res.graphic.attributes
                                const { type } = res.graphic.attributes
                                // 单独点到的点或者线
                                if (type !== 'polygon') {
                                    event.mapPoint.longitude = longitude
                                    event.mapPoint.latitude = latitude
                                    clickEvent = event
                                    // 点击到的Graphic（线或点）
                                    mapEmitter.value.emit(CLICK, response)
                                } else {
                                    // 点到了面，但是要触发普通地图点击事件 
                                    closeHighLight(true)
                                    mapEmitter.value.emit(LEFT_CLICK, event)
                                    clickEvent = event
                                    setPopupVisible(false)
                                }
                            } else {
                                if (isMove.value) {
                                    moveIconConfirm()
                                    return
                                }
                                // 普通地图点击事件 可获取点击位置的经纬度
                                closeHighLight(true)
                                mapEmitter.value.emit(LEFT_CLICK, event)
                                clickEvent = event
                                setPopupVisible(false)
                            }
                        } catch (error) {
                            throw new Error(error as string)
                        }
                    })
                }, 500)
            )


            // 监听鼠标移动进入事件
            mouseOnMove = view.on(
                'pointer-move',
                _.throttle(async (event: __esri.ViewPointerMoveEvent) => {
                    view.hitTest(event).then((response: __esri.SceneViewHitTestResult) => {
                        try {
                            if (isMove.value) {
                                return
                            }
                            if (response.results.length > 0) {
                                mouseMoveHighlight(response)
                                return
                            }
                        } catch (error) {
                            throw new Error(error as string)
                        }
                    })

                }, 150)
            )

            // 监听鼠标移动点位事件
            mouseOnMovePoint = view.on(
                'pointer-move',
                _.throttle(async (event: __esri.ViewPointerMoveEvent) => {
                    view.hitTest(event).then((response: __esri.SceneViewHitTestResult) => {
                        try {
                            if (isMove.value) {
                                moveIcon(response)
                                return
                            }
                        } catch (error) {
                            throw new Error(error as string)
                        }
                    })

                }, 0)
            )


            // 监听试图中心点改变事件
            view.watch('center', () => {
                try {
                    if (!z) return
                    if (coordinate && popupData.value && z < CITY_HEIGHT && popupVisible.value) {
                        const { x, y } = view.toScreen(coordinate)
                        const dataObj: PopupData = {
                            top: Math.floor(y),
                            left: Math.floor(x),
                            attributes: popupData.value.attributes
                        }
                        setPopupData(dataObj)
                        setPopupVisible(true)
                    }
                } catch (error) {
                    throw new Error(error as string)
                }

            })

            // 监听resize事件
            view.watch('size', () => {
                try {
                    if (!z) return
                    if (coordinate && popupData.value && z < CITY_HEIGHT && popupVisible.value) {
                        const { x, y } = view.toScreen(coordinate)
                        const dataObj: PopupData = {
                            top: Math.floor(y),
                            left: Math.floor(x),
                            attributes: popupData.value.attributes
                        }
                        setPopupData(dataObj)
                        setPopupVisible(true)
                    }
                } catch (error) {
                    throw new Error(error as string)
                }
            })

            // 监听视图缩放事件
            view.watch(
                'camera',
                _.debounce((event: any) => {
                    try {
                        // 根据高度控制高德图层地名的显示隐藏
                        z = event.position.z
                        if (z <= BOUNDARY_CITY_HEIGHT) {
                            gaodeLayer.visible = true
                        } else {
                            gaodeLayer.visible = false
                        }
                        mapEmitter.value.emit(CAMREAHEIGHT, event)
                    } catch (error) {
                        throw new Error(error as string)
                    }
                }, 200)
            )


            // 监听当图层加载完成后
            view.when(() => {
                // 当图层加载完成后，设置视图飞行到哪里
                tiandituLayer
                    .when(() => {
                        setTimeout(() => {
                            flyTo(
                                {
                                    target: [104.072619, 30.663776],
                                    zoom: 6
                                },
                                {
                                    duration: 1500
                                }
                            )
                                .then(() => {
                                    mapEmitter.value.emit(LOADEND, view)
                                })
                                .catch((error) => {
                                    Message.info({
                                        id: 'error',
                                        content: '飞行已终止'
                                    })
                                    throw new Error(error as string)
                                })
                        }, 100)
                    })
                    .catch((error) => {
                        throw new Error(error as string)
                    })
            })

            // 监听所有图层中任意一个图层销毁
            view.on("layerview-destroy", () => {
                // 图层销毁删除鼠标移动事件监听
                // mouseOnMove.remove()
            })



            return Promise.resolve()
        } catch (error) {
            return Promise.reject(error)
        }
    }

    /**
     * 飞行到指定位置
     * @date 2023/6/7
     * @param target 飞行的目标
     * @param options 飞行的配置
     * @returns
     */
    const flyTo = async (target: __esri.GoToTarget3D, options?: __esri.GoToOptions3D): Promise<void> => {
        try {
            if (!viewScene) return Promise.reject('view is null')
            await viewScene
                .goTo(target, options)
                .then(() => {
                    return Promise.resolve()
                })
                .catch((error) => {
                    return Promise.reject(error)
                })
        } catch (error) {
            Message.info({
                id: 'error',
                content: '飞行已终止'
            })
            throw new Error(error as string)
        }
    }

    /**
     * 视角还原
     * @date 2023/6/7
     * @returns
     */
    const flyToHome = async (): Promise<void> => {
        try {
            if (!viewScene) return Promise.reject('viewScene is null')
            flyTo(
                {
                    target: [104.072619, 30.663776],
                    zoom: 1
                },
                {
                    duration: 1500
                }
            )
                .then(() => {
                    return Promise.resolve()
                })
                .catch((error) => {
                    return Promise.reject(error)
                })
        } catch (error) {
            throw new Error(error as string)
        }
    }

    /**
     * 监听地图加载是否完毕
     * @date 2023/6/7
     * @param handler
     */
    const mapLoaded = (handler: Handler<SceneView>) => {
        try {
            mapEmitter.value.on(LOADEND, (view: SceneView) => {
                handler(view)
                mapEmitter.value.off(LOADEND)
            })
        } catch (error) {
            throw new Error(error as string)
        }
    }

    /**
     * 地图标签点击
     * @param handler
     * @date 2023/6/8
     */
    const mapLabelClick = (handler: Handler<__esri.SceneViewHitTestResult>) => {
        try {
            mapEmitter.value.on(CLICK, (event: __esri.SceneViewHitTestResult) => {
                handler(event)
            })
        } catch (error) {
            throw new Error(error as string)
        }
    }

    /**
     * 显示或者隐藏地图标签
     * @param customPointArr 自定义点位数组
     * @param visible  是否显示
     * @date 2023/6/13
     * @returns 
     */
    const mapLabelVisible = (customPointArr: SinglePointItem[], visible: boolean) => {
        try {
            if (!viewScene) return
            if (!customPointArr.length) return
            getAllCustomLayer(customPointArr).then((res: __esri.Layer[]) => {
                if (visible) {
                    res.forEach((item: __esri.Layer) => {
                        item.visible = true
                    })
                } else {
                    res.forEach((item: __esri.Layer) => {
                        item.visible = false
                    })
                }

            })
        } catch (error) {
            throw new Error(error as string)
        }
    }

    /**
     * 地图普通点击事件
     * @param handler 
     * @date 2023/6/9
     */
    const mapLeftClick = (handler: Handler<__esri.ViewClickEvent>) => {
        try {
            mapEmitter.value.on(LEFT_CLICK, (event: __esri.ViewClickEvent) => {
                handler(event)
            })
        } catch (error) {
            throw new Error(error as string)
        }
    }


    /**
     * 地图自定义标签的聚合，但是在3D场景视图中不受支持-参见 https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-support-FeatureReductionCluster.html
     * @param options 
     * @date 2023/6/13
     * @returns 
     */
    const mapLabelCluster = (options?: __esri.FeatureReductionClusterProperties) => {
        try {
            if (!viewScene) return
            if (!customPointArr.value?.length) return
            console.log("地图自定义标签的聚合11:", customPointArr.value)
            // 创建聚合
            // const featureReductionCluster = new FeatureReductionCluster({
            //     clusterRadius: options.clusterRadius ? options.clusterRadius : 60,
            //     clusterMinSize: options.clusterMinSize ? options.clusterMinSize : 10,
            //     clusterMaxSize: options.clusterMaxSize ? options.clusterMaxSize : 38,
            // })

        } catch (error) {
            throw new Error(error as string)
        }
    }

    /**
     * 图标移动前置操作
     * @param viewScene 接受当前SceneView实例
     * @param layerId  图层id
     * @param oldLayerAttrData 图层attr原始数据,方便后面图标还原时使用
     * @date 2023/6/15
     * @returns 
     */
    const iconMove = (viewScene: SceneView | null, layerId: string, oldLayerAttrData: SinglePointItem | undefined) => {
        try {
            if (!viewScene) return
            if (!isMove) return
            if (nowMoveLayer) {
                setNowMoveLayer(null)
                setOldLayerAttrData(undefined)
            }
            const viewSceneRaw = toRaw(viewScene)
            const layer = viewSceneRaw.map.findLayerById(layerId)
            if (layer) {
                setOldLayerAttrData(oldLayerAttrData)
                setNowMoveLayer(layer)
                setIsMove(true)
            }

        } catch (error) {
            throw new Error(error as string)
        }
    }

    /**
     * 移动图标
     * @param event 要移动的图标并接受传递过来的数据，进行移动
     * @date 2023/6/15
     * @returns 
     */
    const moveIcon = (event: __esri.SceneViewHitTestResult) => {
        try {
            if (!isMove.value) return
            if (!nowMoveLayer.value) return
            if (!viewScene) return
            if (!event) return
            const id = toRaw(nowMoveLayer.value).id
            const layer = viewScene.map.findLayerById(id) as __esri.GraphicsLayer
            if (layer) {
                // 通过删除图层再添加图层的方式实现图标移动 (不推荐)
                viewScene.map.remove(layer)
                setPopupVisible(false)
                const longitude = event.results[0].mapPoint.longitude
                const latitude = event.results[0].mapPoint.latitude
                const PointData: SinglePointItem = {
                    id: layer.id,
                    center: [longitude, latitude],
                    name: layer.graphics.getItemAt(0).attributes.name,
                }
                drawSinglePoint(PointData)
            }
        } catch (error) {
            throw new Error(error as string)
        }
    }


    /**
     * 移动图标确认和取消
     * @date 2023/6/15
     * @returns 
     */
    const moveIconConfirm = () => {
        try {
            ModalInfo({
                title: '提示',
                content: '是否将图标移动到此处？',
            }).then(() => {
                setIsMove(false)
                setNowMoveLayer(null)
                setOldLayerAttrData(undefined)
                Message.success({
                    id: 'move-info',
                    content: '移动成功'
                })
            }).catch(() => {
                if (!isMove.value) return
                if (!nowMoveLayer.value) return
                if (!viewScene) return
                if (!oldLayerAttrData.value) return
                const id = toRaw(nowMoveLayer.value).id
                const layer = viewScene.map.findLayerById(id) as __esri.GraphicsLayer
                if (layer) {
                    // 通过删除图层再添加图层的方式实现图标移动 (不推荐)
                    viewScene.map.remove(layer)
                    setPopupVisible(false)
                    const longitude = oldLayerAttrData.value.center[0]
                    const latitude = oldLayerAttrData.value.center[1]
                    const PointData: SinglePointItem = {
                        id: layer.id,
                        center: [longitude, latitude],
                        name: layer.graphics.getItemAt(0).attributes.name,
                    }
                    drawSinglePoint(PointData)
                }
                setIsMove(false)
                setNowMoveLayer(null)
                setOldLayerAttrData(undefined)
                Message.info({
                    id: 'move-info',
                    content: '取消移动，图标已经还原'
                })
            })
            return
        } catch (error) {
            throw new Error(error as string)
        }
    }



    /**
     * 地图默认弹窗
     * @param data 创建弹窗的数据
     * @param content 内容
     * @date 2023/6/9
     * @returns 
     */
    const mapPopup = (data: __esri.SceneViewHitTestResult | any, title?: string, content?: string | HTMLElement | __esri.Widget) => {
        try {
            if (!viewScene) return
            if (!clickEvent) return
            if (!data) return
            if (data.results) {
                const results = data.results[0]
                console.log(data)
                if (results.type === 'graphic' && results.graphic.attributes !== null) {
                    viewScene.popup.open({
                        title: results.graphic.attributes.name,
                        content: content ? content : results.graphic.attributes.name,
                        location: clickEvent.mapPoint
                    });
                }
            } else {
                // 判断 content 是否为 string
                if (typeof content === 'string') {
                    console.log('content string', content)
                    viewScene.popup.open({
                        title: title ? title : '弹窗',
                        content: content ? content : '弹窗',
                        location: clickEvent.mapPoint
                    });
                    return
                }
                console.log('content html', content)
                viewScene.popup.open({
                    title: title ? title : '弹窗',
                    content: content ? '加载中...' : '弹窗',
                    location: clickEvent.mapPoint
                });
            }
        } catch (error) {
            throw new Error(error as string)
        }
    }

    /**
     * 自定义弹窗
     * @param data 创建弹窗的数据
     * @date 2023/6/9
     * @returns 
     */
    const mapCustomPopup = (data: __esri.SceneViewHitTestResult | any) => {
        try {
            if (!viewScene) return
            if (!clickEvent) return
            // 这里处理的是自定义弹窗
            const geometry = data.graphic.geometry
            if (geometry) {
                // 如果是 point 就拿geometry，如果是线段或者多边形就拿extent.center中心点做定位坐标， 如果都不是就拿点击点做兜底处理
                coordinate = geometry?.type === 'point' ? geometry : geometry.extent ? geometry.extent.center : clickEvent.
                    mapPoint
            } else {
                setPopupVisible(false)
            }
            // 坐标转屏幕像素 这里的x y 就是left top 屏幕像素
            // 赋给弹窗做定位就行
            if (coordinate) {
                const { x, y } = viewScene.toScreen(coordinate)
                const dataObj: PopupData = {
                    top: Math.floor(y),
                    left: Math.floor(x),
                    attributes: data.graphic.attributes
                }
                setPopupData(dataObj)
                setPopupVisible(true)
            }
        } catch (error) {
            throw new Error(error as string)
        }
    }

    /**
     * 鼠标移动到标签的高亮 (二选一,对边界和边界上的实体无效)   这个是根据事件全自动高亮  两个一起使用暂时没发现冲突
     * @param results 当前鼠标滑过的对象
     * @date 2023/6/12
     * @returns 
     */
    const mouseMoveHighlight = (results: __esri.SceneViewHitTestResult) => {
        try {
            if (!viewScene) return
            if (!results) return
            if (nowSingePointHighLight !== null) {
                nowSingePointHighLight.remove()
            }
            const { graphic } = results.results[0] as any
            const isArea = graphic.attributes.adcode
            if (isArea) return
            if (graphic && graphic.layer) {
                viewScene.whenLayerView(graphic.layer).then((layerView) => {
                    nowSingePointHighLight = layerView.highlight(graphic);
                })
            }
        } catch (error) {
            throw new Error(error as string)
        }
    }


    /**
     * 当前自定义点到标签的高亮 (二选一,对边界和边界上的实体无效)  需要手动调方法传入参数实现高亮  两个一起使用暂时没发现冲突
     * @param results 当前鼠标点击的对象
     * @date 2023/6/12
     * @returns 
     */
    const mapClickHighlight = (results: any) => {
        try {
            if (!viewScene) return
            if (!results) return
            if (nowSingePointHighLight !== null) {
                nowSingePointHighLight.remove()
            }
            const graphic = results.graphic
            if (graphic) {
                viewScene.whenLayerView(graphic.layer).then((layerView) => {
                    nowSingePointHighLight = layerView.highlight(graphic);
                })
            }
        } catch (error) {
            throw new Error(error as string)
        }
    }

    /**
     * 关闭高亮
     * @param status 是否高亮
     * @date 2023/6/12
     */
    const closeHighLight = (status: boolean) => {
        try {
            if (!nowSingePointHighLight) return
            if (status) {
                nowSingePointHighLight.remove()
            }
        } catch (error) {
            throw new Error(error as string)
        }
    }


    /**
     * 绘制单独点位带图标  单独图层 删除需要单独删除
     * @param data 单独点位数据
     * @date 2023/6/8
     * @returns
     */
    const drawSinglePoint = async (data: SinglePointItem): Promise<void> => {
        try {
            if (!viewScene) return Promise.reject('viewScene is null')
            if (!data) return Promise.reject('geoJsonData is null')
            // 绘创建图层
            const graphicsLayer = new GraphicsLayer({
                id: `${data.id}` // 图层id
            })
            // 添加图层
            viewScene.map?.add(graphicsLayer)
            // 获取坐标
            const textPoint = new Point({
                longitude: data.center[0],
                latitude: data.center[1]
            })
            // 创建文字的样式
            const text = new TextSymbol({
                text: data.name,
                color: 'gold',
                font: {
                    size: 12,
                    weight: 'bold'
                },
                backgroundColor: 'rgba(0,0,0,0.5)',
            })
            // 创建文字的图层
            const textGraphic = new Graphic({
                geometry: textPoint,
                symbol: text,
                attributes: {
                    name: data.name,
                    id: data.id,
                    center: data.center
                }
            })

            // 设置图标点的图片和样式
            const markerSymbol = new PictureMarkerSymbol({
                url: data.img ? data.img : location,
                width: '16px',
                height: '21px',
                xoffset: 0,
                yoffset: -18
            })
            // 获取坐标
            const point = new Point({
                longitude: data.center[0],
                latitude: data.center[1]
            })
            const labelGraphic = new Graphic({
                geometry: point,
                symbol: markerSymbol,
                attributes: {
                    name: data.name,
                    id: data.id,
                    center: data.center
                }
            })
            graphicsLayer.addMany([labelGraphic, textGraphic])
            return Promise.resolve()
        } catch (error) {
            throw new Error(error as string)
        }
    }

    /**
     * 绘边界线以及点位名称
     * @param geoJsonData 根据geoJson数据绘制边界线和边界上的点位名称
     * @date 2023/6/8
     * @returns
     */
    const drawLine = async (geoJsonData: any): Promise<void> => {
        try {
            if (!viewScene) return Promise.reject('viewScene is null')
            if (!geoJsonData) return Promise.reject('geoJsonData is null')
            removeLineAndArea()
            await geoJsonData.features.forEach((element: any) => {
                if (!viewScene) return
                // 获取坐标
                const paths = element.geometry.coordinates[0]
                // 创建线
                const polyline = {
                    type: 'polyline',
                    paths
                }
                // 创建线的样式
                const lineSymbol = {
                    type: 'simple-line',
                    color: [254, 219, 15],
                    width: 2
                }
                // 创建线的图层
                const polylineGraphic = new Graphic({
                    geometry: polyline as __esri.GeometryProperties,
                    symbol: lineSymbol
                })
                // 获取坐标
                const point = new Point({
                    longitude: element.properties.center[0],
                    latitude: element.properties.center[1]
                })
                // 创建文字的样式
                const text = new TextSymbol({
                    text: element.properties.name,
                    color: 'gold',
                    font: {
                        size: 12,
                        weight: 'bold'
                    },
                    backgroundColor: 'rgba(0,0,0,0.5)',
                })
                // 创建文字的图层
                const labelGraphic = new Graphic({
                    geometry: point,
                    symbol: text,
                    attributes: {
                        name: element.properties.name,
                        adcode: element.properties.adcode,
                        longitude: element.properties.center[0],
                        latitude: element.properties.center[1]
                    }
                })
                // 创建图标点的图片和样式
                const markerSymbol = new PictureMarkerSymbol({
                    url: location,
                    width: '16px',
                    height: '21px',
                    xoffset: 0,
                    yoffset: -18
                })
                // 获取坐标
                const imgPoint = new Point({
                    longitude: element.properties.center[0],
                    latitude: element.properties.center[1]
                })
                // 创建图标点的图层
                const labelImgGraphic = new Graphic({
                    geometry: imgPoint,
                    symbol: markerSymbol,
                    attributes: {
                        name: element.properties.name,
                        adcode: element.properties.adcode,
                        longitude: element.properties.center[0],
                        latitude: element.properties.center[1]
                    }
                })

                // 创建填充
                const polygon = {
                    type: "polygon",
                    rings: paths
                };

                const fillSymbol = {
                    type: "simple-fill",
                    color: [71, 106, 120, 0.2],
                    outline: {
                        color: [255, 255, 255],
                        width: 1
                    }
                };

                // const fillP
                // 创建面的图层
                const polygonGraphic = new Graphic({
                    geometry: polygon as __esri.GeometryProperties,
                    symbol: fillSymbol,
                    // 添加这个可使其点击面也可以跳转
                    attributes: {
                        type: 'polygon',
                        name: element.properties.name,
                        adcode: element.properties.adcode,
                        longitude: element.properties.center[0],
                        latitude: element.properties.center[1]
                    }

                })
                // 添加线和点 以及图片到视图  暂时不添加面
                viewScene.graphics.addMany([polylineGraphic, labelGraphic, labelImgGraphic, polygonGraphic])
                // 监听视图点击事件
            })
            return Promise.resolve()
        } catch (error) {
            throw new Error(error as string)
        }
    }

    /**
     * 刪除图层和边界线
     * @date 2023/6/8 删除根据geoJson数据绘制边界线和边界上的点位名称的数据
     * @returns
     */
    const removeLineAndArea = (): Promise<void> => {
        try {
            if (!viewScene) return Promise.reject('viewScene is null')
            viewScene.graphics.removeAll()
            return Promise.resolve()
        } catch (error) {
            throw new Error(error as string)
        }
    }

    /**
     * 删除点位可单个删除或者批量删除
     * @param id 根据id删除点位（一般指的是自己渲染的点位）
     * @date 2023/6/8
     * @returns
     */
    const removePoint = (geoJsonData?: any, id?: string): Promise<void> => {
        try {
            if (!ArcGisView.value) return Promise.reject('viewScene is null')
            const ViewScene = toRaw(ArcGisView.value)
            if (geoJsonData) {
                nowSingePointHighLight?.remove()
                geoJsonData.features.forEach((element: any) => {
                    if (!ViewScene) return Promise.reject('viewScene is null')
                    const layer = ViewScene.map?.findLayerById(String(element.properties.adcode))
                    if (layer) {
                        ViewScene.map.remove(layer)
                    }
                })
                return Promise.resolve()
            }
            if (id) {
                nowSingePointHighLight?.remove()
                const layer = ViewScene.map?.findLayerById(id)
                if (layer) {
                    ViewScene.map.remove(layer)
                    return Promise.resolve()
                }
            }
            return Promise.resolve()
        } catch (error) {
            throw new Error(error as string)
        }
    }

    /**
     * 获取所有自定义渲染的图层
     * @param customPointArr  自定义渲染的图层的id数组
     * @date 2023/6/13
     * @returns 
     */
    const getAllCustomLayer = async (customPointArr: SinglePointItem[]): Promise<__esri.Layer[]> => {
        try {
            if (!viewScene) return Promise.reject('viewScene is null')
            const allLayers: __esri.Layer[] = []
            customPointArr.forEach((element: SinglePointItem) => {
                if (!viewScene) return Promise.reject('viewScene is null')
                const layer = viewScene.map?.findLayerById(element.id)
                if (layer) {
                    allLayers?.push(layer)
                }
            })
            if (!allLayers.length) return Promise.reject('allLayers is null')
            return Promise.resolve(allLayers)

        } catch (error) {
            throw new Error(error as string)
        }
    }


    /**
     * 监听地图缩放高度变化
     * @param Handler 
     * @date 2023/6/12
     */
    const mapCameraHeightChange = (Handler: Handler<any>) => {
        try {
            mapEmitter.value.on(CAMREAHEIGHT, (value: any) => {
                Handler(value)
            })
        } catch (error) {
            throw Error(error as string)
        }
    }

    /**
     * @description 清除所有mitt监听
     * @date 2023/6/7
     */
    const clearEvent = () => {
        try {
            mapEmitter.value.all.clear()
        } catch (error) {
            throw Error(error as string)
        }
    }
    /**
     * @description 清除单个mitt监听
     * @date 2023/6/7
     */
    const clearSingeEvent = (eventType: ClearList, name: string) => {
        mapEmitter.value.off(`${eventType}${name}`)
    }

    return {
        initMap,
        flyTo,
        mapLoaded,
        flyToHome,
        clearEvent,
        clearSingeEvent,
        closeHighLight,
        drawLine,
        drawSinglePoint,
        mapLabelClick,
        mapLeftClick,
        mapPopup,
        mapCustomPopup,
        mapCameraHeightChange,
        mapLabelCluster,
        mapLabelVisible,
        mapClickHighlight,
        getAllCustomLayer,
        removeLineAndArea,
        removePoint,
        iconMove,
        moveIconConfirm,
        mouseOnMove,
        mouseOnMovePoint
    }
}
