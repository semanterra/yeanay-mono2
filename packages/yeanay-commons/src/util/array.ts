
import {Transformer, Maybe} from '../types'

export type SortComparer<T> = (a:T, b:T) => number // sort comparer

// noinspection JSUnusedGlobalSymbols
export function last<T>(a:T[]): T | null {
    return ( a && a.length) ? a[a.length-1] : null
}

// normal ascii order
export function compareStrings(a:string, b:string): number {
    return a > b ? 1 : a === b ? 0 : -1
}

// this is for dates in yyyy-mm-dd format
// noinspection JSUnusedGlobalSymbols
export const compareDates = compareStrings


export function compareNumbers(a: number,b:number): number {
    return a-b
}

export function invertComparer<T>(c:SortComparer<T>):SortComparer<T> {
    return (a: T, b: T) => -c(a, b)
}

// formerly makeSortComparer
export function makeFieldComparer<REC,FLD, T>(
    extractor:(rec:REC)=>FLD,
    comparer:SortComparer<FLD>
): (a:REC, b:REC)=>number {
    return (a:REC, b:REC) => comparer(extractor(a), extractor(b))
}

// for multicolumn compares.  Just supports two for now.
export const multiCompare = <REC>(c1:SortComparer<REC>, c2:SortComparer<REC>) => (a:REC, b:REC) => {
    const ret1 = c1(a,b)
    return ret1? ret1 : c2(a,b)
}

/**
 * Break an array into sequential subarrays based on === of some extracted feature
 * @param extractor
 * @param arr
 */
export function partitionBy<REC,FLD>(extractor:Transformer<REC,FLD>, arr:REC[]): REC[][] {
    let ret: REC[][] = []
    let i = 0
    let prev: Maybe<FLD> = undefined
    while (i < arr.length) {
        const el = arr[i]
        const next = extractor(el)
        // tslint:disable-next-line
        if ( next == prev ) {
            ret[ret.length-1].push(el)
        } else {
            ret.push([el])
            prev = next
        }
        i += 1
    }
    return ret
}

/**
 * I am so tired of being f'd up by "map" hosing "this".
 * @param array
 * @param iteratee
 * @returns S
 * @deprecated prefer R.map
 */
/*export function arrayMap<T, S>(array: T[], iteratee: (input: T, index: number) => S): S[] {
    const length = array == null ? 0 : array.length
    const result = Array(length)

    for ( let index = -1; index < length; index += 1  ) {
        result[index] = iteratee(array[index], index)
    }
    return result
}
*/
