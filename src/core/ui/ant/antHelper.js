/**
 * Created by trump on 2017/7/21.
 */
"use strict";
import React from "react";
import {Button, Col, Modal, Pagination, Popover, Row} from "antd";
import _ from "lodash";
import {urlQuery} from "../../utils/requestHelper";
import mobx from "mobx";
import {ActionBar} from "./ActionBar";
import warning from "warning";

export const formItemLayout = {
    labelCol: {
        xs: {span: 24},
        sm: {span: 6},
    },
    wrapperCol: {
        xs: {span: 24},
        sm: {span: 14},
    },
};

const formItemLayoutWithOutLabel = {
    wrapperCol: {
        xs: {span: 24, offset: 0},
        sm: {span: 20, offset: 4},
    },
};


export function mapPropsToFields(props) {
    
    let values = props.values;
    if (mobx.isObservableObject(values)) {
        values = mobx.toJS(values);
    }
    
    
    let valueMap = {};
    
    
    let getKey = (parentPath, key, isArray) => {
        if (!parentPath) return isArray ? `[${key}]` : key;
        
        return isArray ? `${parentPath}[${key}]` : `${parentPath}.${key}`;
    };
    
    let mapValues = (obj, parentPath = '', isArray = false, isVirtual = true) => _.mapValues(obj, (value, key) => {
        let keyPath = getKey(parentPath, key, isArray);
        valueMap[keyPath] = {value, name: keyPath, virtual: isVirtual};
        
        if (_.isObject(value)) {
            mapValues(value, keyPath, _.isArray(value), true);
        }
    });
    
    mapValues(values, null, _.isArray(values), false);
    
    return valueMap;
    
}

export function mapRowKeys(list, keyField = '_id') {
    return _.map(list, item => {
        if (!item.key) {
            item.key = item[keyField];
        }
        
        return item;
    })
}

export function createPager(pager, router) {
    let location = router.getCurrentLocation();
    return pager.total > 0 ? <Pagination className="pull-right"
                                         current={pager.start + 1}
                                         defaultCurrent={1}
                                         total={pager.total}
                                         defaultPageSize={pager.pageSize}
                                         pageSize={pager.pageSize}
                                         onChange={page => router.push(
                                             urlQuery(location.pathname)
                                                 .param(location.query)
                                                 .param({start: page - 1}).getUrl()
                                         )}
                                         showSizeChanger
                                         showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
    /> : null;
}

export function createRowPager(pager, router) {
    return <Row style={{marginTop: 12}}>
        {createPager(pager, router)}
    </Row>
}

export const contentStyles = () => {
    return {
        background: '#fff', padding: 24, margin: 0, minHeight: 280
    }
};

/**
 * @param {{
 *  title
 * }} options
 * */
export function createModal(options) {
    return ModalBody => {
        if (!ModalBody.prototype.onSave) {
            console.warn(`Failed to found onSave() method on Component: `, ModalBody, ` \nTry to put @createModal() as fisrt decorator.`);
        }
        
        return class ModalWrapper extends React.Component {
            
            static displayName = 'ModalWrapper';
            
            static propTypes = {
                onSave: React.PropTypes.func,
                onCancel: React.PropTypes.func,
                onError: React.PropTypes.func,
                modalBodyOnly: React.PropTypes.bool,
                modalOptions: React.PropTypes.object,
            };
            
            static defaultProps = {
                modalBodyOnly: false,
                modalOptions: {},
                onSave: e => e,
                onCancel: e => e,
                onError: e => e,
            };
            
            getModalOptions() {
                let modalOptions = {
                    ...options,
                    ...this.props.modalOptions,
                };
                
                ['title'].forEach(key => {
                    let option = modalOptions[key];
                    if (_.isFunction(option)) {
                        modalOptions[key] = option(this.props);
                    }
                });
                
                return modalOptions;
            }
            
            componentWillReceiveProps(props) {
                if (props.modalOptions.visible !== this.props.modalOptions.visible) {
                    this.setState({visible: props.modalOptions.visible});
                }
            }
            
            render() {
                
                let modalOptions = this.getModalOptions();
                
                let omittedOptions = _.omit(modalOptions, _.keys(ModalWrapper.propTypes));
                
                let modalBody = <ModalBody ref="modalBody" {...this.props}/>;
                
                if (this.props.modalBodyOnly) {
                    return modalBody;
                }
                
                return <Modal onCancel={this.onCancel} onOk={this.onOk} {...omittedOptions}>{modalBody}</Modal>
            }
            
            onError = (error) => {
                Modal.error({
                    content: <div>
                        保存失败!
                        <br/>
                        {error.message}
                    </div>
                });
                
                let {onSave} = this.getModalBody();
                
                console.error(error, onSave);
            };
            
            onOk = () => {
                let {onSave} = this.getModalBody();
                
                if (_.isFunction(onSave)) {
                    let $res = onSave();
                    if ($res instanceof Promise) {
                        $res.then(this.props.onSave).catch(this.onError);
                    } else {
                        this.props.onSave();
                    }
                } else {
                    this.props.onSave();
                }
            };
            
            onCancel = () => {
                let {onCancel} = this.getModalBody();
                
                if (_.isFunction(onCancel)) {
                    let $res = onCancel();
                    if ($res instanceof Promise) {
                        $res.then(this.props.onCancel).catch(this.onError);
                    } else {
                        this.props.onCancel();
                    }
                } else {
                    this.props.onCancel();
                }
            };
            
            getModalBody() {
                return this.refs.modalBody;
            }
        };
    }
}

