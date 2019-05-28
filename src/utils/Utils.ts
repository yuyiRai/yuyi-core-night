/* eslint-disable */
import commonUtils from './commonUtils';
import * as OptionsUtils from './OptionsUtils';
import CustomUtils from './CustomUtils';
import TimeBufferUtils from './TimeBuffer';
import { typeFilterUtils, typeUtils } from "./TypeLib";
import * as ParseUtils from "./ParseUtils";
import * as MessageUtils from './MessageUtils'
import * as MobxUtils from './MobxUtils'
import * as SlotUtils from './SlotUtils'

export type IUtils = typeof CustomUtils 
& typeof OptionsUtils 
& typeof typeUtils 
& typeof commonUtils 
& typeof TimeBufferUtils 
& typeof typeFilterUtils
& typeof MessageUtils
& typeof ParseUtils
& typeof MobxUtils
& typeof SlotUtils

export const Utils: IUtils = {
  ...commonUtils,
  ...OptionsUtils,
  ...TimeBufferUtils,
  ...typeUtils,
  ...typeFilterUtils,
  ...CustomUtils,
  ...ParseUtils,
  ...MessageUtils,
  ...MobxUtils,
  ...SlotUtils
};

