const {Transform} = require('stream');
const bufSplit = require('buffer-split');
class LineTransform extends Transform {
    constructor(options){
        super(options);
        this.buffer = Buffer.alloc(0);
    }
    _flush(callback){
        if(this.buffer.length>0){
            this.push(this.buffer);
            this.buffer = Buffer.alloc(0);
        }
        callback();
    }
    _transform(data, encoding, callback){
        let buf = Buffer.concat([this.buffer, data]);
        let buffers = bufSplit(buf,Buffer.from("\n"));
        if(buffers.length<2){
            this.buffer = buffers[0];
        }else{
            this.buffer = buffers.pop();
            buffers.forEach((buf)=>{
                this.push(buf);
            });
        }
        callback();
    }
}

export default LineTransform;