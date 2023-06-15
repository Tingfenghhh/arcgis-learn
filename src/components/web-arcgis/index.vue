<script lang="ts" setup>
import { checkBrowserWebGL2, checkBrowserUAPromise } from '@/utils/checkBrowser'
import _ from 'lodash'
import { useRequest } from 'vue-request'
import { useArcGisStore } from '@/store'
import { useArcGis } from '@/hooks/useArcGis'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useFps } from '@vueuse/core'
import { Message } from '@arco-design/web-vue'
import { getChinaJson, getBoundarySource } from '@/apis/map'
import { MapEnum } from '@/enums/MapEnum'
import PopVue from "./components/pop.vue"
import ControlPopVue from "./components/icon-control-pop.vue"

const chinaSources = ref()
const arcGisStore = useArcGisStore()
const {
    initMap,
    mapLoaded,
    flyToHome,
    flyTo,
    clearEvent,
    closeHighLight,
    drawLine,
    drawSinglePoint,
    mapLeftClick,
    mapCustomPopup,
    mapCameraHeightChange,
    mapLabelClick,
    mapLabelVisible,
    mapClickHighlight,
    getAllCustomLayer,
    removeLineAndArea,
    removePoint,
    mouseOnMove
} = useArcGis()
const fps = ref(useFps())
const { CITY_HEIGHT, CHINA_HEIGHT, PROVINCE_HEIGHT } = MapEnum

const getChinaJsonFun = async (name: string) => {
    const data = await getChinaJson(name)
    return data.data
}
getChinaJsonFun('100000').then((res) => {
    chinaSources.value = res
})

const { data: province, run: initProvince } = useRequest(getBoundarySource, {
    manual: true
})
const { data: city, run: initCity } = useRequest(getBoundarySource, {
    manual: true,
    onError: () => {
        Message.error('获取城市边界失败')
        // 清空city
        city.value = null as any
    }
})

// 存储自定义点位
const customPointArr = ref<SinglePointItem[]>([])

// 视角还原
const flyToHomeBtn = _.throttle(() => {
    if (!arcGisStore.ArcGisView) {
        Message.error('地图未加载完成')
        return
    }
    arcGisStore.ArcGisView &&
        flyToHome()
            .then(() => {
                Message.success('视角还原成功')
            })
            .catch((error) => {
                Message.info({
                    id: 'error',
                    content: '还原失败'
                })
                throw new Error(error)
            })
}, 500)

// 删除边界
const removeArea = _.throttle(() => {
    removeLineAndArea()
        .then(() => {
            Message.success('删除边界成功')
        })
        .catch(() => {
            Message.error('删除边界失败')
        })
}, 500)

// 绘制边界
const renderArea = _.throttle(() => {
    drawLine(chinaSources.value)
        .then(() => {
            Message.success('绘制边界成功')
        })
        .catch((error) => {
            console.log(error)
        })
}, 500)

// 控件方向
const direction = ref<'horizontal' | 'vertical' | undefined>('horizontal')

// 地图加载完毕触发
mapLoaded(() => {
    Message.success('你已完成地图加载和飞行')
    // 绘制边界
    drawLine(chinaSources.value)
})

