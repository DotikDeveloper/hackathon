import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import observeChangesPlugin from "mongoose-observe";
import {LogLevels} from "../enums";

/**
 * @constructor LoggerTags
 * @property {string} name
* @property {string} label
* @property {object} levels
* @property {string} levels.console
* @property {string} levels.mongo
* @property {string} levels.mongoGlobal

 **/
const LoggerTagsSchema = new Schema({
	name:{
		type:String,
		required:true,
		unique:true,
	},
	label:{
		type:String,
		required:true,
		unique:true,
	},
	levels:{
		console:{
			type:String,
			default:LogLevels.silly.key,
			enum:LogLevels.values()
		},
		mongo:{
			type:String,
			default:LogLevels.silly.key,
			enum:LogLevels.values()
		},
		mongoGlobal:{
			type:String,
			default:LogLevels.silly.key,
			enum:LogLevels.values()
		}
	}
});
LoggerTagsSchema.plugin(observeChangesPlugin);
const LoggerTags = new mongoose.model('loggerTags',LoggerTagsSchema,'loggerTags');
LoggerTags.label='Теги логирования';
export default LoggerTags;