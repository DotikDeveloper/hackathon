import VariableDeclaration from "./VariableDeclaration";
import {VAR_TYPES} from "../enums";
import _ from 'underscore';
/**
 * Интерфейс опций декларации переменной контекста
 * @category menu
 *
 * @name VariableOptions
 * @interface
 * @property {string} name Имя переменной в контексте меню
 * @property {string} type Тип переменной в контексте меню из перечисления VAR_TYPES
 * @property {string[]} operators Разрешенные операторы в фильтрах меню
 * @property {boolean} persist Сохранять ли переменную в БД
 * @property {boolean} visible Видимость в конструкторе меню
 * */

function getClassData(clazz,prop,defaultVal){
    const $classData = clazz[clazz.name] = clazz[clazz.name] || {};
    const $__privateData = $classData.$__privateData = $classData.$__privateData || {};
    const $vals = $__privateData[prop] = $__privateData[prop] || defaultVal;
    return $vals;
}
/**
 * Декоратор класса контекста меню. Декларирует переменные контекта
 * @category menu
 * @name variables
 * @function
 * @param {VariableOptions[]} varsData Данные переменных контекста, объект
 * */
function variables(varsData) {
    const variables = _.map(varsData,(variableOptions)=>{
        return new VariableDeclaration(variableOptions.name)
        .withType(variableOptions.type||VAR_TYPES.Object.key)
        .withPersist(variableOptions.persist)
        .withOperators(variableOptions.operators)
        .withVisible(variableOptions.visible);
    });

    return function (clazz) {
        if(!clazz.prototype.hasOwnProperty('variables')){
            clazz.prototype.$variables = function(){
                let $parent = Object.getPrototypeOf(clazz);
                let result  = [];
                if($parent.prototype&&$parent.prototype.$variables){
                    result = _.clone( $parent.prototype.$variables.apply(this) );
                }
                Array.prototype.push.apply(result,getClassData(clazz,'variables',[]));
                return _.uniq(result,false,(varDeclaration)=>{
                    return varDeclaration.name;
                })
            };
            clazz.prototype.$variables.forClass = clazz.name;
        }
        Array.prototype.push.apply(getClassData(clazz,'variables',[]), variables);
    }
}

export {
    variables
}