/**
 * @param {wrapConfirmOptionType} config
 * */
export function wrapConfirm(config) {
    
    /**
     * @class wrapConfirmOptionType
     * */
    let defaultOptions = {
        visible: false,
        title: '',
        content: '',
        onCancel() {
            options.onVisibleChange(false);
        },
        onConfirm() {
            options.onVisibleChange(false);
        },
        onVisibleChange() {
        }
    };
    
    let options = _.assign(defaultOptions, config);
    
    let content = <div>
        {options.content}
        <ActionBar>
            <Button onClick={options.onCancel}>取消</Button>
            <Button type={"danger"} onClick={options.onConfirm}>确认</Button>
        </ActionBar>
    </div>;
    
    return $button => {
        if (typeof $button === 'string') {
            $button = <Button>{$button}</Button>;
        }
        
        return <Popover
            content={content}
            title={options.title}
            trigger="click"
            visible={options.visible}
            onVisibleChange={visible => options.onVisibleChange(visible)}
        >
            {$button}
        </Popover>
    }
}

export class FormItem extends React.Component {
    static propTypes = {
        labelCol: React.PropTypes.object,
        wrapperCol: React.PropTypes.object,
        label: React.PropTypes.any,
        guid: React.PropTypes.any,
        skipCheckChildren: React.PropTypes.bool,
        labelFor: React.PropTypes.any,
        hasFeedBack: React.PropTypes.bool,
        errorMessages: React.PropTypes.array,
        validateStatus: React.PropTypes.string,
    };
    
    static defaultProps = {
        ...formItemLayout,
        guid: Math.random(),
        errorMessages: []
    };
    
    render() {
        let hasLabel = !!this.props.label;
        let {labelCol, wrapperCol, skipCheckChildren, labelFor} = this.props;
        labelFor = labelFor || this.getInputId();
        this.checkChildren();
        
        return <Row className={`ant-form-item `} data-item-guid={this.props.guid}>
            {hasLabel ? <Col {...labelCol} className={`ant-form-item-label`}>
                <label htmlFor={ labelFor }>
                    {this.props.label}
                </label>
            </Col> : null}
            
            <Col {...wrapperCol}
                 className={`ant-form-item-control-wrapper`}>
                <div className={`${this.getInputControlClass()}`}>
                    {skipCheckChildren ? this.props.children : this.wrapInputElement(this.props.children, {id: this.getInputId()})}
                    
                    {_.isEmpty(this.props.errorMessages) ? null : <div className="ant-form-explain">
                        {this.props.errorMessages.map((message, index) => <div key={index}>{message}</div>)}
                    </div>}
                </div>
            </Col>
        </Row>;
    }
    
    getInputControlClass() {
        let props = this.props;
        
        return `${props.hasFeedback ? 'has-feedback' : ''} ${props.validateStatus ? 'has-' + props.validateStatus : ''}`;
    }
    
    getChildrenProps() {
        return this.props.children.props || {};
    }
    
    getInputId() {
        let props = this.getChildrenProps();
        if (props.id) {
            return props.id;
        }
        
        return `formItem-${props.name}`;
    }
    
    wrapInputElement(children, newProps) {
        return React.cloneElement(children, {...this.getChildrenProps(), ...newProps})
    }
    
    checkChildren() {
        if (this.props.skipCheckChildren) {
            return;
        }
        
        let inputProps = this.getChildrenProps();
        warning(!!inputProps.name, `Please set name prop for input element of [data-form-guid="${this.props.guid}"]`);
    }
}