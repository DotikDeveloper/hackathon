import {EventEmitter} from 'events';
import $ from 'jquery';
export default class IRLibLoader extends EventEmitter{
    constructor(){
        super();
        this.setMaxListeners(0);
        this._libs = {};
    }

    load(src, options){
        return new Promise((resolve,reject)=>{
            if(this._libs[src]&&this._libs[src].ready){
                return resolve();
            }else if(this._libs[src]){
                this.once(`success:${src}`,(data)=>{
                    resolve(data);
                });
            } else if (!this._libs[src]) {
                this._libs[src] = {
                    src: src,
                    ready: false,
                    options: options
                };
                $.ajax({
                    url: src,
                    dataType: /\.css$/i.test(src) ? 'text' : 'script',
                    success: (data, textStatus, jqxhr)=>{
                        let lib = this._libs[src];
                        if (jqxhr.status === 200) {
                            lib.ready = true;
                            lib.status = jqxhr.status;
                            resolve(data);
                        }
                        this.emit('success',src,data);
                        this.emit('success:'+src,data);
                    },
                    error: function(err) {
                        reject(err);
                    }
                });
            }
        });




    }

    static getInstance(){
        if(!IRLibLoader._instance){
            IRLibLoader._instance = new IRLibLoader();
        }
        return IRLibLoader._instance;
    }
}