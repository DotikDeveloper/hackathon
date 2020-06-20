import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";
import _ from 'underscore';
import forUser from "../../vmrunner/forUser";
import customQueryParse from "../../../server/lib/customQueryParse";
import sift from 'sift';

/**
 * @category custom
 * @subcategory models
 * @constructor NavItems
 * @property {string} name Имя
 * @property {string} dataExpression Код, возвращающий данные
 * @property {string} parent_item_id ID родительского элемента
 * @property {string} user_id ID владельца
 * @property {object} rules Правила
 * @property {number} index Индекс сортировки
 *
 * @property {NavItems} parentItem Родительский элемент
 * @property {Users} user Владелец
 * @property {NavItems[]} childItems Дочерние элементы
 **/
const NavItemsSchema = new Schema ({
    name: {
        type: String,
        required: [true, 'Имя обязательно'],
        unique: true,
    },
    dataExpression: {
        type: String,
        required: [true, 'Код, возвращающий данные, обязателен'],
        validate: codeValidate
    },
    parent_item_id: {
        type: String,
    },
    user_id: {
        type: String,
        required: true,
    },
    rules: {
        type: Schema.Types.Mixed,
        default () {
            return {
                "condition": "AND",
                "rules": [],
                "valid": true
            }
        }
    },
    index: {
        type: Number,
        default () {
            return 0;
        }
    }
});


NavItemsSchema.virtual ('parentItem', {
    ref: 'navItems',
    localField: 'parent_item_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

NavItemsSchema.virtual ('childItems', {
    ref: 'navItems',
    localField: '_id',
    foreignField: 'parent_item_id',
    justOne: false,
    options: {}
});

NavItemsSchema.virtual ('user', {
    ref: 'users',
    localField: 'user_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

NavItemsSchema.statics.generateTreeData = async function (user) {
    //console.log({user:JSON.stringify(user)});
    /**
     * @param {NavItems} navItem
     * */
    async function userFilter (navItem) {
        const ctx = {
            user: user,
            user_id: navItem.user_id
        };
        let vmRunner = forUser (navItem.user);
        try {
            let condition = await customQueryParse (navItem.rules, ctx, vmRunner);
            let query = sift (condition);
            let result = query (ctx);
            if (result)
                return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    let rootItems = _.filter (await NavItems.find ().populate ('user').populate ('parentItem').populate ('childItems'), /**@param {NavItems} navItem*/ (navItem) => {
        return !navItem.parentItem;
    });

    /**@param {NavItems} navItem*/
    async function generateTreeData (navItem, $parentTreeData = {}) {
        if(!navItem.populated('childItems')){
            await navItem.populate('childItems').execPopulate();
        }
        if(!navItem.populated('user')){
            await navItem.populate('user').execPopulate();
        }
        if(!navItem.populated('parentItem')){
            await navItem.populate('parentItem').execPopulate();
        }
        let userFiltered = await userFilter (navItem);
        if (!userFiltered)
            return null;

        let vmRunner = forUser (navItem.user);
        let data = await vmRunner.run (navItem.dataExpression, {user: user, $parent: $parentTreeData});

        async function generateChildren(treeData){
            treeData.children = treeData.children||[];
            if(!_.isEmpty(navItem.childItems)){
                for(let i=0;i<navItem.childItems.length;i++){
                    let childNavItem = navItem.childItems[i];
                    let childTreeData = await generateTreeData(childNavItem,treeData);
                    if(_.isArray(childTreeData)){
                        _.each(childTreeData,(childTreeDataItem)=>{
                            treeData.children.push(childTreeDataItem);
                        });
                    }else if(_.isObject(childTreeData)){
                        treeData.children.push(childTreeData);
                    }
                }
            }
            treeData.children = _.sortBy(treeData.children,(child)=>{
                return child.index||0;
            });
        }

        if (_.isArray (data)) {
            await _.mapAsync (data, async (treeItem) => {
                treeItem.index = navItem.index || 0;
                await generateChildren (treeItem);
            });
        } else if (_.isObject (data)) {
            data.index = navItem.index || 0;
            await generateChildren (data);
        }
        return data;

    }

    let treeData = [];
    await _.mapAsync (rootItems, /**@param {NavItems} navItem*/async (navItem) => {
        let itemData = await generateTreeData (navItem, {});
        if(_.isArray(itemData)){
            _.each(itemData,(itemDataElement)=>{
                treeData.push(itemDataElement)
            });
        }else if(_.isObject(itemData)) {
            treeData.push(itemData);
        }
    });
    //console.log({treeData:JSON.stringify(treeData)});
    treeData = _.sortBy(treeData,'index');
    return treeData;


};


const NavItems = new mongoose.model ('navItems', NavItemsSchema, 'navItems');
NavItems.publicFields = ['generateTreeData'];

NavItems.label = 'Элементы меню навигации';
export default NavItems;