import {transpile} from "../../../server/lib/chunkify";
import {errorString} from "../../../server/lib/utils";
import express from "express";
import _ from 'underscore';
import Settings from "../models/Settings";

const router  = express.Router();

router.get ('/settingsDataSchemas.js', async function (req, res) {
    try {
        res.set ('Content-Type', 'application/javascript;charset=UTF-8');
        res.set ('Accept-Ranges', 'bytes');

        /**@type Settings[]*/
        let settings = await Settings.find ({});
        let $code = [];
        $code.push (`var vfg = {};`);
        _.each (settings, /**@param {Settings} setting*/ (setting) => {
            if (setting.vfgSchema)
                $code.push (`vfg['${setting.id}'] = ${setting.vfgSchema};`);
        });
        $code = transpile ($code.join ('\n')) + '\n'+'export default vfg;';
        res.send ($code);
    } catch (err) {
        res.status (500).send (errorString (err));
    }
});

export default router;