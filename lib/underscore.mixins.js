import _ from 'underscore';
_.mixin({
    upperFirst: function(string) {
        let s = _.isString(string)?string:String(string);
        return s.charAt(0).toUpperCase() + s.substring(1);
    },
    lowerFirst: function(string) {
        let s = _.isString(string)?string:String(string);
        return s.charAt(0).toLowerCase() + s.substring(1);
    },
    mapAsync:function(arr,cb){
        return Promise.all(_.map(arr,cb));
    },
    offset:function(string,prefix="\t"){
        let arr = string;
        if(_.isString(string)){
            arr = string.split("\n");
            return _.map(arr,(item)=>{
                return `${prefix}${item}`;
            }).join("\n");
        }else if(_.isArray(string)){
            return _.map(arr,(item)=>{
                return `${prefix}${item}`;
            })
        }else
            return `${prefix}${String(string)}`;
    },
    join:function(arr,gutter=''){
        return arr.join(gutter);
    },
    percent(current,total){
        if(!total||!current)
            return 0;
        return Math.round(current*100*100/total)/100;
    },
    debug:function(arg,cb){
        cb(arg);
        return arg;
    }
});