//соеднинение с БД установлено
import _ from 'underscore';
import '/modules/account';
import '/modules/cluster';
import {load as doClusterLoad} from "/modules/cluster";
import '/modules/acl2';
import '/modules/logger';
import {default as doAutofill,beforePreload as doBeforePreload} from './autofill';
/*
import './speech/main';
import './speech';
import '../models/Recognitions/Recognitions';
/* */

export default function(){
    return  _.seqNew([
        function beforePreload(h,cb){
            if(!process.env.AUTOFILL)
                return cb();
            return doBeforePreload();
        },
        function clusterLoad(){
            return doClusterLoad();
        },
        function autofill(h,cb){
            if(!process.env.AUTOFILL)
                return cb();
            return doAutofill();
        }
    ]);
}