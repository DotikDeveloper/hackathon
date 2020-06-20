/**
 * @name VmPluginOptions
 * @property {number} cacheTtl Время жизни кеша, сек
 * @property {string} userField имя поля пользователя
 * @property
 * */

/**
 * @name RunExpressionOptions
 * @property {boolean} useCache
 * */
import _ from 'underscore';
import forUser from "../../modules/vmrunner/forUser";
import NodeCache from 'node-cache';
import md5 from 'md5';

/**@param {VmPluginOptions} options*/
export default function vmPlugin(schema,options={}){
    let cacheTtl = _.isNumber( options.cacheTtl ) ? options.cacheTtl : 5*60;
    let userField = options.userField || 'user';
    let cache = null;

    /**@param {RunExpressionOptions} options*/
    schema.methods.runExpression = async function(expression,ctx={},options={useCache:false}){
        if(options.useCache&&cache===null){
            cache = new NodeCache({
                stdTTL:cacheTtl,
                checkperiod:Math.ceil(cacheTtl/10),
                useClones:false,
                deleteOnExpire:true
            });
        }
        if(!this.populated(userField)){
            await this.populate(userField).execPopulate();
        }
        let user = this[userField];
        let key = `${user.id}:${md5(expression)}`;
        let result = undefined;
        if(cache) {
            result = cache.get (key);
            if (result !== undefined) {
                return result;
            }
        }
        let runner = await this.vmRunner();
        try {
            return await runner.run (expression, ctx);
        }catch (e) {
            console.error(e);
            throw e;
        }
    }

    schema.methods.vmRunner = async function vmRunner(){
        if(!this.populated(userField)){
            await this.populate(userField).execPopulate();
        }
        let user = this[userField];
        return forUser(user);
    }
}