// 监听地图点击的标签事件触发
mapLabelClick((e) => {
    if (!e.results.length) return
    const results = e.results[0]
    if (results.type === 'graphic' && results.graphic.attributes !== null && results.graphic.attributes.adcode) {
        closeHighLight(true)
        const adcode = results.graphic.attributes.adcode
        Message.info({
            id: 'info',
            content: '当前点击的是：' + results.graphic.attributes.name
        })
        // 根据adcode获取省份边界
        const codeAffter = String(adcode).slice(2, 6)
        if (codeAffter === '0000') {
            // 点击的是省份
            initProvince(adcode)
            flyTo(
                {
                    center: [results.graphic.attributes.longitude, results.graphic.attributes.latitude],
                    zoom: 7
                },
                {
                    duration: 1500
                }
            ).then(() => {
                if (province.value) {
                    drawLine(province.value.data)
                }
            })
            return
        }
        // 点击的是城市
        initCity(adcode)
        flyTo(
            {
                center: [results.graphic.attributes.longitude, results.graphic.attributes.latitude],
                zoom: 10
            },
            {
                duration: 1500
            }
        ).then(() => {
            if (city.value && province.value) {
                drawLine(city.value.data)
            }
        })
    } else if (results.type === 'graphic' && results.graphic.attributes !== null && results.graphic.attributes.id) {
        closeHighLight(true)
        Message.info({
            id: 'info',
            content: '当前点击的是：' + results.graphic.attributes.name
        })
        flyTo(
            {
                center: [results.graphic.attributes.center[0], results.graphic.attributes.center[1]],
                zoom: 16
            },
            {
                duration: 1500
            }
        ).then(() => {
            mapClickHighlight(results)
            mapCustomPopup(results)
        })
    }
})


//   监听地图普通点击事件
mapLeftClick((e) => {
    if (e) {
        const { longitude, latitude } = e.mapPoint
        console.log(longitude, latitude, '普通点击事件,并在地图上打点')
        flyTo(
            {
                center: [longitude, latitude],
                zoom: 16
            },
            {
                duration: 1500
            }
        ).then(() => {
            // 时间戳(毫秒)
            const customPoint: SinglePointItem = {
                center: [longitude, latitude],
                // 时间戳(毫秒)
                id: `${new Date().getTime()}-singlePoint`,
                name: '新加点位ID' + `${new Date().getTime()}-singlePoint`,
            }
            drawSinglePoint(customPoint)
            customPointArr.value.push(customPoint)
            arcGisStore.setPopupVisible(false)
            getAllCustomLayer([...customPointArr.value]).then((res: __esri.Layer[]) => {
                arcGisStore.setCustomPointArr(res)
                // mapLabelCluster() 暂时无效
            }).catch((error) => {
                console.log(error)
                throw new Error(error)
            })
        })
    }
})

// 关闭自定义弹窗
const closePop = () => {
    arcGisStore.setPopupVisible(false)
}

// 删除自定义点位
const deleteCustomArr = () => {
    if (customPointArr.value.length) {
        customPointArr.value.forEach((item: SinglePointItem) => {
            removePoint(null, item.id)
        })
        customPointArr.value = []
        arcGisStore.setCustomPointArr([])
        arcGisStore.setPopupVisible(false)
        Message.success('删除自定义点位成功')
        return
    }
    Message.info('暂无自定义点位')
}



// 监听地图缩放
mapCameraHeightChange((event) => {
    const z = event.position.z

    if (z > CITY_HEIGHT) {
        arcGisStore.setPopupVisible(false)
        customPointArr.value && mapLabelVisible(customPointArr.value, false)
    }

    if (z >= CHINA_HEIGHT) {
        closeHighLight(true)
        drawLine(chinaSources.value)
        customPointArr.value && mapLabelVisible(customPointArr.value, false)
        return
    }
    if (CITY_HEIGHT < z && z < PROVINCE_HEIGHT) {
        closeHighLight(true)
        province.value && drawLine(province.value.data)
        customPointArr.value && mapLabelVisible(customPointArr.value, false)
        return
    }
    if (CITY_HEIGHT >= z) {
        city.value && drawLine(city.value.data)
        customPointArr.value && mapLabelVisible(customPointArr.value, true)
        return
    }
})

