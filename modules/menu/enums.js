import Enum from '/lib/Enum';

/**
 * @description Основные типы меню
 * @category menu
 * @subcategory Enums
 * @instance
 * @extends Enum
 * @property {EnumItem} calls IVR
 * @property {EnumItem} chats Чаты и пр
 **/
const MenuSuperTypes = new Enum({
    calls:'IVR',
    chats:'Текстовые чаты'
});

/**
 * @description Перечисление возможных типов переменных контекста меню
 * @category menu
 * @subcategory Enums
 * @extends {Enum}
 * @property {EnumItem} String
 * @property {EnumItem} Number
 * @property {EnumItem} Boolean
 * @property {EnumItem} Object
 * @property {EnumItem} Date
 * */
const VAR_TYPES = new Enum({
    String: 'Строка',
    Number: 'Число',
    Boolean:'Логический',
    Object:'Объект/Тип неизвестен',
    Date:'Дата'
});

export {
    MenuSuperTypes,VAR_TYPES
}