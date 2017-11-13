"use strict";

import _ from "lodash";
import validate from "validate.js";

(function (validate) {
    
    let val = function (value, config, key, attributes) {
        
        let options = config;
        
        const validateElement = function (element, index) {
            let result = validate(element, options);
            let elementKey = `${key}[${index}]`;
            
            let errors = {};
            
            _.map(result, (messages, itemKey) => {
                errors[`${elementKey}.${itemKey}`] = messages;
            });
            
            return _.isEmpty(errors) ? null : {index, elementKey, errors}
        };
        
        let validations = _.chain(value).map(validateElement).filter().value();
        
        if (_.isEmpty(validations)) return;
        
        return validations;
    };
    
    let async = function (args) {
        args = arguments;
        
        return new validate.Promise(function (resolve, reject) {
            var result = val.apply(this, args);
            resolve(result)
        })
    };
    
    validate.validators.array = val;
    validate.validators.arrayAsync = async;
    
})(validate);


export const FormMixinHelperFieldDefaultOptions = {
    validateOnChange: true,
    valueFieldName: 'value',
    getValue: e => e.target.value,
    onFieldChange: (fieldName, fieldValue) => {
    }
};

export class FormMixinHelper {
    
    /**
     * @param {{getFormValue: function(): Object, constraint: Object, setFormValue: function(formValue: Object)}} options
     * */
    constructor(options) {
        let {getFormValue, constraint, setFormValue} = options;
        
        this._formValue = {};
        
        const DefaultGetFormValue = () => this._formValue;
        const DefaultSetFormValue = (formValue) => {
            this._formValue = formValue;
        };
        
        /** @type {function} */
        this.getFormValue = getFormValue || DefaultGetFormValue;
        this.constraint = constraint || {};
        this.setFormValue = formValue => {
            setFormValue = setFormValue || DefaultSetFormValue;
            setFormValue(formValue);
            this._formValue = formValue;
        };
        
        this.editedFields = {};
    }
    
    getFieldProps(fieldName, options) {
        let config = {
            ...FormMixinHelperFieldDefaultOptions,
            ...options
        };
        
        let defaultOnFieldChange = e => {
            let fieldValue = config.getValue(e);
            this.updateField(fieldName, fieldValue);
            config.onFieldChange(fieldName, fieldValue);
        };
        
        return {
            name: fieldName,
            [config.valueFieldName]: _.get(this.getFormValue(), fieldName),
            onChange: _.get(options, 'onChange', defaultOnFieldChange)
        };
    }
    
    getFieldValue(field, defaultValue) {
        return _.get(this.getFormValue(), field, defaultValue)
    }
    
    updateField(fieldName, value) {
        this.editedFields[fieldName] = true;
        let formValue = this.getFormValue();
        _.set(formValue, fieldName, value);
        this.setFormValue(formValue);
    }
    
    getArrayField(field) {
        return this.getFieldValue(field, []);
    }
    
    pushToArrayField(field, value) {
        let items = this.getArrayField(field);
        items.push(value);
        this.updateField(field, items);
    }
    
    removeFromArrayField(fieldName, filterFn) {
        let items = this.getArrayField(field);
        let newItems = items.filter(filterFn);
        this.updateField(fieldName, newItems);
    }
    
    getValidateErrors() {
        return validate.validate(this.getFormValue(), this.constraint) || {};
    }
    
    getEditedFields() {
        return _.keys(this.editedFields);
    }
    
    getAntFormItemProps(fieldName, errors, checkedFields = this.getEditedFields()) {
        let error = errors[fieldName];
        
        if (error === undefined && checkedFields.indexOf(fieldName) < 0) {
            return {};
        }
        
        return {
            errorMessages: error,
            validateStatus: error ? 'error' : 'success'
        }
    }
    
    getAntArrayItemErrors(fieldName, arrayErrors, checkAll) {
        
        if (_.isEmpty(arrayErrors)) {
            return {}
        }
        
        console.log(arrayErrors);
        
        let errorElement = arrayErrors.filter(o => o.errors[fieldName])[0];
        
        if (!errorElement) {
            return {};
        }
        
        if (!checkAll) {
            let checkedFields = this.getEditedFields();
            if (checkedFields.indexOf(fieldName) < 0) {
                return {};
            }
        }
        
        let errors = errorElement.errors;
        
        let error = errors[fieldName];
        
        return {
            errorMessages: error,
            validateStatus: error ? 'error' : 'success'
        }
    }
    
    getAllFields() {
        return _.keys(this.constraint);
    }
    
    getCheckFields(checkAll) {
        return checkAll ? this.getAllFields() : this.getEditedFields();
    }
    
    getChangedFieldErrors() {
        let formErrors = this.getValidateErrors();
        let editedFields = this.getEditedFields();
        let result = {};
        
        _.map(editedFields, (key) => {
            result[key] = formErrors[key];
        });
        
        return result;
    }
    
}