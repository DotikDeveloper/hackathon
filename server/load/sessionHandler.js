import expressSession from 'express-session';
const { v4: uuidV4 } = require ('uuid');
const MongoStore = require('connect-mongo')(expressSession);
import mongoose from 'mongoose';

let handler = null;
export default function sessionHandler(){
    if(!handler) {
        handler = expressSession ({
            genid: (req) => {
                console.log (req.sessionID)
                return uuidV4 () // use UUIDs for session IDs
            },
            store: new MongoStore ({mongooseConnection: mongoose.connection}),
            secret: 'keyboard cat',
            resave: false,
            saveUninitialized: true,
            cookie: {
                secure: false,
                maxAge: 365 * 24 * 3600 * 1000
            },
        });
    }
    return handler;
}