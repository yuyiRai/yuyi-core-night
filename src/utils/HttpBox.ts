/* eslint-disable */
import Utils from '.'
import { autobind } from 'core-decorators';
import { IKeyValueMap } from 'mobx';
export type Service = (...params: any[]) => Promise<any>
export class HttpBox {
  _map = {}
  whiteList: string[] = ['support/findListByCodeType', 'branch/listSubBranches', 'branch/listTopBranches', 'support/findImageTypeList', 'support/findHospitalListByName']
  useKey: IKeyValueMap<string> = {
    'branch/listSubBranches': 'selectTree',
    'branch/listTopBranches': 'selectTree'
  }
  service: Service
  constructor(service: Service, cacheWhiteList: string[], cacheKeyMap: IKeyValueMap<string>) {
    this.service = service
    this.whiteList = cacheWhiteList
    this.useKey = cacheKeyMap
  }
  @autobind getRes(param: any) {
    const { isObjectFilter, createObjectKey } = Utils
    // console.time(param.url)
    param.__res_key = [param.url, createObjectKey({...isObjectFilter(param.params, param.data)})].join('')
    // console.timeEnd(param.url)
    // if('params' in param)
    //   param.params = Utils.zipEmptyData(param.params)
    // if('data' in param)
    //   param.data = Utils.zipEmptyData(param.data)
    return new Promise((resolve, reject) => {
      if(this.getCahce(param.__res_key)){
        return resolve(this.getCahce(param.__res_key)) 
      }
      this.getReq(param, resolve, reject)
    })
  }
  @autobind getReq(param: any, resolve: any, reject: any) {
    Utils.simpleTimeBufferInput(param.__res_key, {param, resolve, reject}, this.todo, 20)
  }
  @autobind setCahce(__res_key: string, value: any) {
    this._map[__res_key] = value;
  }
  @autobind getCahce(__res_key: string) {
    return this._map[__res_key];
  }
  @autobind todo(list: any[]) {
    const { param: req } = Utils.last(list)
    this.service(req).then((res) => {
      if(this.whiteList.includes(req.url) && this.useKey[req.url]==req.useKey){
        this.setCahce(req.__res_key, res)
        setTimeout(this.setCahce, 30*60*1000, req.__res_key, undefined);
      }
      for(const i of list){
        i.resolve(res)
      }
    }).catch(function(e){
      console.log(e, e.message, Utils.isNotEmptyValueFilter(e.message, e))
      for(const i of list){
        i.reject(new Error(Utils.isNotEmptyValueFilter(e.message, e)))
      }
    })
  }
}