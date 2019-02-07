/**
 * from one object, create another with the same keys but values mapped to something else
 * @param o source object
 * @param f mapping function
 */
export function mapValues<T extends object, V>(o: T, f: (t: T[keyof T],
                                                         k: string) => V): { [key in keyof T]: V } {
    const ret: { [key in keyof T]: V } = {} as { [key in keyof T]: V }
    Object.entries(o).forEach((e: [string, T[keyof T]]) => {
        const [k, t] = e
        ret[k] = f(t, k)
    })
    return ret
}
