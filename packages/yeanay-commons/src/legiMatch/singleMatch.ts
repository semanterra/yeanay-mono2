import damlev from 'damlev'

/**
 * Convert a name to canonical form.
 * Remove first word and/or last word if they have more than one letter and end with '.'
 * All lower case.
 * Broken into word array.
 * Only ansi letters - no foreign chars, punctuation, spaces, etc.
 * Words are in sort order.  No empty words.
 *
 */

type CanonicalName = string[]

export function canonicalize(name: string): CanonicalName {
    const firstSpace = name.indexOf(' ')
    if ( firstSpace > 0 && name[firstSpace-1] === '.' ) {
        name = name.substr(firstSpace + 1)
    }
    const lastSpace = name.lastIndexOf(' ')
    if ( lastSpace > 0 && name[name.length-1] === '.' ) {
        name = name.substr(0, lastSpace)
    }

    const ret = name.normalize('NFD').toLowerCase().replace(/[^a-z ]/g, '').split(' ')
    return ret.sort()
}

/**
 * This provides a match value for a single pair of canonical names.
 */
export function matchPair(newName: CanonicalName, refName: CanonicalName): number {
    // note that names may have different array lengths

    // todo copy arrays first

    // remove largest left newName substring of any remaining refName word, including exact match, and remove both.
    // this relies on the sort order of the words
    for ( let iRef = refName.length-1; iRef >= 0; iRef -= 1 ) {
        for ( let iNew = newName.length-1; iNew >= 0; iNew -= 1 ) {
            if ( newName[iNew] === refName[iRef] ) {
                refName.splice(iRef, 1)
                newName.splice(iNew, 1)
                break
            }
        }
    }

    if ( !refName.length || !newName.length ) {
        return 0 // optimize
    }
    const lengthDif = refName.length - newName.length
    const filler = Array<string>(Math.abs(lengthDif)).fill('')
    if ( lengthDif > 0 ) {
        newName.splice(0, 0, ...filler)
    } else if ( lengthDif < 0 ) {
        refName.splice(0, 0, ...filler)
    }

    const permutations = permute(newName.length)
    let best: number = 9999999
    // tslint:disable-next-line:prefer-for-of
    for ( let iPermute = 0; iPermute < permutations.length; iPermute += 1 ) {
        let score:number = 0
        for ( let iWord = 0; iWord < newName.length; iWord += 1 ) {
            const newWord = newName[permutations[iPermute][iWord]]
            const refWord = refName[iWord]
            if ( newWord.length && refWord.length ) {
                score += damlev(newWord, refWord)
                if ( score >= best ) { // optimization
                    break
                }
            }
        }
        if ( score < best ) { best = score }
    }
    return best
}


const permuteCache: number[][][] = []

// return all permutations of the integers from 0 to n-1
// results are memoized; do not modify!
function permute(n: number): number[][] {
        if ( permuteCache[n] ) {
            return permuteCache[n]
        }
        let result: number[][] = []
        const inputArr: number[] = []
        for ( let ii = 0; ii < n; ii += 1 ) {
            inputArr[ii] = ii
        }
        const permute1 = (arr: number[], m: number[] = []) => {
            if (arr.length === 0) {
                result.push(m)
            } else {
                for (let i = 0; i < arr.length; i+=1) {
                    let curr = arr.slice()
                    let next = curr.splice(i, 1)
                    permute1(curr.slice(), m.concat(next))
                }
            }
        }
        permute1(inputArr)

        permuteCache[n] = result
        return result
}


