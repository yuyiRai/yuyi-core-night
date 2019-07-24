import React from 'react'
import { observable, action, computed } from 'mobx'
import { observer } from 'mobx-react'

export class UploadProgressStore {
  @observable persent: number = 0;
  @action setPersent(p: number) {
    this.persent = p;
  }
  @computed get progressText() {
    return `(${this.persent}%)`
  }
}

export const UploadMessage = observer(({store, file}: {store: UploadProgressStore, file: any}) => {
  return <p style={{textAlign: 'left'}}>{file && file.name} {store.progressText}</p>
})

export default UploadMessage;