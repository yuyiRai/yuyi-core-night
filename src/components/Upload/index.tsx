import * as React from 'react'
import UploadMessage, { UploadProgressStore } from './UploadMessage'
import Utils from '../../utils';

export function showUploadMessage(instance: any, file: any, store: UploadProgressStore) {
  return Utils.$notify({
    duration: 0,
    placement: 'bottomLeft',
    title: `上传中`,
    type: 'success',
    style: {
      'zIndex': 2048
    },
    msg: (index: number) => <UploadMessage key={index} file={file} store={store} />
  }, instance)
}

export {
  UploadMessage,
  UploadProgressStore
}