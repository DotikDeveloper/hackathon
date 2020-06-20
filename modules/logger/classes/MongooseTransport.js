import Transport from 'winston-transport';
import LoggerLogs from "../models/LoggerLogs";

export default
class MongooseTransport extends Transport {
    constructor(opts) {
        super(opts);

        //
        // Consume any custom options here. e.g.:
        // - Connection information for databases
        // - Authentication information for APIs (e.g. loggly, papertrail,
        //   logentries, etc.).
        //
    }

    log(info, callback) {
        new LoggerLogs(info).save();

        callback();
    }
}