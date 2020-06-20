import MongooseQueryWrapper from "./classes/MongooseQueryWrapper";
import Users from "../account/Users";
import _ from 'underscore';
import MongooseDocWrapper from "./classes/MongooseDocWrapper";

(async function(){
    let user = await Users.findOne({login:'customer'});
    let query = Users.find();
    let queryWrapped = new MongooseQueryWrapper(query,user);
    let users = await queryWrapped.exec();
    if(!_.isEmpty(users)){
        _.first(users).save();
    }
    users = await Users.find();
    _.each(users,async (userDoc)=>{
        let docWrapped = new MongooseDocWrapper(userDoc,user);
        try {
            await docWrapped.save ();
        }catch (e) {
            console.error(e);
        }
    });
}).apply();
