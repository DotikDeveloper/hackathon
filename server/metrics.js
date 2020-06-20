import {Histogram,collectDefaultMetrics,register,Gauge,Counter} from 'prom-client';

const h = new Histogram({
    name: 'test_histogram',
    help: 'Example of a histogram',
    labelNames: ['code']
});

const c = new Counter({
    name: 'test_counter',
    help: 'Example of a counter',
    labelNames: ['code']
});

const g = new Gauge({
    name: 'test_gauge',
    help: 'Example of a gauge',
    labelNames: ['method', 'code']
});

setTimeout(() => {
    h.labels('200').observe(Math.random());
    h.labels('300').observe(Math.random());
}, 10);

setInterval(() => {
    c.inc({ code: 200 });
}, 5000);

setInterval(() => {
    c.inc({ code: 400 });
}, 2000);

setInterval(() => {
    c.inc();
}, 2000);

setInterval(() => {
    g.set({ method: 'get', code: 200 }, Math.random());
    g.set(Math.random());
    g.labels('post', '300').inc();
}, 100);

//if (cluster.isWorker) {
    // Expose some worker-specific metric as an example
    setInterval(() => {
        c.inc({ code: `worker_1` });
    }, 2000);
//}

// Generate some garbage
const t = [];
setInterval(() => {
    for (let i = 0; i < 100; i++) {
        t.push(new Date());
    }
}, 10);
setInterval(() => {
    while (t.length > 0) {
        t.pop();
    }
});

// Enable collection of default metrics
collectDefaultMetrics({
    timeout: 10000,
    gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5] // These are the default buckets.
});

export default function(app){
    app.get('/metrics', (req, res) => {
        res.set('Content-Type', register.contentType);
        res.end(register.metrics());
    });

    app.get('/metrics/counter', (req, res) => {
        res.set('Content-Type', register.contentType);
        res.end(register.getSingleMetricAsString('test_counter'));
    });
}