import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";


/**
 * @constructor LoggerGlobalLogs
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
const LoggerGlobalLogsSchema = new Schema({
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

const LoggerGlobalLogs = new mongoose.model('loggerGlobalLogs',LoggerGlobalLogsSchema,'loggerGlobalLogs');
LoggerGlobalLogs.label='Глобальные записи лога';
export default LoggerGlobalLogs;