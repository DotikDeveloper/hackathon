//Соединение установлено, необходимые данные типа кластера уже загружены, предустановленные данные типа ролей и юзеров добавлены в бд
import Users from "/modules/account/Users";
import {Schema} from 'mongoose';
import '/modules/services';

let SubSchema = new Schema({
    prop:{
        type:String,
        required:true
    }
});

let TestSchema = new Schema({
    userRelation:{
        type: Schema.Types.ObjectId,
        ref: Users
    },
    user_id:{type: Schema.Types.ObjectId},
    props:[SubSchema]
});

TestSchema.add({
    created:{
        type:Date,
        get(created){
            return created || new Date();
        },
        default(){
            return new Date();
        }
    }
});


(async ()=>{
    //let TestModel = new mongoose.model('testModel',TestSchema);



}).apply();


Users.findOne().then((user)=>{
   return;
   let model = new TestModel();
   model.userRelation = user;
   model.userVirtual = user;
   model.props = [{d:1},{d:2}];
   model.save().then(()=>{
       console.log('success save testMOdel');
   },(err)=>{
       console.error(err);
   })
});

