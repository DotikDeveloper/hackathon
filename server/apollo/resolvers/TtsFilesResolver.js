import DefaultResolver from "./DefaultResolver";
import {methods, mutation, mutations} from "../module";
import TtsFiles from "../../../models/TtsFiles/TtsFiles";

@methods(['list','view'])
@mutations(['upload'])
class TtsFilesResolver extends DefaultResolver{
    @mutation
    async upload(parent,args,context) {
        const file = await args.file;
        const {user} = context;
        const { createReadStream, filename, mimetype, encoding } = file;
        const stream = createReadStream();

        let model = new TtsFiles();

        await model.attach('versions.original', {
            name:filename,
            type:mimetype,
            stream:stream
        });
    }


}