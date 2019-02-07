import { mapValues } from './object'

interface O {a:number, b:string, c:number}

function newO(a:number, b:string, c:number): O {
    return { a, b, c }
}

const mapper = (field:O[keyof O], k:string) =>
    k+'>' + field

describe('mapValues', ()=> {
    test('empty', ()=> {
        expect(mapValues({}, mapper)).toEqual({})
    })
    test('abc', ()=> {
        expect(mapValues(newO(1,'a',2), mapper)).toEqual({
            a:'a>1', b: 'b>a', c: 'c>2',
        })
    })
})
