import express from "express";
import _ from 'underscore';
import MenuTypes from "../../models/MenuTypes";
import {chunkify, transpile} from "../../../../server/lib/chunkify";
import {errorString} from "../../../../server/lib/utils";

const router = express.Router ();


router.get ('/menuTypeSchema.js',
    async function (req, res) {
        res.set ('Content-Type', 'text/javascript;charset=UTF-8');

        /**@type MenuTypes[]*/
        let menuTypes = await MenuTypes.find ({}).populate ('menuBlocks');
        const $code = [];
        $code.push (`var obj = {};`);
        _.each (menuTypes, /**@param {MenuTypes} menuType*/ (menuType) => {
            $code.push (`obj['${menuType.id}'] = obj['${menuType.id}'] || {};`);
            _.each (menuType.menuBlocks, /**@param {MenuBlocks} menuBlock*/ (menuBlock) => {
                $code.push (`obj['${menuType.id}']['${menuBlock.id}'] = {};`);
                $code.push (`obj['${menuType.id}']['${menuBlock.id}'].name = '${menuBlock.name}';`);
                $code.push (`obj['${menuType.id}']['${menuBlock.id}'].vfgSchema = ${menuBlock.vfgSchema || 'undefined'};`);
            });
        });
        $code.push ('window.menuTypeSchema = obj;');
        res.send ($code.join ('\n'));
    });

router.get ('/menuDataSchemas.js', async function (req, res) {
    try {
        res.set ('Content-Type', 'application/javascript;charset=UTF-8');
        res.set ('Accept-Ranges', 'bytes');

        /**@type MenuTypes[]*/
        let menuTypes = await MenuTypes.find ({});
        let $code = [];
        $code.push (`var vfg = {};`);

        _.each (menuTypes, /**@param {MenuTypes} menuType*/ (menuType) => {
            if (menuType.menuVfgSchema)
                $code.push (`vfg['${menuType.id}'] = ${menuType.menuVfgSchema};`);
        });
        $code = transpile ($code.join ('\n')) + '\nexport default vfg;';
        res.send ($code);
    } catch (err) {
        res.status (500).send (errorString (err));
    }
});

export {router};