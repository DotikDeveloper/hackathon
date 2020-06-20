import express from "express";
import _ from 'underscore';
import {chunkify, transpile} from "/server/lib/chunkify";
import {errorString} from "/server/lib/utils";
import FoodSourceTypes from "../models/FoodSourceTypes";

const router = express.Router ();

router.get ('/foodSourcesSchemas.js', async function (req, res) {
    try {
        res.set ('Content-Type', 'application/javascript;charset=UTF-8');
        res.set ('Accept-Ranges', 'bytes');

        /**@type MenuTypes[]*/
        let menuTypes = await FoodSourceTypes.find ({});
        let $code = [];
        $code.push (`var vfg = {};`);

        _.each (menuTypes, /**@param {FoodSourceTypes} foodSourceType*/ (foodSourceType) => {
            if (foodSourceType.vfgSchema)
                $code.push (`vfg['${foodSourceType.id}'] = ${foodSourceType.vfgSchema};`);
        });
        $code = transpile ($code.join ('\n')) + '\nexport default vfg;';
        res.send ($code);
    } catch (err) {
        res.status (500).send (errorString (err));
    }
});

export default router;