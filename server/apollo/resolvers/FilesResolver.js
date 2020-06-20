import {AuthenticationError} from 'apollo-server';
import {ability, method, mutation,editResponseConvert,viewConvert} from "../module";
import EJSON from 'ejson';
import DefaultResolver from "./DefaultResolver";

export class FilesResolver extends DefaultResolver {
    @mutation
    //@ability('list', 'acl_roles')
    async upload(parent,args,context) {
        const file = await args.file;
        const {user} = context;

        const { createReadStream, filename, mimetype, encoding } = file;
        const stream = createReadStream();
        let model = new Recognitions({
            date:new Date(),
            user_id : String( user._id )
        });
        await model.attach('attachment', {
            name:filename,
            type:mimetype,
            stream:stream
        });
        await model.save();
        return { name:filename, type:mimetype };


    }

    @method
    async uploads(){
        return [];
    }
}