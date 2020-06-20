import {Schema} from 'mongoose';
import mongoose from 'mongoose';

const StubSandboxSchema = new Schema({
    user_id:String
});

const StubSandboxModels = new mongoose.model('stubSandboxModels',StubSandboxSchema,'stubSandboxModels');
export default StubSandboxModels;