import Users from "../Users";
import AclRoles from "../../acl2/models/AclRoles";
import _ from 'underscore';

Users.find({},async (err,models)=>{
    if(_.size(models)<2){
        setTimeout(async ()=>{
            let roles = await AclRoles.find();
            _.each(roles,(role)=>{
                let user = new Users ({
                    login:`${role.name}`,
                    type:Users.types.password.key,
                    name:role.name.charAt(0).toUpperCase() + role.name.slice(1),
                    password:`user`,
                    email:`${role.name}@minta365.ru`,
                    roleName:role.name
                });
                user.save();
            });
        },10000);
    }

});