import styled from 'styled-components';
import { IFormProps } from './Form';
import { Utils } from '@/utils';
export const FormContainer = styled.form`
  border-color: #f522d2;
  .has-error .el-input__inner, .has-error .el-input__inner:hover {
    border-color: #f5222d !important;
  }
  .el-input__inner:not(.is-disabled) {
    &.is-active, &.is-hover, &:hover, &:focus {
      border-color: #40a9ff;
      transition: all 0.3s;
    }
    &.is-active, &:focus {
      border-right-width: 1px !important;
      outline: 0;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);    
    }
  }
  .has-error .el-input__inner:focus:not(.is-disabled) {
    border-color: #ff4d4f;
    box-shadow: 0 0 0 2px rgba(245, 34, 45, 0.2);
  }
  .use-item-col {
    margin-bottom: 20px;
  }

  .ant-form-item {
    margin-bottom: 0 !important;
    & > .ant-col.ant-col-1.ant-form-item-label {
      width: ${(props: IFormProps) => Utils.isNumberFilter(props.labelWidth, 150)}px;
      float: left;
    }
    & > .ant-col.ant-col-1.ant-form-item-control-wrapper {
      width: ${(props: IFormProps) => `calc(100% - ${Utils.isNumberFilter(props.labelWidth, 150)}px);`};
    }
    &.unuse-label {
      & > .ant-col.ant-col-1.ant-form-item-label {
        display: none;
      }
      & > .ant-col.ant-col-1.ant-form-item-control-wrapper {
        width: 100%;
      }
    }
  }
`;