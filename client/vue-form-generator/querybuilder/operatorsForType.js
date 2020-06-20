const NUMBER_OPERATORS = ['equal','not_equal','in','not_in','less','less_or_equal','greater','greater_or_equal','between','not_between','is_null','is_not_null'];
const DATE_OPERATORS = ['equal','not_equal','less','less_or_equal','greater','greater_or_equal','between','not_between','is_null','is_not_null'];
const data = {
    string: ['equal', 'not_equal','in','not_in', 'begins_with', 'not_begins_with', 'contains', 'not_contains', 'ends_with', 'not_ends_with', 'is_empty', 'is_not_empty', 'is_null', 'is_not_null'],
    date: DATE_OPERATORS,
    datetime: DATE_OPERATORS,
    number: NUMBER_OPERATORS,
    integer:NUMBER_OPERATORS,
    double:NUMBER_OPERATORS,
    boolean: ['equal', 'not_equal'],
};
export default function forType(type){
    type = type.toLowerCase();
    return data[type];
}