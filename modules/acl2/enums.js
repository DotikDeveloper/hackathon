import Enum from '/lib/Enum';
/**
 * @name RULE_MODE
 * @extends Enum
 * @property {EnumItem} allow_all
 * @property {EnumItem} disallow_all
 * @property {EnumItem} allow_rules
 * @property {EnumItem} condition_expression
 * */

/**@type RULE_MODE*/
const RULE_MODE = new Enum({
    'allow_all':'Разрешить все',
    'disallow_all':'Запретить все',
    'allow_rules':'Критерии',
    'condition_expression':'Код'
});

export {
    RULE_MODE
}