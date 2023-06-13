<script lang='ts' setup>
import { computed, ref } from 'vue';
import { IconCloseCircleFill } from '@arco-design/web-vue/es/icon';

interface PopProps {
    title: string,
    attr: SingPointItem | undefined,
    width: number
    height: number
    left: number
    top: number
}

const emits = defineEmits<{
    (event: 'closePop'): void
}>()
const props = withDefaults(defineProps<PopProps>(), {
    title: '标题',
    width: 150,
    height: 150,
    left: 0,
    top: 0,
})

const top = computed(() => {
    return `${props.top - (props.height + 25)}px`
})

const left = computed(() => {
    return `${props.left - (props.width / 2)}px`
})

const width = computed(() => {
    return `${props.width}px`
})

const height = computed(() => {
    return `${props.height}px`
})

const title = computed(() => {
    return props.title
})

const closePop = () => {
    emits('closePop')
}


</script>

<template>
    <div class='pop_vue'>
        <!-- header -->
        <div class='pop_header'>
            <span>{{ title }}</span>
            <a-button type="text" shape="circle" @click="closePop">
                <template #icon>
                    <icon-close-circle-fill :size="30" />
                </template>
            </a-button>
        </div>
        <!-- content插槽 -->
        <div class="pop_content">
            <a-space direction="vertical">
                <span>名称：{{ props.attr?.name }}</span>
                <span>id号：{{ props.attr?.id }}</span>
                <span>经度：{{ props.attr?.center[0] }}</span>
                <span>纬度：{{ props.attr?.center[1] }}</span>
                <span>当前屏幕与盒子距离：{{ top }} --- {{ left }}</span>
            </a-space>

            <slot name="content"></slot>
        </div>
        <!-- footer插槽 -->
        <div class="pop_footer">
            <slot name="footer"></slot>
        </div>
    </div>
</template>


<style lang='less' scoped>
.pop_vue {
    position: absolute;
    top: v-bind(top);
    left: v-bind(left);
    width: v-bind(width);
    height: v-bind(height);
    box-sizing: border-box;
    padding: 5px 15px;
    color: black;
    font-size: 18px;
    border-radius: 15px;
    box-shadow: 5px 3px 10px 1px rgba(128, 128, 128, 0.566);
    background-color: white;

    .pop_header {
        height: 30px;
        border-bottom: 1px solid #ccc;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .pop_content {
        margin-top: 10px;


    }

    .pop_footer {

        margin-top: 10px;
    }
}

.fade-in-bottom {
    -webkit-animation: fade-in-bottom 0.6s cubic-bezier(0.390, 0.575, 0.565, 1.000) both;
    animation: fade-in-bottom 0.6s cubic-bezier(0.390, 0.575, 0.565, 1.000) both;
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