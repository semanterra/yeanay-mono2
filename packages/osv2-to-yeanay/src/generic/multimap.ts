export class MultiMap<K, T> {

    private _map: Map<K, T[]> = new Map<K, T[]>()

    constructor(readonly fKey: ((t: T) => K)) {
    }

    public put(item: T,): T[] {
        const k = this.fKey(item)
        const arr: T[] = this._map.get(k) || []
        if ( !arr.length ) {
            this._map.set(k, arr)
        }
        arr.push(item)
        return arr
    }

    // tslint:disable-next-line:no-reserved-keywords
    public get(k: K): T[] {
        return this._map.get(k) || []
    }

    public* mapBuckets<O>(f: (t: T[]) => O): Iterable<O> {
        for ( let bucket of this._map.values() ) {
            yield f(bucket)
        }
    }
}
