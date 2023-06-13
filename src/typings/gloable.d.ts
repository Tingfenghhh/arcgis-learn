interface HttpResponse<T = unknown> {
    status: number
    msg: string
    code: number
    data: T
    result: T
    statusText: string
    headers: RawAxiosResponseHeaders | AxiosResponseHeaders
    config: AxiosRequestConfig
}


// 地图下载
interface MapDownData {
    name: string
    size: SizeList
    renderLabel: boolean
}

type SizeList = '1080p' | '2k' | '4k'
type SizeSource = {
    width: number
    height: number
}