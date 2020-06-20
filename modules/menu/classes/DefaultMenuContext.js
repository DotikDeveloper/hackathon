import {defaultLogger,LogLevels,Tags} from "../../logger";
import {variables} from "./decorators";
import _ from 'underscore';
import EjsonAble from "../../../server/lib/EjsonAble";
import {EventEmitter} from 'events';
/**
 * Базовый класс контекста меню
 * @category menu
 *
 * @property {MenuDispatcher} menuDispatcher
 * @property {MenuSessions} session
 */
@variables([])
class DefaultMenuContext extends EventEmitter{
    constructor (menuDispatcher,session) {
        super();
        this.setMaxListeners(0);
        this.menuDispatcher = menuDispatcher;
        this.destroyed=false;
        this.session = session;
        this.ejson = new EjsonAble();
    }

    get id(){
        return this.session?.id;
    }

    /**
     * Вызывается при инициализации экземпляра контекста меню. Не забывайте вызывать
     * <code>
     * await super.init();
     * </code>
     * при переопределении этого метода
     * После завершения этого метода все переменные будут инициализированы из БД при наличии записи
     * */
    async init(){
        if(this.session?.serialized){
            try {
                let data = this.ejson.parse( this.session.serialized );
                _.each(data,(value,key)=>{
                    this[key] = value;
                });
            }catch (err) {
                this.onError(err);
                throw err;
            }
        }
    }

    /**
     * Добавление пользовательского типа данных для корректного сохранения состояния контекста меню в БД. Как EJSON, только для экземпляра класса
     * @see {@link https://docs.meteor.com/api/ejson.html#EJSON-addType|EJSON-addType} for further information.
     * @param {string} name A tag for your custom type; must be unique among custom data types defined in your project, and must match the result of your type's typeName method.
     * @param {Function} factory  A function that deserializes a JSON-compatible value into an instance of your type. This should match the serialization performed by your type's toJSONValue method.
     * @returns {this}
     * */
    addType(name,factory){
        this.ejson.addType(name,factory);
        return this;
    }

    /**
     * Вызывается при возникновении ошибки в меню. Не забывайте вызывать
     * <code>return super.addError(err)</code>
     * при переопределении этого метода
     * @param {Error} err
     * @returns {this}
     * */
    onError(err){
        defaultLogger
        .builder()
        .withLevel(LogLevels.error.key)
        .withError(err)
        .withData({
            menu_id:this.menuDispatcher.menu.id,
            user_id:this.menuDispatcher.menu.user_id
        })
        .withTag(Tags.menu.key)
        .log();
        return this;
    }

    /**
     * Объект переменных в формате [имя переменной]:[значение]
     * Используется для сериализации в БД
     * */
    $raw(){
        let $variables = this.$variables();
        let result = {};
        _.each($variables,/**@param {VariableDeclaration} $var*/($var)=>{
            let val = this[$var.name];
            if(val!==undefined){
                result[$var.name] = val;
            }
        });
        return result;
    }

    /**@param {MenuEvent} event*/
    async onBeforeTransition(event){
        if(this.destroyed)
            return;
        let $variables = this.$variables();
        let data = {};
        _.each($variables,/**@param {VariableDeclaration} $var*/($var)=>{
            if($var.persist) {
                let val = this[$var.name];
                if (val !== undefined) {
                    data[$var.name] = val;
                }
            }
        });
        this.session.serialized = this.ejson.stringify(data);
        this.session.menu_item_id = event.to?.id||null;
        if(this.session.save)
            await this.session.save();
    }

    /**
     * @param {string} message Сообщение отладки
     * @param {object} caller Инициатор
     * */
    debug(message,caller){

    }

    destroy(){
        this.destroyed=true;
        this.emit('destroy');
    }
}

export default DefaultMenuContext;