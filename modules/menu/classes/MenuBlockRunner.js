import {variables} from "./decorators";

/**
 * @category menu
 *
 * @property {DefaultMenuContext} context
 * @property {MenuEvent} menuEvent Событие меню
 * */
class MenuBlockRunner{
    /**
     * @param {MenuEvent} menuEvent
     * */
    constructor (menuEvent) {
        this.menuEvent = menuEvent;
        this.menuItem = menuEvent.to;
        this.context = menuEvent.context;
    }

    /**@return {boolean} Восстановлен из сессии*/
    get restored(){
        return this.menuEvent.restored;
    }

    get initial(){
        return this.menuEvent.initial;
    }

    /**@param {VariableOptions[]} varsData Данные переменных контекста, объект*/
    addVariables(varsData){
        let decorator = variables(varsData);
        decorator(this.context.constructor);
    }

    async init(){

    }

    async run(){

    }

    /**
     * Метод отладки меню
     * @param {string} message Сообщение отладки
     * */
    async debug(message){
        await this.context.debug(message,this.menuItem);
    }

}

export default MenuBlockRunner;