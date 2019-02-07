import {promiseDelay} from './async'
/*
 Delay invocations of a promise-returning function so that a
 minimul interval between invocations is respected.
 */
export const fThrottle = (minRequestDeltaMs: number) => {
    let lastRequestTimeMs = 0
    return (f:() => any) =>  {
        const now = Date.now()
        const timeSinceLastMs = now - lastRequestTimeMs
        if (timeSinceLastMs < minRequestDeltaMs) {
            // set the "last" time predictively, so that subsequent invocations delay based on it
            lastRequestTimeMs = lastRequestTimeMs + minRequestDeltaMs
            return promiseDelay(minRequestDeltaMs - timeSinceLastMs)
                .then(function ():any {
                return f()
            })
        }
        else {
            lastRequestTimeMs = now
            return f()
        }
    }
}
