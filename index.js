const { exec } = require("child_process");
const EventEmitter = require('events');
const date = require('date-and-time');

class NodePacketLoss extends EventEmitter {
    #interval = 1000
    #host = ''
    #intervalFunction
    #running = false
    #timeout = 4000
    #pingsExecuted = 0;
    #pingsFailed = 0;

    /**
     * @param {number} interval 
     */
    constructor(interval = this.#interval, host = this.#host, timeout = this.#timeout) {
        super();
        this.interval = interval;
        this.host = host;
        this.#timeout = timeout;
    }

    /**
     * @param {number} interval
     */
    set interval(interval) {
        try {
            this.#interval = parseInt(interval);
        } catch (ex) {
            throw ex;
        }
    }

    get interval() {
        return this.#interval;
    }

    /**
     * @param {string} host
     */
    set host(host) {
        this.#host = host;
    }

    get host() {
        return this.#host
    }

    /**
     * @param {number} timeout
     */
    set timeout(timeout) {
        try {
            this.#timeout = parseInt(timeout);
        } catch (ex) {
            throw ex;
        }
    }

    get timeout() {
        return this.#timeout;
    }

    // start() {
    //     if (this.#running) return;

    //     this.#running = true;
    //     this.#intervalFunction = setInterval(() => {
    //         exec(`ping /n 1 /w ${this.#timeout} ${this.#host}`, (err, stdout, stderr) => {
    //             if (err) {
    //                 if (!err.killed && err.code === 1 && err.signal === null) {
    //                     this.#pingsFailed++;
    //                     return;
    //                 }
    //                 return this.emit('error', err);
    //             }
    //             if (stderr) return this.emit('stderror', stderr);

    //             this.#pingsExecuted++;
    //             this.emit('result', this.#calculatePacketLoss());
    //             return;

    //             //const packetLossSegment = stdout.match(/(\([0-9]{1,3}% loss\))/m);
    //             //if (packetLossSegment.length < 1) throw 'Cannot find packet loss output in ping command';
    //             //const packetLoss = parseInt(packetLossSegment[0].match(/([0-9]{1,3})/m)[0]);
    //         });
    //     }, this.#interval);
    // }
    start() {
        if (this.#running) return;

        this.#running = true;

        this.#pingsExecuted = 0;
        this.#pingsFailed = 0;

        this.#intervalFunction = setInterval(() => {
            if (this.#pingsExecuted === 100) {
                this.emit('result', this.#pingsFailed === 0 ? 0 : this.#pingsFailed / this.#pingsExecuted);
                this.#pingsExecuted = 0;
                this.#pingsFailed = 0;
            }

            // console.log('INTERVAL')

            exec(`ping /n 1 ${this.#host}`, (err, stdout, stderr) => {
                if (err) {
                    if (!err.killed && err.code === 1 && err.signal === null) {
                        this.#pingsFailed++;
                        this.#pingsExecuted++;
                        return;
                    }
                    console.log('err');
                    return this.emit('error', err);
                }
                if (stderr) {
                    this.#pingsFailed++;
                    this.#pingsExecuted++;
                    console.log('stderror');
                    return this.emit('stderror', stderr);
                }

                this.#pingsExecuted++;
            });
        }, 10);
    }

    stop() {
        this.#pingsExecuted = 0;
        this.#pingsFailed = 0;
        clearInterval(this.#intervalFunction);
    }
}

const npl = new NodePacketLoss(1000, 'legendarydudes.de', 10000);
npl.start();
npl.on('result', packelLoss => {
    const loss = parseInt(Math.round(packelLoss)) * 100;
    const now = date.format(new Date(), 'YYYY/MM/DD HH:mm:ss');
    console.log(`${now} ${loss}%`)
});

npl.on('error', console.log);
npl.on('stderror', console.log);