import Enum from '/lib/Enum';

/**
 * @description Состояния сервисов
 * @category services
 * @subcategory Enums
 *
 * @instance
 * @extends Enum
 * @property {EnumItem} UNKNOWN Неизвестно
 * @property {EnumItem} RUNNING Запущен
 * @property {EnumItem} STOPPED Остановлен
 * @property {EnumItem} ERROR Ошибка
 **/
const CustomServiceStates = new Enum({
    UNKNOWN:'Неизвестно',
    RUNNING:'Запущен',
    STOPPED:'Остановлен',
    ERROR:'Ошибка'
});

export {CustomServiceStates}