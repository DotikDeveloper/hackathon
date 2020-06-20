import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";


/**
 * @constructor VmCodes
 * @property {string} expression
* @property {string} transpiledExpression
* @property {boolean} useCustomScope
* @property {string} scopeExpression
* @property {boolean} useCustomCtx
* @property {string} ctxExpression
* @property {Date} created
* @property {object} meta
* @property {string} meta.user_id
* @property {string} meta.project_id
* @property {string} meta.menu_id
* @property {string} meta.tag

* @property {object} check
* @property {string} check.result
* @property {Date} check.date

 **/
const VmCodesSchema = new Schema({
	expression:{
		type:String,
		required:[true,'Код обязателен'],
		default(){ return ''; },
	},
	transpiledExpression:{
		type:String,
	},
	useCustomScope:{
		type:Boolean,
		default:false
	},
	scopeExpression:{
		type:String,
		default:null,
		validate(expression){
			if(this.useCustomScope)
				return codeValidate(expression);
		}
	},
	useCustomCtx:{
		type:Boolean,
		default:false
	},
	ctxExpression:{
		type:String,
		default:null,
		validate(expression){
			if(this.useCustomCtx)
				return codeValidate(expression);
		}
	},
	created:{
		type:Date,
		default(){
			return new Date();
		}
	},
	meta:new Schema({
			user_id:{
				type:String,
			},
			project_id:{
				type:String,
			},
			menu_id:{
				type:String,
			},
			tag:{
				type:String,
			},
	}),

	check:new Schema({
		result: {
			type: String,
			default: null
		},
		date: {
			type: Date,
			default: null
		},
}),

});

const VmCodes = new mongoose.model('vmCodes',VmCodesSchema,'vmCodes');
VmCodes.label='Системный код';
export default VmCodes;