import * as React from 'react'
import { Tag } from 'antd';
import { onChangeHandler, LabelsConfigList } from '../../../../stores';
import 'rc-tween-one/dist/rc-tween-one.js';
import { TweenOneGroup } from 'rc-tween-one';

export const TagGroup: React.FunctionComponent<ITagGroupProps> = (props: ITagGroupProps) => {
  return (
    <TweenOneGroup enter={{
      scale: 0.8, opacity: 0, type: 'from', duration: 100,
      onComplete: (e) => {
        e.target.setAttribute('style', '');
      },
    }} leave={{ opacity: 0, width: 0, scale: 0, duration: 200 }} appear={false}>{
      props.labelsConfig.map((v) =>
        <Tag key={v.label} color="blue" closable onClose={(e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          v.remove(props.onClose);
        }}>{v.label}</Tag>
      )
    }</TweenOneGroup>
  );
};
export interface ITagGroupProps {
  onClose: onChangeHandler;
  labelsConfig: LabelsConfigList;
}
