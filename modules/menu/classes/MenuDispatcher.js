import _ from 'underscore';
import {get as safeGet} from 'lodash';
import customQueryParse from "../../../server/lib/customQueryParse";
import sift from 'sift';
import MenuSessions from "../models/MenuSessions";
import {EventEmitter} from 'events';
import DefaultMenuContext from "./DefaultMenuContext";
import async from 'async';
import {defaultLogger, LogLevels, Tags} from "../../logger";

/**
 * @name MenuEvent
 * @property {MenuItems|null} from
 * @property {MenuItems|null} to
 * @property {boolean} initial Первый блок диалога
 * @property {boolean} restored Восстановлен из сессии
 * @property {DefaultMenuContext} context
 * */

/**
 * @category menu
 *
 * @property {Menus} menu
 * */
export default class MenuDispatcher extends EventEmitter{
    constructor (menu) {
        super();
        this.setMaxListeners(0);
        this.menu = menu;
        this.destroyed = false;
        this.contexts = {};
        this.queue = async.queue(async function(task, done) {
            try {
                await task ();
            }catch (e) {
                defaultLogger
                .builder()
                .withLevel(LogLevels.warn.key)
                .withError(e)
                .withData(null)
                .withTag(Tags.menu.key)
                .log();
            }finally {
                done();
            }
        },1);
    }

    async init(){
        if(!this.menu.populated('menuItems')){
            await this.menu.populate({
                path:'menuItems',
                populate:[{
                    path:'menuBlock'
                }]
            }).execPopulate();
        }
        if(!this.menu.populated('menuType')){
            await this.menu.populate('menuType').execPopulate();
        }
    }

    /**
     * @param {MenuSessions} session Сессия диалога, необязательно
     * @param {object} data Любые специфичные сервису данные, будут переданы как первый аргумент в функцию createNewSession
     * */
    async createNewContext(session,data){
        let context = null;
        if(!session){
            session = await this.createNewSession(data);
        }

        let BaseMenuContext = null;
        if(this.menu.menuType.ctxClassExpr){
            BaseMenuContext = await this.menu.menuType.runExpression(this.menu.menuType.ctxClassExpr,{},{useCache:true});
        }

        let ExtMenuContext = null;
        if(this.menu.ctxClassExpr){
            ExtMenuContext = await this.menu.runExpression(this.menu.ctxClassExpr,{BaseMenuContext},{useCache:true});
        }

        let MenuCtxClass = ExtMenuContext || BaseMenuContext || DefaultMenuContext;

        context = new MenuCtxClass(this,session);
        let id = context.id;
        if(id){
            this.contexts[id] = context;
            context.once('destroy',()=>{
                if(this.contexts[id]){
                    delete this.contexts[id];
                }
            });
        }else{
            this.once('destroy',()=>{
                context.destroy();
            });
        }
        await context.init();
        return context;
    }

    /**@param {string} id*/
    getContextById(id){
        return this.contexts[id];
    }


    /**
     * @param {DefaultMenuContext} context
     * */
    async run(context){
        const self = this;
        return new Promise((resolve,reject)=>{
            /**@param {MenuEvent} event*/
            const itemCallback = async (event)=>{
                if(context.destroyed)
                    return;
                await context.onBeforeTransition(event);
                if(event.to&&!context.destroyed){
                    await this.doMenuItem(event);
                    let to = await this.nextItem(event.to,context);
                    itemCallback({
                        context,
                        from:event.to,
                        to:to,
                        initial:false,
                        restored:false
                    });
                }else
                    resolve();
            };

            let restoredMenuItem = null;
            if(context.session&&context.session.menu_item_id){
                restoredMenuItem = _.find(self.menu.menuItems,/**@param {MenuItems} menuItem*/(menuItem)=> {
                    return menuItem.id === context.session.menu_item_id;
                });
            }
            let menuItem = null;
            if(!restoredMenuItem){
                menuItem = _.find(self.menu.menuItems,/**@param {MenuItems} menuItem*/(menuItem)=> {
                    return !!menuItem?.menuBlock?.isRoot;
                });
            }

            let event = {
                context,
                from:null,
                to:restoredMenuItem||menuItem,
                initial:true,
                restored:!!restoredMenuItem
            };
            itemCallback(event);
        });


    }

    /**
     * @returns {MenuSessions}
     * */
    async createNewSession(data){
        return new MenuSessions({
            meta: data||{},
            menu_id:this.menu.id,
            user_id:this.menu.user_id,
            serialized:null,
            menu_item_id:null
        });
    }

    /**
     * @param {MenuItems} curItem
     * @param {DefaultMenuContext} menuCtx
     * @returns {MenuItems}
     * */
    async nextItem(curItem, menuCtx){
        let result = null;
        const self = this;
        let sorted = _.sortBy(curItem.connections, function(connection){
            let pr = safeGet(connection,'priority',Number.MAX_VALUE);
            if(!_.isNumber(pr)||_.isNaN(pr))
                pr = Number.MAX_VALUE;
            return pr;
        });

        await _.eachLimit( sorted,1, async (connection)=>{
            if(result)
                return;
            let to = _.find(self.menu.menuItems,function(menuItem){
                return menuItem.id===connection.to;
            });
            if(to){
                let condition = null;
                if(connection.rules) {
                    condition = await customQueryParse (connection.rules,menuCtx,await self.menu.vmRunner());
                    let query = sift(condition);
                    let siftResult = query(menuCtx);
                    if(siftResult){
                        result = to;
                    }
                    await menuCtx.debug(`check menuItem "${to.label}" ${JSON.stringify(condition)} ${siftResult?'match':'skip'}`,to);
                }else{
                    result = to;
                    await menuCtx.debug(`empty condition "${to.label}"`,to);
                }

            }
        });

        return result;
    }

    /**
     * @param {MenuEvent} menuEvent
     * @param {DefaultMenuContext} context
     * */
    async doMenuItem(menuEvent){
        const self = this;
        try {
            let menuBlockRunnerClass = await self.menu.runExpression (menuEvent.to.menuBlock.serverClass,menuEvent.context,{useCache:true});
            /**@type {MenuBlockRunner}*/
            let menuBlockRunnerInstance = new menuBlockRunnerClass (menuEvent);
            await menuBlockRunnerInstance.init ();
            if(menuEvent.restored)
                await menuBlockRunnerInstance.debug(`Восстановление диалога с элемента "${menuEvent.to.label}" ( Блок "${menuEvent.to.menuBlock.name}" )`);
            return await menuBlockRunnerInstance.run ();
        }catch (err) {
            menuEvent.context.onError(err);
            throw err;
        }
    }

    destroy(){
        this.destroyed=true;
        this.emit('destroy');
        _.chain(this.contexts)
        .keys()
        .each((id)=>{
            if(this.contexts[id]){
                this.contexts[id].destroy();
            }
        });
    }
}