import NpmEnum from 'enum';
import _ from 'underscore';

/**
 * @category lib
 * @class EnumItem
 * @property {string} key
 * @property {string} label
 * @property {string} value
 * */
import EnumItem from 'enum/dist/enumItem';
Object.defineProperty(EnumItem.prototype,'label',{
    get(){
        return this.value;
    }
});



/**
 * Перечисление
 * @category lib
 */
const Enum = class extends NpmEnum{
    get data(){
        return _.clone(this.enums);
    }

    get keys(){
        return _.pluck(this.enums,'key');
    }

    exclude(excludedKeys){
        if(!_.isArray(excludedKeys))
            excludedKeys = [excludedKeys];
        const data = {};
        _.each(this.enums,(enumItem)=>{
            if(excludedKeys.indexOf(enumItem.key)==-1)
                data[enumItem.key] = enumItem.value;
        });
        return new Enum(data);
    }

    /**
     * возвращает все элементы перечисления
     * @returns {string[]}
     * */
    values(){
        return _.pluck(this.enums,'key');
    }

    /**
     * возвращает все элементы перечисление в массевк объектов, содержащих [ключ]:[значение]
     * @returns {object[]}
     * */
    toSelect(){
        return _.chain(this.enums)
        .map((enumItem)=>{
            return {id:enumItem.key,name:enumItem.value};
        })
        .value();
    }
};

export default Enum;