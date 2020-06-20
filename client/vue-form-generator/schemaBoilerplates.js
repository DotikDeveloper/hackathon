import moment from 'moment';
import {DATE_FORMAT,DATETIME_FORMAT} from "../../lib/constants";
import ImageFilesPreview from "../../modules/files/client/components/ImageFilesPreview";
import gql from "graphql-tag";

function time () {
    return {
        type: 'dateTimePicker',
        inputType: 'text',
        default () {
            return moment (new Date ()).format ('HH:mm')
        },
        placeholder: '',
        formatValueToField (value) {
            return this.toUserTz (value, 'HH:mm');
        },
        formatValueToModel (value) {
            return this.toServerTz (value, 'HH:mm');
        },
        dateTimePickerOptions: {
            format: "LT"
        }
    }
}
function timeValidator (value) {
    if (!value)
        return ['Значение обязательно'];
    if (!/\d+:\d+/.test (value))
        return ['Формат времени должен быть HH:mm'];
    return [];
}

function dateString () {
    return {
        type: 'dateTimePicker',
        inputType: 'text',
        placeholder: "",
        format:DATE_FORMAT,
        dateTimePickerOptions: {
            format: DATE_FORMAT,
            minDate: moment ("2000-01-01").toDate (),
            maxDate: moment ("2030-01-01").toDate (),
        },
        default () {
            return moment(new Date()).format(DATE_FORMAT);
        },
    }
}

function dateTimeString () {
    return {
        type: 'dateTimePicker',
        inputType: 'text',
        placeholder: "",
        format: DATETIME_FORMAT,
        dateTimePickerOptions: {
            format: DATETIME_FORMAT,
            minDate: moment ("2000-01-01").toDate (),
            maxDate: moment ("2030-01-01").toDate (),
        },
        formatValueToField (value) {
            return this.toUserTz (value, DATETIME_FORMAT);
        },
        formatValueToModel (value) {
            return this.toServerTz (value, DATETIME_FORMAT);
        },
        default () {
            return moment (new Date ()).format (DATETIME_FORMAT);
        },
    }
}

// eslint-disable-next-line no-unused-vars
function dateStringValidator(value,field,model){
    if(!value&&field&&field.required){
        return ['Поле обязательно']
    }
    if(value&&!moment(value,DATE_FORMAT).isValid()){
        return ['Неверный формат даты'];
    }
    return []
}

function codemirror () {
    return {
        type: 'codemirror',
        // eslint-disable-next-line no-unused-vars
        validator: function (value, field, model) {
            if (field && field.required && (value === '' || value === null || value === undefined) ) {
                return ['Поле обязательно'];
            }
            return [];
        },
        codeMirrorOptions: {
            lineNumbers: true,
            mode: 'javascript',
            gutters: ["CodeMirror-lint-markers","CodeMirror-foldgutter"],
            foldGutter: true,
            lint: {//JSHINT options
                esversion: 6,
                quotmark: false
            },
            resize: {
                minWidth: 200,               //Minimum size of the CodeMirror editor.
                minHeight: 100,
                resizableWidth: true,        //Which direction the editor can be resized (default: both width and height).
                resizableHeight: true,
                cssClass: 'cm-resize-handle', //CSS class to use on the *default* resize handle.
            }
        }
    }
}

function aclVisible(model,field){
    let fieldName = field.model;
    if(!fieldName||!model||!model.acl||(!model.acl.protectedFields&&!model.acl.privateFields))
        return true;
    let isVisible = true;
    if(model.acl.protectedFields&&model.acl.protectedFields.indexOf(fieldName)>-1){
        isVisible = false;
    }
    if(model.acl.privateFields&&model.acl.privateFields.indexOf(fieldName)>-1){
        isVisible = false;
    }
    return isVisible;
}

function userId(){
    return {
        model: 'user_id',
        type: 'input', inputType: 'text',
        label: 'Пользователь',
        visible:aclVisible,
        default(){
            return this.$userId;
        }
    }
}

function currentUserId(){
    return {
        ...userId(),
        default(){
            return this.$currentUserId;
        }
    }
}

function imageFile(){
    return {
        type:'uploadFile',
        itemComponent:ImageFilesPreview,
        multiple:false,
        apollo:{
            query:{
                query:gql`
                    query ImageFilesView($_id:String!){
                        imageFiles{
                            view(_id:$_id){
                                _id
                                user_id
                                expires
                                versions{
                                    original{
                                        name
                                    }
                                }
                                url
                                urls
                                fileName
                            }
                        }
                    }
                `,
                variables(id){
                    if (!_.isEmpty(id)) {
                        return {
                            _id:id
                        }
                    }
                },
                update(data){
                    if(data&&data.imageFiles&&data.imageFiles.view){
                        return this.items = [data.imageFiles.view];
                    }else
                        this.items = [];
                }
            },
            mutation:{
                mutation:gql`
                    mutation CreateImageFile($model:JSONObject,$file:Upload){
                        imageFiles{
                            create(model:$model,file:$file){
                                _id success message errors model
                            }
                        }
                    }
                `,
                variables(file){
                    return {
                        file:file,
                        model:{}
                    }
                },
                update(data){
                    return data.data.imageFiles.create._id;
                }
            }
        }
    }
}

export {
    time, timeValidator, dateString, dateTimeString, dateStringValidator,
    codemirror,
    aclVisible,userId,currentUserId,
    imageFile
}