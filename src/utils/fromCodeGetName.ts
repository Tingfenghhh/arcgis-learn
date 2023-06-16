import { codes } from "./code.js"


/**
 * @description 查询树形结构路径（递归）
 * @date 16/06/2022
 * @export
 * @param {any[]} tree
 * @param {(data: any) => boolean} func
 * @param {any[]} [path=[]]
 * @return {*}  {any[]}
 */
export function treeFindPath(tree: any[], func: (data: any) => boolean, path: any[] = []): any[] {
    if (!tree) return []
    // eslint-disable-next-line no-restricted-syntax
    for (const data of tree) {
        path.push(data.label)
        if (func(data)) return path
        if (data.children) {
            const findChildren = treeFindPath(data.children, func, path)
            if (findChildren.length) return findChildren
        }
        path.pop()
    }
    return []
}



/**
 * 查询树形结构路径（循环）
 * @param val 
 * @returns 
 */
export function transString(val: number) {
    // 将数字两位为一组，转换为字符串
    const str = String(val)
    const arr: any[] = []
    for (let i = 0; i < str.length; i += 2) {
        arr.push(str.slice(i, i + 2))
    }
    // 将codes转换成数组
    const codesArr = JSON.parse(JSON.stringify(codes))
    const string: string[] = []
    // arr循环查找codesArr
    arr.forEach((item, index) => {
        codesArr.forEach((item2: any) => {
            if (item == item2.value && index == 0) {
                string.push(item2.label)
                if (item2.children && arr.length >= 2) {
                    item2.children.forEach((item3: any) => {
                        if (item3.value == `${arr[0]}${arr[1]}`) {
                            string.push(item3.label)
                            if (item3.children && arr.length >= 3) {
                                item3.children.forEach((item4: any) => {
                                    if (item4.value == `${arr[0]}${arr[1]}${arr[2]}`) {
                                        string.push(item4.label)
                                    }
                                })
                            }
                        }
                    })
                }
            }
        })
    })
    return string
}