import moment from 'moment';
import Users from "/modules/account/Users";
import {
    ability3,
    methods,
    mutations,
    subscription,
    authenticatedOnly,
    subscriptions
} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";

export default
@methods(['list','view','me','validate','timezones'])
@mutations(['edit','create','remove','exit','loginAs','logoutFrom'])
@subscriptions(['observeMe','users'])
class UsersResolver extends CrudResolver2{
    constructor(){
        super(Users)
    }

    populate(query){
        return query
        .populate({path:'role',select: 'name _id label'})
        .populate('node')
        .populate('server')
        .populate({
            path:'currentUser',
            populate:[{
                path:'role',select: 'name _id label'
            }]
        });
    }

    @authenticatedOnly
    //@asCurrentUser
    // eslint-disable-next-line no-unused-vars
    async me(obj, args, ctx, info){
        /*await new Promise(resolve => {
            setTimeout(resolve,5000);
        });*/
        return this.populate(
            this
            .model
            .findOne({_id:ctx.user._id})
        );
    }

    // eslint-disable-next-line no-unused-vars
    exit(obj,args,ctx,info){
        if(ctx.req){
            ctx.req.session.destroy();
            return true;
        }
        return false;
    }

    @ability3('all')
    // eslint-disable-next-line no-unused-vars
    async loginAs(obj,{_id},{user},info){
        let targetUser = await Users.findOne({_id:_id});
        if(!targetUser)
            throw new Error('Not found');
        user.currentUserId = targetUser._id;
        await user.save();
        return true;
    }

    @ability3('all')
    // eslint-disable-next-line no-unused-vars
    async logoutFrom(obj,{_id},{user}){
        user.currentUserId = null;
        await user.save();
        return true;
    }

    @authenticatedOnly
    // eslint-disable-next-line no-unused-vars
    observeMe(obj,args,ctx,info){
        const query = this.populate( this.model.find({_id:ctx.user._id}) );
        return this.subscribe( query ,{deep:true});
    }

    @subscription({deep:true})
    // eslint-disable-next-line no-unused-vars
    users(obj,args,ctx,info){
        return this.populate( this.model.find({_id:ctx.user._id}) );
    }

    timezones(){
        return moment.tz.names();
    }
}