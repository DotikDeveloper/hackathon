import should from 'should';
import {describe,before,it} from 'mocha';
import itAsync from "/test/itAsync";
import Users from "../Users";
import AclRoles from "/modules/acl2/models/AclRoles";
import _ from 'underscore';

describe('module account', function() {
    before((done)=>{
        new Promise(async (resolve)=>{

            await Users.deleteMany({});
            let roles = await AclRoles.find();
            await _.mapAsync(roles,async (role)=>{
                let user = new Users ({
                    login:`${role.name}`,
                    type:Users.types.password.key,
                    name:role.name.charAt(0).toUpperCase() + role.name.slice(1),
                    password:`user`,
                    email:`${role.name}@minta365.ru`,
                    roleName:role.name
                });
                await user.save();
            });
            resolve();
            done();
        });
    });

    it('Users кол-во записей',async ()=>{
        let roles = await AclRoles.find();
        let users = await Users.find();
        should.equal(users.length, roles.length, `Должно быть ${roles.length} юзера`);
    });


});