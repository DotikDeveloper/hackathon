import {VMRunner,VMRunnerContext} from 'vmrunner';
import HttpClient from "../../server/lib/HttpClient";
import async from 'async';
import _ from 'underscore';
import {setIntervalImmediate} from "../../server/lib/utils";

global.HttpClient = HttpClient;
global.async = async;
global._ = _;
global.setIntervalImmediate = setIntervalImmediate;

const vmRunnerContext = new VMRunnerContext()
.withScopeObj({
    HttpClient,
    console
})
.withWrapScope(false);

const vmRunner = new VMRunner(vmRunnerContext)
.withThrow(true)
.withConvertResult(false);

vmRunner.on('error',(err,info)=>{
    console.log({info});
});

vmRunner.run(`
    console.log( this.HttpClient );
    return new Promise((resolve,reject)=>{
        HttpClient.forOptions({
            url:'https://2ip.ru/'
        }).execute().then((err,content)=>{
            if(err)
                return reject(err);
            return resolve(content);
        });
    });
`,{}).then((content)=>{
    console.log({content});
},(err)=>{
    console.error(err);
});







