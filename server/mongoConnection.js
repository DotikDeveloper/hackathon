import mongoose from 'mongoose';
import _ from 'underscore';

mongoose.set('useNewUrlParser', true);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology',true);
mongoose.set('debug',process.env.MONGOOSE_DEBUG=='1');
function connectionRetry(){
    return mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        //autoReconnect: true,
        poolSize: 10,
        //retryMiliSeconds:1000,
        numberOfRetries:Number.MAX_VALUE,
        //reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
        //reconnectInterval: 3000,
    }).then(()=>{
        console.log('mongoose connected');
    },(err)=>{
        console.log('mongoose NOT connected');
        setTimeout(connectionRetry,5000);
    });
}
connectionRetry();

Object.defineProperty(mongoose,'modelNames',{
    enumerable: false,
    get:function(){
        return _.chain(mongoose.connections)
        .map((connection)=>{
            return _.values( connection.models );
        })
        .flatten()
        .map((model)=>{
            return model.modelName;
        })
        .value();
    }
});


export default mongoose;