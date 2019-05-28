import { IUtils, Utils as GlobalUtils } from '../utils/Utils'
import { keys as Keys } from 'ts-transformer-keys';
import { oc as Oc } from 'ts-optchain';
window.oc = Oc
window.Utils = GlobalUtils
window.keys = Keys
declare global {
  var Utils: IUtils;
  var keys: typeof Keys;
  var oc: typeof Oc;
  export interface Window {
    Utils: IUtils;
    keys: typeof Keys;
    oc: typeof Oc;
  }
}