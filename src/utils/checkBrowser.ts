import { Message } from "@arco-design/web-vue";

/**
 * 检查浏览器是否支持webGpu
 */
export const checkBrowserGpu = async (): Promise<void | boolean> => {
    try {
        // 利用navigator判断当前浏览器版本和名称
        const ua = navigator.userAgent.toLocaleLowerCase();
        // 如果当前浏览器不是谷歌或者Edge,提示不支持webGpu
        if (!(ua.indexOf('chrome') > -1 || ua.indexOf('edg') > -1)) {
            Message.error('不支持webGpu,尝试更新操作系统或浏览器版本');
            return Promise.reject(false);
        }
        // 是的话判断浏览器版本是否大于等于113
        const version = ua.match(/(chrome|edg)\/([\d.]+)/);
        if (version && version[2]) {
            // 截取出版本号
            const versionNum = Number(version[2].split('.')[0])
            if (versionNum >= 113) {
                return Promise.resolve(true);
            }
            Message.error('不支持webGpu,尝试更新操作系统或浏览器版本');
            return Promise.reject(false);
        }
    } catch (error) {
        Message.error('不支持webGpu,尝试更新操作系统或浏览器版本');
        throw new Error(error as string);
    }
}

/**
 * 检查浏览器是否支持webGL2
 * @returns 
 */
export const checkBrowserWebGL2 = (): Promise<void | boolean> => {
    try {
        // 创建canvas元素
        const canvas = document.createElement('canvas');
        // 获取webGL2上下文
        const gl = canvas.getContext('webgl2');
        if (!gl) {
            if (typeof WebGL2RenderingContext !== 'undefined') {
                Message.error('您的浏览器似乎支持WebGL2，但可能已被禁用。尝试更新操作系统或视频卡驱动程序');
                return Promise.reject(false);
            } else {
                Message.error('您的浏览器不支持WebGL2');
                return Promise.reject(false);
            }
        }
        return Promise.resolve(true);
    } catch (error) {
        Message.error('您的浏览器不支持WebGL2');
        throw new Error(error as string);
    }
}


// 检测浏览器是移动端还是PC端带promise
export const checkBrowserUAPromise = (): Promise<string> => {
    try {
        // 利用navigator判断当前浏览器版本和名称
        const ua = navigator.userAgent.toLocaleLowerCase();
        // 检测浏览器是移动端还是PC端
        if (ua.match(/(iphone|ipod|ipad|android|mobile)/)) {
            return Promise.resolve('mobile')
        }
        return Promise.resolve('pc')
    } catch (error) {
        throw new Error(error as string);
    }

}
// 检测浏览器是移动端还是PC端
export const checkBrowserUA = () => {
    try {
        // 利用navigator判断当前浏览器版本和名称
        const ua = navigator.userAgent.toLocaleLowerCase();
        // 检测浏览器是移动端还是PC端
        if (ua.match(/(iphone|ipod|ipad|android|mobile)/)) {
            return 'mobile'
        }
        return 'pc'
    } catch (error) {
        throw new Error(error as string);
    }

}