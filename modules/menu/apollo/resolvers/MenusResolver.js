import {ability3 as ability, editResponseConvert, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import Menus from "../../models/Menus";
import _ from 'underscore';
import MenuBlocks from "../../models/MenuBlocks";
import MenuItems from "../../models/MenuItems";
import VMRunnerUserContext from "../../../vmrunner/classes/VMRunnerUserContext";
import {VMRunner,VMRunnerContext} from 'vmrunner';
import {VAR_TYPES} from "../../enums";
import operatorsForType from "../../../../client/vue-form-generator/querybuilder/operatorsForType";
import DefaultMenuContext from "../../classes/DefaultMenuContext";

export default @methods (['list', 'view', 'validate', 'editorValidate','variables'])
@mutations (['create', 'edit', 'remove','editorEdit'])
class MenusResolver extends CrudResolver2 {
    constructor () {
        super (Menus)
    }

    populate (query) {
        return query.populate ('user').populate ({
            path: 'menuType',
            populate: [{
                path: 'menuBlocks',
                populate: [{path: 'imageFile'}]
            }]
        }).populate ({
            path: 'menuItems',
            populate:[{
                path:'menuBlock',
                populate: [{path: 'imageFile'}]
            }]
        });
    }

    // eslint-disable-next-line no-unused-vars
    async editorValidate (obj, args, ctx, info) {
        let newModel = new this.model (args.model);
        let oldModel = null;
        if (newModel._id) {
            oldModel = await this.model.findOne ({_id: newModel._id});
            if (oldModel) {
                _.each (args.model, (val, key) => {
                    oldModel[key] = val;
                });
            }
        }
        let errors = [];
        /**@type {Menus}*/
        let model = oldModel || newModel;

        let block_ids = _.pluck (args.model.menuItems, 'block_id');
        let blocks = await MenuBlocks.find ({_id: {$in: block_ids}});
        let rootBlocks = _.filter (blocks, /**@param {MenuBlocks} block*/ (block) => {
            return block.isRoot;
        });
        let rootBlockIds = _.pluck (rootBlocks, 'id');

        if (_.isEmpty (rootBlocks)) {
            errors.push ({
                message: `Меню должно иметь хотя бы 1 родительский блок`,
                path: 'menuItems',
                field: 'menuItems'
            });
        } else {
            let rootBlocksSize = _.chain (block_ids)
            .filter ((block_id) => {
                return rootBlockIds.indexOf (block_id) > -1;
            })
            .size ()
            .value ();
            if (rootBlocksSize > 1) {
                errors.push ({
                    message: `Меню должно иметь не более одного родительского блока`,
                    path: 'menuItems',
                    field: 'menuItems'
                });
            }
        }

        let rawMenuItems = args.model.menuItems;
        _.mapAsync (rawMenuItems, async (rawMenuItem, menuItemIndex) => {
            let menuItem = await MenuItems.findOne ({_id: rawMenuItem, menu_id: args._id});
            if (!menuItem) {
                menuItem = new MenuItems ({})
            }
            _.each (rawMenuItem, (val, prop) => {
                menuItem[prop] = val;
            });
            try {
                await menuItem.validate ();
            } catch (validationError) {
                _.each (validationError.errors, (err, fieldName) => {
                    let realPath = err.properties?.path ? [`menuItems.${menuItemIndex}`, err.properties.path].join ('.') : `menuItems.${menuItemIndex}`;
                    errors.push ({
                        message: err.message,
                        type: err?.properties?.type,
                        path: realPath,
                        value: err?.properties?.value,
                        field: fieldName
                    });
                });
            }
        });

        try {
            await model.validate ();
        } catch (validationError) {
            _.each (validationError.errors, (err, fieldName) => {
                errors.push ({
                    message: err.message,
                    type: err?.properties?.type || 'Unknown',
                    path: err?.properties?.path || 'Unknown',
                    value: err?.properties?.value || undefined,
                    field: fieldName
                });
            });
        }
        return {errors};
    }

    @editResponseConvert
    @ability ('menuEditor', 'edit')
    // eslint-disable-next-line no-unused-vars
    async editorEdit (parent, args, ctx, info) {
        let condition = {_id: args._id};
        /**@type {Menus}*/
        let model = await this.model.findOne (condition);
        if (!model)
            return null;
        model.protectedInput(args.model,ctx.user);

        let rawMenuItems = args.model.menuItems;
        let oldMenuItems = await MenuItems.find ({menu_id: args._id});

        _.each(rawMenuItems,(rawMenuItem)=>{
            if(!_.isEmpty(rawMenuItem.connections)){
                rawMenuItem.connections = _.filter(rawMenuItem.connections,(connection)=>{
                    let to = connection.to;
                    let toRawMenuItem = _.find(rawMenuItems,(_rawMenuItem)=>{
                        return _rawMenuItem._id === to;
                    });
                    return !!toRawMenuItem;
                })
            }
        });

        let newMenuItems = await _.mapAsync (rawMenuItems, async (rawMenuItem) => {
            let menuItem = await MenuItems.findOne ({_id: rawMenuItem._id, menu_id: args._id});
            if (!menuItem) {
                menuItem = new MenuItems ({})
            }
            menuItem.protectedInput(rawMenuItem,ctx.user);
            await menuItem.save();
            return menuItem;
        });



        _.each(oldMenuItems,(menuItem)=>{
            if(!_.find(newMenuItems,(menuItem2)=>{
                return menuItem.id === menuItem2.id;
            })){
                MenuItems.deleteOne({_id:menuItem._id}).exec();
            }
        });

        let response = await model.save();
        ctx.result = response;
        return response;
    }

    @ability ('menuEditor', 'edit')
    async variables(parent, args, ctx, info){
        /**@type {Menus}*/
        let menu = new this.model(args.model);
        try {

            let BaseMenuContext = null;
            if(menu.menuType.ctxClassExpr){
                BaseMenuContext = await menu.runExpression(menu.menuType.ctxClassExpr,{useCache:true});
            }

            let ExtMenuContext = null;
            if(menu.ctxClassExpr){
                ExtMenuContext = await menu.runExpression(menu.ctxClassExpr,{BaseMenuContext},{useCache:true});
            }

            let MenuCtxClass = ExtMenuContext || BaseMenuContext || DefaultMenuContext;

            /**@type {DefaultMenuContext}*/
            let menuContext = new MenuCtxClass ();

            try {
                await _.mapAsync (menu.menuItems, async (rawMenuItem) => {
                    let menuItem = new MenuItems(rawMenuItem);
                    await menuItem.populate('menuBlock').execPopulate();
                    if(menuItem.menuBlock) {
                        let menuBlockRunnerClass = await menu.runExpression (menuItem.menuBlock.serverClass, menuContext,{useCache:true});
                        /**@type {MenuBlockRunner}*/
                        let menuBlockRunnerInstance = new menuBlockRunnerClass ({to:menuItem, context:menuContext});
                        await menuBlockRunnerInstance.init ();
                    }
                });
            }catch (e) {
                console.error(e);
            }


            /**@type {VariableDeclaration[]}*/
            let $variables = menuContext.$variables ();

            let filters = [];

            let variables = _.map($variables,$variable=>{
                if($variable.filterType) {
                    let filter = {
                        id: $variable.name,
                        field: $variable.name,
                        label: $variable.name,
                        type: $variable.type,
                        operators: $variable.operators,
                        variables:_.chain($variables)
                        .filter($tmpVariable=>{
                            return $variable.name!==$tmpVariable.name
                                && $variable.filterType === $tmpVariable.filterType;
                        })
                        .pluck('name')
                        .value()
                    };
                    filters.push(filter);
                }
                return  $variable.toJSONValue();
            });
            return {variables,filters};
        }catch (e) {
            console.error(e);
        }

    }
}