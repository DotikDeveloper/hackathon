const NS_PER_SEC = 1e9;

export default class TimeInterval {
    constructor () {
        this.started = null;
        this.duration = [];
        this.series = 0;
    }

    start(){
        this.started = process.hrtime();
    }

    /**@returns {this}*/
    pause(){
        const diff = process.hrtime(this.started);
        if(this.duration.length===0){
            this.duration = diff;
        }else{
            this.duration[0]+=diff[0];
            this.duration[1]+=diff[1];
        }
        this.series++;
        return this;
    }

    milliseconds(){
        if(this.duration.length===0)
            return 0;
        let nanoseconds = this.duration[0]*NS_PER_SEC+this.duration[1];
        return nanoseconds / 1e6;
    }

    millisecondsAvg(){
        let totalMillisecods = this.milliseconds();
        if(!totalMillisecods||this.series===0)
            return totalMillisecods;
        return  totalMillisecods / this.series;
    }

    raw(){
        return {
            spended:this.milliseconds(),
            avg:this.millisecondsAvg()
        }
    }

}