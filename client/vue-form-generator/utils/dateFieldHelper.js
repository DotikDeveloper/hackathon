import fecha from "fecha";
import _ from 'underscore';

export default {
	formatValueToField(value) {
		if (value != null) {
			let dt = this.schema.format ? fecha.parse(value, this.schema.format) : new Date(value);
			return fecha.format(dt, this.getDateFormat());
		}
		return value;
	},

	formatValueToModel(value) {
		let original = value;
		if (value != null) {
			let m = _.isDate(value) ? value : fecha.parse(value, this.getDateFormat());
			if (this.schema.format) {
				value = fecha.format(m, this.schema.format);
			} else {
				try {
					value = m;
				}catch (e) {
					console.error(e);
					return null;
				}
			}
		}
		console.log('formatValueToModel: value:',original,'value:',value);
		return value;
	}
};
