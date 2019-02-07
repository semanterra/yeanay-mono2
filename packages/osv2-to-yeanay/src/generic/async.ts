import VError = require('verror')

/*  BACKLOG re-enable or kill
if (process.env.NODE_ENV !== 'production') {
    require('longjohn');
}
*/

// Return a promise that delays a length of time
export function promiseDelay(delayMs: number): Promise<void> {
    return new Promise<void>(
        (resolve, reject) =>
            setTimeout(() => resolve(), delayMs))
}

export class MultiCauseError extends VError {
    public nErrors: number
    public errors: Error[]
    public origStack: string

    constructor(message: string, ...params: any[]) { // tslint:disable-line:no-any
        super(message, params)
    }
}

/*
class Either<E,T> {

    constructor(readonly value:E|T, readonly isRight:boolean) {}
    static Left<E, T=any>(e:E) { return new Either<T,E>(e, false) }
    static Right<T, E=any>(v:T) { return new Either<T,E>(v, false) }
}
*/

/**
 * Create and resolve multiple promises, one at a time.
 * This fails slow, trying to complete all the promises it can.
 * @param promiseGens array of promise generators (invoke once to create a promise)
 * @param throwing    true if should throw if any errors;
 * the thrown Error contains an "errors" array
 * @returns array of Either results
 */
/*
export async function promiseSequence<T, U>(promiseGens: [() => Promise<T>],
                                            throwing: boolean = true,
                                            resultMapper: (resolved: T) => U): Promise<Either<VError,T|U>[]> {
    type ETYPE = Either<VError,T|U>
    const maxErrors: number      = 10
    const error: MultiCauseError = new MultiCauseError('promiseSequence error')

    const ret: Either<VError,T|U>[]   = []
    const errs: VError[]  = []
    let nErrors: number = 0

    let iPromise: number = -1
    for (let promiseGen of promiseGens) {
        iPromise += 1
        try {
            const promise: Promise<T>    = promiseGen()
            const promiseRet: T = await promise
            const mappedRet: T|U  = resultMapper ? resultMapper(promiseRet) : promiseRet
            ret.push(<ETYPE>Either.Right(mappedRet))
        } catch (e) {
            nErrors += 1
            if (nErrors <= maxErrors) {
                const e2: VError = new VError(e, `#${iPromise}: ${promiseGen}`)
                ret.push(<ETYPE>Either.Left(e2))
                errs.push(e2)
            }
        }
    }
    if (nErrors && throwing) {
        error.nErrors   = nErrors
        error.errors    = errs
        error.origStack = VError.fullStack(error)
        Object.defineProperty(error, "stack", {
            get: function () {
                return stackPromiseSequenceError(error)
            }
        })
        throw error
    }
    return ret
}
*/

function stackPromiseSequenceError(err: MultiCauseError): string {
    let ret      = err.origStack
    const errors = err.errors
    if (!errors) {
        return ret
    }
    for (let subErr of errors) {
        ret += '\n--- ' + subErr.stack
    }
    const nSkipped = err.nErrors - errors.length
    if (nSkipped) {
        ret += `\n--- ${nSkipped} additional errors not logged`
    }
    return ret
}

