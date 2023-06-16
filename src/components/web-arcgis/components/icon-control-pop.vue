<script lang="ts" setup>
import _ from 'lodash'
import { checkBrowserUA } from '@/utils/checkBrowser'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { IconDragArrow, IconDelete, IconClose } from '@arco-design/web-vue/es/icon'
import { useArcGis } from '@/hooks/useArcGis'
import { useArcGisStore } from "@/store"
import SceneView from '@arcgis/core/views/SceneView' // 引入ArcGis地图视图
import { Message } from '@arco-design/web-vue'

interface ControlPopProps {
    attr: SinglePointItem | undefined
    width: number
    height: number
    left: number
    top: number
    title?: string
}

const { iconMove, removePoint } = useArcGis()
const arcgisStore = useArcGisStore()
const emits = defineEmits<{
    (event: 'closePop'): void
}>()
const ua = ref(checkBrowserUA())
const props = withDefaults(defineProps<ControlPopProps>(), {
    title: '标题',
    width: 125,
    height: 150,
    left: 0,
    top: 0
})

const top = computed(() => {
    if (ua.value === 'mobile') {
        return `${(props.top - (props.height - 15))}px`
    }
    return `${props.top - (props.height - 155)}px`
})

const left = computed(() => {
    if (ua.value === 'mobile') {
        return `${(props.left - (props.width / 2) / 2) + 110}px`
    }
    return `${props.left - props.width / 2 + 230}px`
})

const width = computed(() => {
    if (ua.value === 'mobile') {
        return `${(props.width / 2) + 10}px`
    }
    return `${props.width}px`
})

const height = computed(() => {
    if (ua.value === 'mobile') {
        return `auto`
    }
    return `${props.height}px`
})

const size = computed(() => {
    if (ua.value === 'mobile') {
        return 'mini'
    }
    return 'medium'
})

const closePop = () => {
    arcgisStore.setIsMove(false)
    emits('closePop')
}

const moveBtn = () => {
    props.attr && iconMove(arcgisStore.ArcGisView as SceneView, props.attr.id, props.attr)
}

const removeBtn = () => {
    props.attr && removePoint(null, props.attr.id)
    Message.success('删除成功')
    emits('closePop')
}


onMounted(() => {
    // 监听浏览器宽度变化
    window.addEventListener('resize', () => {
        _.throttle(() => {
            ua.value = checkBrowserUA()
        }, 300)
    })
})
onBeforeUnmount(() => {
    window.removeEventListener('resize', () => {
        _.throttle(() => {
            ua.value = checkBrowserUA()
        }, 300)
    })
})


</script>

<template>
    <div class="control_pop_vue" :class="{ mobile: ua === 'mobile' ? true : false }">
        <!-- content插槽 -->
        <div class="pop_content">
            <a-space direction="vertical" :class="{ mobile_space: ua === 'mobile' ? true : false }"
                :size="ua === 'mobile' ? 5 : 10">
                <a-button :size='size' type="primary" @click="moveBtn">
                    <template #icon>
                        <icon-drag-arrow />
                    </template>
                    移动
                </a-button>
                <a-button :size='size' type="primary" @click="removeBtn">
                    <template #icon>
                        <icon-delete />
                    </template>
                    删除
                </a-button>
                <a-button :size='size' type="primary" @click="closePop">
                    <template #icon>
                        <icon-close />
                    </template>
                    取消
                </a-button>
            </a-space>

            <slot name="content"></slot>
        </div>
        <!-- footer插槽 -->
        <div class="pop_footer">
            <slot name="footer"></slot>
        </div>
    </div>
</template>

<style lang="less" scoped>
.control_pop_vue {
    position: absolute;
    top: v-bind(top);
    left: v-bind(left);
    width: v-bind(width);
    height: v-bind(height);
    box-sizing: border-box;
    padding: 15px 20px;
    color: black;
    font-size: 18px;
    border-radius: 15px;
    box-shadow: 5px 3px 10px 1px rgba(128, 128, 128, 0.566);
    background-color: rgba(255, 255, 255, 0.661);
    backdrop-filter: blur(10px);
    // 移动端模糊
    -webkit-backdrop-filter: blur(10px);

    .pop_footer {
        margin-top: 10px;
    }
}

.mobile {
    padding: 0 4px;
    border-radius: 5px;
}

.mobile_space {
    margin-top: 10px;
}

.fade-in-bottom {
    -webkit-animation: fade-in-bottom 0.6s cubic-bezier(0.39, 0.575, 0.565, 1) both;
    animation: fade-in-bottom 0.6s cubic-bezier(0.39, 0.575, 0.565, 1) both;
}

/**
 * ----------------------------------------
 * animation fade-in-bottom
 * ----------------------------------------
 */
@-webkit-keyframes fade-in-bottom {
    0% {
        -webkit-transform: translateY(50px);
        transform: translateY(50px);
        opacity: 0;
    }

    100% {
        -webkit-transform: translateY(0);
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes fade-in-bottom {
    0% {
        -webkit-transform: translateY(50px);
        transform: translateY(50px);
        opacity: 0;
    }

    100% {
        -webkit-transform: translateY(0);
        transform: translateY(0);
        opacity: 1;
    }
}
</style>
