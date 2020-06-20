import cluster from 'express-cluster';


export default function(cb){
    const CLUSTER_WORKERS_COUNT = process.env.CLUSTER_WORKERS_COUNT ? Number(process.env.CLUSTER_WORKERS_COUNT):0;
    if(process.env.CLUSTER_TESTMODE=='1'||CLUSTER_WORKERS_COUNT==0){
        return cb();
    }else{
        return cluster(cb,{
            count:CLUSTER_WORKERS_COUNT
        });
    }
}