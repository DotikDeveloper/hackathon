import {EventEmitter} from 'events';
import _ from 'underscore';

export default class AclDispatcher extends EventEmitter{
    constructor () {
        super();
        this.setMaxListeners(0);
        const check = ()=>{
            return new Promise((resolve)=>{
                let Users = require('/modules/account/Users').default;
                if(Users){
                    this.Users = Users;
                    resolve();
                }else{
                    let interval = setInterval(()=>{
                        let Users = require('/modules/account/Users').default;
                        if(Users){
                            this.Users = Users;
                            clearInterval(interval);
                            resolve();
                        }
                    },1);
                }
            });
        };
        this.isReady = false;
        this.once('ready',()=>{
            this.isReady = true;
        });
        (async ()=>{
            await check();
            this.observer = this.Users.find({}).populate('role').observeDeepChanges({
                // eslint-disable-next-line no-unused-vars
                added(id,model){

                },
                // eslint-disable-next-line no-unused-vars
                changed(id,fields,model){
                    console.log('aclDispatcher:',`user ${id} changed`);
                },
                // eslint-disable-next-line no-unused-vars
                removed(id,doc){
                },
            });
            await this.observer.models();
            this.emit('ready');
        })();
    }

    ready(){
        if(this.isReady)
            return Promise.resolve();
        return new Promise((resolve)=>{
            this.once('ready',()=>{
                resolve();
            });
        });
    }

    get modelsMap(){
        return this.observer?.rootObserver?.modelsMap||{};
    }

    /**@returns {AclDispatcher}*/
    static getInstance(){
        if(!AclDispatcher.instance){
            AclDispatcher.instance = new AclDispatcher();
        }
        return AclDispatcher.instance;
    }

    /**@returns {string[]}*/
    resourceValues(modelName,user,property){
        const user_id = String(user.id||user._id);
        let populatedUser = this.modelsMap[user_id];
        if(!populatedUser)
            throw new Error(`User witn _id ${user_id} not found`);
        /**@type {AclRoles}*/
        let role = populatedUser.role;
        if(!role)
            return [];
        if(modelName){
            let resource = role.resources[modelName];
            if(!resource)
                return [];
            return _.clone( resource[property]||[] );
        }
        return [];
    }

    /**
     * @public
     * @returns {string[]}
     * */
    docPrivateFieldsSync(doc,user){
        if(!doc||!user)
            return [];
        if(doc.constructor.modelName){
            return this.resourceValues(doc.constructor.modelName,user,'privateFields')
        }
        return [];
    }

    /**
     * @public
     * @returns {string[]}
     * */
    modelPrivateFieldsSync(model,user){
        if(!model||!user)
            return [];
        if(model.modelName){
            return this.resourceValues(model.modelName,user,'privateFields')
        }
        return [];
    }

    /**
     * @public
     * @returns {string[]}
     * */
    docProtectedFieldsSync(doc,user){
        if(!doc||!user)
            return [];
        if(doc.constructor.modelName){
            return this.resourceValues(doc.constructor.modelName,user,'protectedFields')
        }
        return [];
    }

    /**
     * @public
     * @returns {string[]}
     * */
    modelProtectedFieldsSync(model,user){
        if(!model||!user)
            return [];
        if(model.modelName){
            return this.resourceValues(model.modelName,user,'protectedFields')
        }
        return [];
    }

}