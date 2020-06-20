import Enum from '/lib/Enum';

/**
 * @description Состояния инстансов
 * @category cluster
 * @subcategory Enums
 * @instance
 * @extends Enum
 * @property {EnumItem} UNKNOWN Неизвестно
 * @property {EnumItem} RUNNING Запущен
 * @property {EnumItem} STOPPED Остановлен
 **/
const NodeInstanceStates = new Enum({
    UNKNOWN:'Неизвестно',
    RUNNING:'Запущен',
    STOPPED:'Остановлен'
});

export {
    NodeInstanceStates
}