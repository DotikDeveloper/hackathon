import should from 'should';
import {describe,before,it} from 'mocha';
import '/modules/account/test';
import Users from "../../account/Users";
import AclRoles from "../../acl2/models/AclRoles";
import AclFilters from "../../acl2/models/AclFilters";
import AclRules from "../../acl2/models/AclRules";
import MongooseDocWrapper from "../classes/MongooseDocWrapper";
import MongooseModelWrapper from "../classes/MongooseModelWrapper";
import StubSandboxModels from "./StubSandboxModels";

let role,user;
describe('module vmrunner', function(){
    this.timeout(11000);
    before(async ()=>{
        role = await AclRoles.findOne({name:'vmrunner'});
        if(!role) {
            role = await new AclRoles ({
                name: 'vmrunner',
                label: 'vmrunner'
            }).save ();
        }
        user = await Users.findOne({login: role.name});
        if(!user) {
            user = await new Users ({
                login: `${role.name}`,
                type: Users.types.password.key,
                name: role.name.charAt (0).toUpperCase () + role.name.slice (1),
                password: `user`,
                email: `${role.name}@minta365.ru`,
                roleName: role.name
            }).save ();
        }
        await AclFilters.deleteMany({});
        let filter = await new AclFilters({
            modelNames:[
                Users.collection.name
            ],
            name:'_id',
            fieldType:'string',
            labelExpression:'_id;',
            mongoPathExpression:'_id',
            mongoValueExpression:'String( this._id );'
        }).save();
        await AclRules.deleteMany({});
        await new AclRules({
            "roles" : [role.name],
            "resources" : [Users.collection.name],
            "actions" : ["all","list","view","create","edit","remove"],
            "__v" : 1,
            "mode" : "allow_rules",
            "rules" : {
                "condition" : "AND",
                "rules" : [
                    {
                        "id" : filter.id,
                        "field" : "_id",
                        "type" : "string",
                        "operator" : "equal",
                        "value" : "[{\"mode\":\"variable\",\"values\":[\"user._id\"]}]"
                    }
                ],
                "valid" : true
            }
        }).save();
    });

    it('Тестим vmrunner',async ()=>{
        let userWrapped = new MongooseDocWrapper(user,user);
        await userWrapped.save ();

        let anotherUser = await Users.findOne({_id:{$ne:user._id}});
        let anotherUserWrapper = new MongooseDocWrapper(anotherUser,user);
        await anotherUserWrapper.save().should.be.rejectedWith('Not allowed');
    });
});

describe('mongoose sandbox',function(){
    this.timeout(100000);

    before(async ()=>{
        let filter = await AclFilters.findOne({name:'user_id'});
        if(!filter){
            filter = await new AclFilters({
                modelNames:[StubSandboxModels.collection.name],
                "mongoPathExpression" : "'user_id';",
                "mongoValueExpression" : "this.model.user_id;",
                "labelExpression" : "'user_id'; ",
                "name" : "user_id",
                "fieldType" : "string"
            }).save();
        }
        await new AclRules({
            "roles" : [role.name],
            "resources" : [StubSandboxModels.collection.name],
            "actions" : ["all","list","view","create","edit","remove"],
            "__v" : 1,
            "mode" : "allow_rules",
            "rules" : {
                "condition" : "AND",
                "rules" : [
                    {
                        "id" : filter.id,
                        "field" : "user_id",
                        "type" : "string",
                        "operator" : "equal",
                        "value" : "[{\"mode\":\"variable\",\"values\":[\"user._id\"]}]"
                    }
                ],
                "valid" : true
            }
        }).save();
        await StubSandboxModels.deleteMany({});
    });

    it('find должен возвращать только записи текущего пользователя',async ()=>{
        let user = await Users.findOne({roleName:role.name});
        if(!user)
            throw new Error('Пользователь не найден');
        let modelWrapper = new MongooseModelWrapper(StubSandboxModels,user);
        let stubDoc = await new StubSandboxModels({
            user_id:user.id
        }).save();
        let stubDoc2 = await new StubSandboxModels({
            user_id:'1'
        }).save();
        let models = await modelWrapper.find({});
        should.equal(models.length, 1, `Пользователю доступен только 1 документ`);
    });
});