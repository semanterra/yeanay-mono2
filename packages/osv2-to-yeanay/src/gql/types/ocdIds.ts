import { OCDJurisdictionId, StateId } from '@yeanay/yeanay-commons'

// JURISDICTION ID

const jurisdictionRe = /ocd-jurisdiction\/country:us\/(?:state|territory|district):(\w\w)\/(government|legislature)/

export function parseJurisdictionId(id: OCDJurisdictionId): StateId {
    const matched = id.match(jurisdictionRe)
    if ( !matched ) {
        throw new Error('Invalid jurisdiction id: ' + id)
    }
    return matched[1]
}

export function makeJurisdictionId(id: StateId): OCDJurisdictionId {
    const typ = id === 'pr' ? 'territory' : id === 'dc' ? 'district' : 'state'
    return `ocd-jurisdiction/country:us/${typ}:${id}/government`
}
