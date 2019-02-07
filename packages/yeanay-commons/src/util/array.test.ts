import {
    compareNumbers,
    compareStrings,
    invertComparer,
    makeFieldComparer,
    multiCompare,
    partitionBy,
    SortComparer,
} from './array'

describe('compareStrings', () => {
    test('empty is first', () => {
        expect(compareStrings('', ' ')).toBeLessThan(0)
        expect(compareStrings(' ', '')).toBeGreaterThan(0)
    })

    test('"a" vs "b"', () => {
        expect(compareStrings('a', 'b')).toBeLessThan(0)
        expect(compareStrings('b', 'a')).toBeGreaterThan(0)
    })
    test('case-sensitive "a" vs "B"', () => {
        expect(compareStrings('B', 'a')).toBeLessThan(0)
        expect(compareStrings('a', 'B')).toBeGreaterThan(0)
    })
    test('equality', () => {
        expect(compareStrings('a', 'a')).toEqual(0)
    })
})


describe('compareNumbers', () => {
    test('1,2', () => {
        expect(compareNumbers(1, 2)).toBeLessThan(0)
    })
    test('2,1', () => {
        expect(compareNumbers(2, 1)).toBeGreaterThan(0)
    })
    test('1,1', () => {
        expect(compareNumbers(1, 1)).toEqual(0)
    })
})

const invertedNumbers: SortComparer<number> = invertComparer(compareNumbers)

describe('invertComparer', () => {
    test('1,2', () => {
        expect(invertedNumbers(1, 2)).toBeGreaterThan(0)
    })
    test('2,1', () => {
        expect(invertedNumbers(2, 1)).toBeLessThan(0)
    })
    test('1,1', () => {
        expect(invertedNumbers(1, 1)).toEqual(0)
    })
})

interface Rec {
    field: number
    field2: number
}

const rec1: Rec = { field: 1, field2: 6 }
const rec2: Rec = { field: 2, field2: 1 }

const fieldComparer = makeFieldComparer((r: Rec) => r.field, compareNumbers)

describe('makeFieldComparer', () => {
    test('1,2', () => {
        expect(fieldComparer(rec1, rec2)).toBeLessThan(0)
    })
    test('2,1', () => {
        expect(fieldComparer(rec2, rec1)).toBeGreaterThan(0)
    })
    test('1,1', () => {
        expect(fieldComparer(rec1, rec1)).toEqual(0)
    })
})

const rec1a: Rec = { field: 1, field2: 0 }
const rec2a: Rec = { field: 2, field2: 6 }

const field2Comparer = makeFieldComparer((r: Rec) => r.field2, compareNumbers)

const multiFieldComparer = multiCompare(fieldComparer, field2Comparer)

describe('multiCompare', () => {
    test('1,2', () => {
        expect(multiFieldComparer(rec1, rec2)).toBeLessThan(0)
    })
    test('2,1', () => {
        expect(multiFieldComparer(rec2, rec1)).toBeGreaterThan(0)
    })
    test('1,1', () => {
        expect(multiFieldComparer(rec1, rec1)).toEqual(0)
    })
    test('1,1a', () => {
        expect(multiFieldComparer(rec1, rec1a)).toBeGreaterThan(0)
    })
    test('2,2a', () => {
        expect(multiFieldComparer(rec2, rec2a)).toBeLessThan(0)
    })
})

const ident = (n: number) => n

describe('partitionBy', () => {
    test('[]', () => {
        expect(partitionBy(ident, [])).toEqual([])
    })
    test('[1]', () => {
        expect(partitionBy(ident, [1])).toEqual([[1]])
    })
    test('[1,1,2,2,1]', () => {
        expect(partitionBy(ident, [1, 1, 2, 2, 1]))
            .toEqual([[1, 1], [2, 2], [1]])
    })
})
