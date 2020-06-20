import LoggerTags from "../models/LoggerTags";
import _ from 'underscore';
import {Tags} from "../enums";

_.each (Tags.keys, async (tag) => {
    let label = Tags[tag].label;
    await LoggerTags.deleteOne({name:tag});
    if (!await LoggerTags.findOne ({name:tag})){
        await new LoggerTags({
            name:tag,label
        }).save();
    }
});