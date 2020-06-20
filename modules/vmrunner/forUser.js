import NodeCache from 'node-cache';
import {VMRunner,VMRunnerContext} from 'vmrunner';

const runnersCache = new NodeCache({
    stdTTL:5*60,//Секунды (!!!)
    checkperiod:60,//Секунды (!!!)
    useClones:false,
    deleteOnExpire:true
});

let VMRunnerUserContext = null;
/**@returns {VMRunner}*/
function forUser(user){
    let user_id = user?.id || 'undefined';
    if(!VMRunnerUserContext){
        VMRunnerUserContext = require('./classes/VMRunnerUserContext').default;
    }
    let scope = VMRunnerUserContext.forUser(user);
    let runner = runnersCache.get( user_id );
    if(runner)
        return runner;
    runner = new VMRunner(scope)
    .withConvertResult(false)
    .withThrow(true);
    runnersCache.set( user_id, runner );
    return runner;
}

export default forUser;