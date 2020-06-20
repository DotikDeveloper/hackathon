// eslint-disable-next-line no-unused-vars
import { ApolloLink, Observable } from 'apollo-link';
import EJSON from 'ejson';
import _ from 'underscore';

let nativeClasses = [];
if(typeof File != 'undefined'){
    nativeClasses.push(File);
}

function containsNative(obj){
    let isNative = !! _.find(nativeClasses,(nativeClass)=>{
        return obj instanceof nativeClass;
    });
    let isNativeChilds = !!_.chain(obj)
        .values()
        .find((val)=>{
            let contains = containsNative(val)
            return contains.isNative||contains.isNativeChilds;
        })
        .value();
    return {
        isNative,isNativeChilds
    };
}

function createEJSONTransformerLink() {
    return new ApolloLink(function (operation, forward) {
        operation.setContext(({ headers = {} }) => {
            return {
                credentials: 'include',
                headers: {
                    ...headers
                }
            };
        });

        if(operation.variables){
            const recursive = function(target,obj,key){
                let contains = containsNative(obj);
                // eslint-disable-next-line no-empty
                if(contains.isNative){

                }else if(contains.isNativeChilds){
                    _.each(obj,(val,key2)=>{
                        recursive(obj,val,key2);
                    });
                }else{
                    try {
                        let clone = JSON.parse (EJSON.stringify (obj));
                        target[key] = clone;
                    }catch (e) {
                        target[key]=obj;
                    }
                }
            };

            _.each(operation.variables,(val,key)=>{
                recursive(operation.variables,val,key);
            });
        }
        return forward(operation).map(function (response) {
            if (response.data) {
                const json = JSON.stringify(response.data);
                response.data = EJSON.parse(json);
            }
            return response;
        });
    });
}
export default createEJSONTransformerLink;