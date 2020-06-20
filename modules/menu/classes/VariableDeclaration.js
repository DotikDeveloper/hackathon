import {VAR_TYPES} from "../enums";
import CustomQueryFilter from "/lib/CustomQueryFilter";
import _ from 'underscore';
import {FIELD_BUILDER_TYPE} from "../../../lib/enums";

/**
 * Внутреннее описание переменной контекста
 * @private
 * @category menu
 * @subcategory MenuContexts
 *
 * @class
 * @property {string} name Имя переменной в меню
 * @property {string} type Строка типа переменной из перечисления VAR_MODE
 * @property {string[]} operators Разрешенные операторы в фильтрах меню
 * @property {boolean} persist Сохранение переменной в БД
 * @property {boolean} visible Видимость переменной в редакторе меню
 * */
export default class VariableDeclaration {
    constructor (name) {
        this.withType(VAR_TYPES.Object.key)
        .withName(name)
        .withPersist()
        .withVisible();
    }

    /**
     * Установка типа переменной из перечисления VAR_TYPES
     * @param {string} type Тип переменной из перечисления VAR_TYPES
     * @returns {this}
     * */
    withType(type){
        if(!VAR_TYPES[type])
            throw new Error(`Тип "${type}" отсутствует в перечислении VAR_TYPES`);
        this.type = type;
        return this;
    }

    /**
     * Установка имени переменной
     * @param {string} name Имя переменной в контексте меню
     * @returns {this}
     * */
    withName(name){
        if(!_.isString(name)||name.indexOf('.')>-1||name.indexOf('$')>-1)
            throw new Error(`Недопустимое имя переменной "${name}"`);
        this.name = name;
        return this;
    }

    /**
     * Установка разрешенных операторов в фильтрах меню
     * @param {string[]} operators
     * @returns {this}
     * */
    withOperators(operators){
        this.operators = operators || CustomQueryFilter.getDefaultOperators(this.type);
        return this;
    }

    /**
     * Сохранение переменной в БД
     * @param {boolean} persist true-хранить, false - нет. true по умолчанию
     * @returns {this}
     * */
    withPersist(persist=true){
        this.persist = persist;
        return this;
    }

    /**
     * Видимость переменной в редакторе меню
     * @param {boolean} visible true-видима, false - невидима. true по умолчанию
     * @returns {this}
     * */
    withVisible(visible=true){
        this.visible = visible;
        return this;
    }

    toJSONValue() {
        return {
            name: this.name,
            type: this.type,
            operators:this.operators,
            persist:this.persist,
            visible:this.visible
        };
    }

    get filterType(){
        switch (this.type) {
            case VAR_TYPES.String.key:return FIELD_BUILDER_TYPE.string.key;
            case VAR_TYPES.Number.key:return FIELD_BUILDER_TYPE.double.key;
            case VAR_TYPES.Boolean.key:return FIELD_BUILDER_TYPE.boolean.key;
            case VAR_TYPES.Object.key:return FIELD_BUILDER_TYPE.string.key;
            case VAR_TYPES.Date.key:return FIELD_BUILDER_TYPE.datetime.key;
            default:
                return FIELD_BUILDER_TYPE.string.key;
        }
    }
}
