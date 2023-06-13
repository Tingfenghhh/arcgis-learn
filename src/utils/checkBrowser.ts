import { Message } from "@arco-design/web-vue";

export const checkBrowser = async (): Promise<void | boolean> => {
    // 利用navigator判断当前浏览器版本和名称
    const ua = navigator.userAgent.toLocaleLowerCase();
    // 如果当前浏览器不是谷歌或者Edge,提示不支持webGpu
    if (!(ua.indexOf('chrome') > -1 || ua.indexOf('edg') > -1)) {
        Message.error('不支持webGpu');
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
        Message.error('不支持webGpu');
        return Promise.reject(false);
    }



}