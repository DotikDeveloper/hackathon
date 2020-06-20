import ImageFiles from "../../ImageFiles";
import {
    methods,
    mutations,
    authenticatedOnly, createResponseConvert, asCurrentUserResolver
} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import _ from 'underscore';

export default
@asCurrentUserResolver()
@methods(['list','view'])
@mutations(['create','createMany','remove'])
class ImageFilesResolver extends CrudResolver2{
    constructor () {
        super (ImageFiles);
    }

    @createResponseConvert
    @authenticatedOnly
    async create(parent,args,ctx){
        const file = await args.file;
        const {user} = ctx;
        const { createReadStream, filename, mimetype, encoding } = file;
        const stream = createReadStream();
        let model = new ImageFiles();
        model.protectedInput(args.model,ctx.user);
        model.user_id = user._id;
        await model.attach('versions.original', {
            name:filename,
            type:mimetype,
            stream:stream
        });
        let result = await model.save();
        return result;
    }

    @authenticatedOnly
    async createMany(parent,args,ctx){
        const files = await args.files;
        const {user} = ctx;

        let models = await _.mapAsync(files,async (file)=>{
            file = await file;
            const { createReadStream, filename, mimetype, encoding } = file;
            const stream = createReadStream();
            let model = new ImageFiles({
                user_id:user._id
            });
            await model.attach('versions.original', {
                name:filename,
                type:mimetype,
                stream:stream
            });
            let result = await model.save();
            return result;
        });
        return models;

    }

}
