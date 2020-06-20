import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";


/**
 * @constructor LoggerLogs
 * @property {string} message
* @property {string} tag
* @property {string} level
* @property {string} dataString
* @property {Date} created
* @property {object} meta
* @property {string} meta.user_id
* @property {string} meta.server_id
* @property {string} meta.node

 **/
const LoggerLogsSchema = new Schema({
	message:{
		type:String,
	},
	tag:{
		type:String,
	},
	level:{
		type:String,
	},
	dataString:{
		type:String,
	},
	created:{
		type:Date,
		default(){
			return new Date()
		}
	},
	meta:{
		user_id:{
			type:String,
		},
		server_id:{
			type:String,
		},
		node:{
			type:String,
		},
	},

});

const LoggerLogs = new mongoose.model('loggerLogs',LoggerLogsSchema,'loggerLogs');
LoggerLogs.label='Локальные записи лога';
export default LoggerLogs;