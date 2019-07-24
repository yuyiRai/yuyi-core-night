import AMapJS from 'amap-js';
import { Utils } from '../utils'
import { autobind } from 'core-decorators';
// import { Debounce } from 'lodash-decorators';

export type IAMapKey = 'Map' | ''
export class AMapService {
  public static amap: any;
  public static key: string;
  public static setKey(key: string) {
    this.key = key
  }
  public static async AMap(key: string = 'Map') {
    if (!AMapService.amap) {
      const aMapJSAPILoader = new AMapJS.AMapJSAPILoader({ key: AMapService.key });
      AMapService.amap = await aMapJSAPILoader.load()
    }
    if (!AMapService.amap[key]) {
      AMapService.amap.plugin(`AMap.${key}`)
    }
    return AMapService.amap[key]
  }

  mapLoading = false

  constructor() {
    // this.key = new Date().getTime()
    // if (!(window.mapEmitter instanceof EventEmitter)) {
    //     window.mapEmitter = new EventEmitter()
    // }
  }
  /**
   * @returns 插件名字集合
   */
  pluginNames(): Array<string> {
    return Object.keys(this.plugin)
  }
  /**
   * 插件集合
   */
  plugin = {
    'ToolBar': (map: any) => {
      AMapService.AMap('ToolBar').then(ToolBar => {
        console.log(ToolBar)
        const toolbar = new ToolBar();
        map.addControl(toolbar);
      })
    },
    /**
     * 自动搜索补全地名
     * @returns 返回一个promise
     */
    'Autocomplete': (map: any, city: string = '全国', search: string): Promise<any[]> => {
      return this.getAutoComplete({ map, city, search })
    },
    'Geolocation': (map: any) => {

    }
  }

  @autobind private async autocomplete({ map, city, search }: {
    map?: any;
    city?: string;
    search: string;
  }): Promise<any[]> {
    const autoOptions = {
      //city 限定城市，默认全国
      city
      // input: 'searchMapContainer'
    }
    try {
      if (search == undefined) {
        return Promise.reject('搜索地点关键字为空')
      }
      console.info('搜索关键字', search)
      return new Promise<any[]>(async (resolve, reject) => {
        this.mapLoading = true
        const autoComplete = new (await AMapService.AMap('Autocomplete'))(autoOptions);
        autoComplete.search(search, (status: any, result: any) => {
          // 搜索成功时，result即是对应的匹配数据
          const { tips } = result || [];
          console.log('search result', status, result)
          if (status == 'no_data' || !(tips instanceof Array) || tips.length == 0) {
            reject(`找不到关键字地点: ${search}`)
          } else {
            console.info('搜索到关键字', search, tips)
            resolve(tips);
          }
        })
      })
    } catch (e) {
      return []
    } finally {
      this.mapLoading = false
    }
  }

  public getAutoComplete = Utils.createSimpleTimeBufferInput((res) => {
    console.log(res, this)
    return this.autocomplete(res[res.length - 1])
  }, this, 200, true)

  /**
   * 
   * @param { number } zoom 地图缩放率
   */
  async onMapLoad(zoom: number) {
    return new (await AMapService.AMap())('map-container', {
      resizeEnable: true, viewMode: '3D',
      zoom
    });
  }
  getMap() {
    return AMapService.AMap();
  }
  dispose() {
  }
}

(window as any).AMapService = AMapService