onMounted(() => {
    checkBrowserWebGL2().then(() => {
        // 初始化地图
        initMap('viewDiv')
            .then(() => {
                Message.success('地图加载完成')
            })
            .catch((error) => {
                Message.error('地图加载失败')
                throw new Error(error)
            })

        checkBrowserUAPromise().then((res: string) => {
            // 根据屏幕宽度先设置ios端的地图方向
            if (res === "mobile") {
                direction.value = 'vertical'
            } else {
                direction.value = 'horizontal'
            }
            // 监听浏览器宽度变化
            window.addEventListener('resize', () => {
                if (document.documentElement.clientWidth < 768) {
                    direction.value = 'vertical'
                } else {
                    direction.value = 'horizontal'
                }
            })
        })

    }).catch((error) => {
        Message.error('当前浏览器不支持WebGL2')
        throw new Error(error)
    })


})

// 销毁地图
onBeforeUnmount(() => {
    if (arcGisStore.ArcGisView && arcGisStore.mapEmitter) {
        console.log('销毁地图，清除事件')
        arcGisStore.ArcGisView.destroy()
        clearEvent()
    }
    // 销毁图层的鼠标移动事件监听
    if (mouseOnMove) {
        const mouseDelete: IHandle = mouseOnMove as IHandle
        mouseDelete.remove()
    }
    // 移除浏览器宽度变化监听
    window.removeEventListener('resize', () => {
        console.log('')
    })
})
</script>

<template>
    <div class="mapView">
        <div id="viewDiv"></div>
        <span class="map-fps">FPS: {{ fps }}</span>

        <div class="contorl-box">
            <a-space :direction="direction">
                <a-button type="primary" @click="flyToHomeBtn">视角还原</a-button>
                <a-button type="primary" @click="removeArea">删除边界</a-button>
                <a-button type="primary" @click="renderArea">绘制边界</a-button>
                <a-button type="primary" @click="deleteCustomArr">删除自定义点位</a-button>
            </a-space>
        </div>

        <!-- 自定义弹窗 -->
        <PopVue v-if="arcGisStore.popupVisible" :title="'测试弹窗'" :width="450" :height="250" :top="arcGisStore.popupData?.top"
            :left="arcGisStore.popupData?.left" :attr="arcGisStore.popupData?.attributes" @closePop="closePop">
        </PopVue>
        <!-- 自定义操作弹窗 -->
        <ControlPopVue v-if="arcGisStore.popupVisible" :width="125" :height="150" :top="arcGisStore.popupData?.top"
            :left="arcGisStore.popupData?.left" :attr="arcGisStore.popupData?.attributes" @closePop="closePop">
        </ControlPopVue>


    </div>
</template>

<style lang="less" scoped>
.mapView {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    background: radial-gradient(#12bff2, #045c8a) !important; // 作用于地图背景 充当星空色
}

#viewDiv {
    width: 100%;
    height: 100vh;

    &>canvas {
        filter: saturate(1.2) drop-shadow(0 0 20px white);
    }
}

.map-fps {
    position: absolute;
    width: 100px;
    top: 10px;
    right: 10px;
    font-size: 24px;
    background-color: rgba(255, 255, 255, 0.662);
    backdrop-filter: blur(10px);
    text-align: center;
    border-radius: 5px;
    // color: rgb(254, 219, 15);
}

.contorl-box {
    position: absolute;
    top: 20px;
    left: 20px;
}
</style>

<style lang="less">
.esri-attribution__sources,
.esri-attribution__powered-by {
    display: none !important;
}

.esri-view-surface {
    &::after {
        content: none !important;
    }
}

.esri-navigation-toggle {
    display: none !important;
}

.esri-ui-top-left {
    top: 85%;
    left: 95%;
}


// 设置自带pop弹窗样式
.esri-popup {

    border-radius: 10px;
}

.esri-popup__main-container {
    border-radius: 10px;


    // header
    .esri-popup__header {
        .esri-popup__header-container--button {
            border-radius: 10px 0 0 10px;
        }

        // 隐藏停靠
        .esri-popup__header-buttons .esri-popup__button--dock {
            display: none !important;
        }

    }

    // footer
    .esri-popup__footer {
        display: none !important;
    }
}
</style>
