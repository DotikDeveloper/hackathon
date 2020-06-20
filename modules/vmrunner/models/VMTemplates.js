import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";


/**
* @constructor VMTemplates
* @property {string} name
* @property {string} user_id
* @property {string} expression
* @property {boolean} useCustomScope
* @property {string} scopeExpression
* @property {Date} created
* @property {boolean} useCustomCtx
* @property {string} ctxExpression
* @property {object} serverOptions
* @property {boolean} serverOptions.useCustom
* @property {string} serverOptions.server_id
* @property {string} serverOptions.node_name
*
* @property {Users} user
* @property {Servers} server
 **/
const VMTemplatesSchema = new Schema({
	name:{
		type:String,
		required:[true,'Имя обязательно'],
	},
	user_id:{
		type:String,
		required:[true,'Пользователь обязателен'],
	},
	expression:{
		type:String,
		validate:codeValidate
	},
	useCustomScope:{
		type:Boolean,
		default:false
	},
	scopeExpression:{
		type:String,
		validate(expression){
			if(this.useCustomScope)
				return codeValidate(expression);
		}
	},
	created:{
		type:Date,
		default() {
			return new Date();
		}
	},
	useCustomCtx:{
		type:Boolean,
		default:false
	},
	ctxExpression:{
		type:String,
		validate(expression){
			if(this.useCustomCtx)
				return codeValidate(expression);
		}
	},
	serverOptions:new Schema({
		useCustom:{
			type:Boolean,
			default:false
		},
		server_id:{
			type:String,
			default:null
		},
		node_name:{
			type:String,
			default:null
		}
	})
});

VMTemplatesSchema.index({name: 1, user_id: 1}, {unique: true});

VMTemplatesSchema.virtual('user', {
    ref:'users',
    localField: 'user_id',
    foreignField: '_id',
    justOne: true,
    options: {
		
    }
});

VMTemplatesSchema.virtual('server', {
    ref:'servers',
    localField: 'serverOptions.server_id',
    foreignField: '_id',
    justOne: true,
    options: {
		
    }
});


const VMTemplates = new mongoose.model('vmTemplates',VMTemplatesSchema,'vmTemplates');
VMTemplates.label='Пользовательский код';
export default VMTemplates;