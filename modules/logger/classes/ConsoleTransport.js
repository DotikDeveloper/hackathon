const os = require('os');
const { LEVEL, MESSAGE } = require('triple-beam');
const TransportStream = require('winston-transport');

export default class ConsoleTransport extends TransportStream {
    /**
     * Constructor function for the Console transport object responsible for
     * persisting log messages and metadata to a terminal or TTY.
     * @param {!Object} [options={}] - Options for this instance.
     */
    constructor(options = {}) {
        super(options);

        // Expose the name of this Transport on the prototype
        this.name = options.name || 'console';
        this.stderrLevels = this._stringArrayToSet(options.stderrLevels);
        this.consoleWarnLevels = this._stringArrayToSet(options.consoleWarnLevels);
        this.eol = options.eol || os.EOL;

        this.setMaxListeners(30);
    }

    /**
     * Core logging method exposed to Winston.
     * @param {Object} info - TODO: add param description.
     * @param {Function} callback - TODO: add param description.
     * @returns {undefined}
     */
    log(info, callback) {
        setImmediate(() => this.emit('logged', info));

        // Remark: what if there is no raw...?
        if (this.stderrLevels[info[LEVEL]]) {
            console.error(`[${info.tag} ${info.level}] ${info.message}`);
        } else if (this.consoleWarnLevels[info[LEVEL]]) {
            console.warn(`[${info.tag} ${info.level}] ${info.message}`);
        }else{
            console.log(`[${info.tag} ${info.level}] ${info.message}`);
        }

        if (callback) {
            callback(); // eslint-disable-line callback-return
        }
    }

    /**
     * Returns a Set-like object with strArray's elements as keys (each with the
     * value true).
     * @param {Array} strArray - Array of Set-elements as strings.
     * @param {?string} [errMsg] - Custom error message thrown on invalid input.
     * @returns {Object} - TODO: add return description.
     * @private
     */
    _stringArrayToSet(strArray, errMsg) {
        if (!strArray)
            return {};

        errMsg = errMsg || 'Cannot make set from type other than Array of string elements';

        if (!Array.isArray(strArray)) {
            throw new Error(errMsg);
        }

        return strArray.reduce((set, el) =>  {
            if (typeof el !== 'string') {
                throw new Error(errMsg);
            }
            set[el] = true;

            return set;
        }, {});
    }
}