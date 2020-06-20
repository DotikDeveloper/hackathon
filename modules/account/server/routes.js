import {transpile} from "../../../server/lib/chunkify";
import {errorString} from "../../../server/lib/utils";
import express from "express";
import Settings from "../../settings/models/Settings";

const router  = express.Router();

router.get ('/usersDataSchemas.js', async function (req, res) {
    try {
        res.set ('Content-Type', 'application/javascript;charset=UTF-8');
        res.set ('Accept-Ranges', 'bytes');

        /**@type Settings[]*/
        let setting = await Settings.findOne ({system_name:'vfg'});
        let $code = [];
        $code.push (`var vfg = {};`);
        if(setting?.data?.usersVfgSchema){
            $code.push (`vfg = ${setting.data.usersVfgSchema};`);
        }
        $code = transpile ($code.join ('\n')) + '\n'+'export default vfg;';
        res.send ($code);
    } catch (err) {
        res.status (500).send (errorString (err));
    }
});

export default router;