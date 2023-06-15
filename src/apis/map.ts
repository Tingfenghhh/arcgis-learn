import axios from 'axios'



export interface MapData {
  center: string
  mapListInfo: MapListInfo
  zoomBounds: number[]
  mapRasterData: MapRasterData
}

export interface MapRasterData {
  dataId: number
  mapId: number
}

export interface MapListInfo {
  defualtLevel: number
  maxLevel: number
  minLevel: number
  mapId: number
  originX: number
  originY: number
}

export const getMap = (mapId: number) => axios.get<HttpResponse<MapData>>(`/goodmap/get?mapId=${mapId}`)

//获取全国json
export const getChinaJson = (name: string) => axios.get<{ type: string; features: any }>(`https://testdonexproduct-shanghai.oss-cn-shanghai.aliyuncs.com/china/${name}_full.json`)

/**
 * @description 从本地获取省份边界数据
 * @date 18/08/2022
 */
export const getBoundarySource = (adcode: number | string) =>
  axios.get<{ type: string; features: any }>(`https://testdonexproduct-shanghai.oss-cn-shanghai.aliyuncs.com/china/${adcode}_full.json`)