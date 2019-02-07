import { Chamber } from './geoStates'

export type Promise0 = Promise<void>

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type ISODate = string // 2018-10-25 exactly - no time, 10 chars

export type Consumer<T> = (t:T)=>void

export type ConsumerP<T> = (t:T)=>Promise0
export type Transformer<FROM, TO> = (f:FROM)=>TO
export type Producer<T> = ()=>T

export type Maybe<T> = T | undefined

export type NullOr<T> = T | null

// Promise handlers
export type ResolveHandler<T> = (value?: T | PromiseLike<T>) => void
export type RejectHandler<T= any> = (reason?: T) => void
/*
    USER ID AND AUTHENTICATION
 */

export type AccessToken = string

export type UserId = string // Auth0 ID

/* durable uuid-style user id gen'd by yeanay
   Used to tag non-registered users in LocalStorage, also.
   It's "public" in the sense that it doesn't disclose any user info and thus can be shared
   freely, unlike a UserId.
 */
export type PublicId = string

/* Validation types


/*
    DATABASE DATA TYPES

    These might be thought of as belonging in daoist, but DTO definitions shouldn't
    require dependency on daoist
 */

export type PrimaryKey = number

export interface IDed<PK = PrimaryKey> {
    id: PK
}

// For use in inserting records with autogen'd id
export type WithoutId<T, PK> = T  extends IDed<PK> ? Omit<T, 'id'> : T

/** small integer used to identify legislators within a state/chamber/term
 *  or a district within a state.  Used for recording votes tersely
 */

/*
    VALIDATION/LOGGING TYPES
 */

export interface KeySet { [field:string]: string|undefined }

export type RecordType =
    'os_state'
    | 'raw_bill'
    | 'raw_district'
    | 'raw_legi'
    | 'raw_state'
    | 'os_search_bill'
    | 'os_detail_bill'
    | 'os_search_district'
    | 'os_state'
    | 'os_search_leg'
    | 'os_detail_leg'
    | 'os_metaOverview'
    | 'test'
    | 'raw_gql_jurisdiction'
    | 'raw_gql_organization'
    | 'raw_gql_legislator'
    | 'raw_gql_bill'

export interface MetaRecord<T> {
    name: RecordType // singular
    names: string // plurals
    describe(instance: T): KeySet // create string of record keys and other info id'ing the instance for humans
}


/*
    GRAPHQL
 */

export type GqlCursor = string

/*
    OPEN STATES AND THE LEGISLATIVE DOMAIN
 */

//
// Generic ///////////////////////

export type DocId = string  // usage ?
export type OCDId = string
export type OCDOrganizationId = string
export type OCDOrgClassification =
    OCDChamberId |
    'committee' |
    'executive' |
    'party' // never seen in jurisdiction, only on Person memberships

//
// State ///////////////////////////

export type StateId = string // 2-char, e.g. 'nh'
export type OCDJurisdictionId = string


//
// Chamber /////////////////////////

export type ChamberId = 'upper' | 'lower'
export type ChamberChar = 'l' | 'u'
export type OCDChamberId = 'upper' | 'lower' | 'legislature'

export function chamberOfOrg(classification:string, stateId:StateId): Maybe<ChamberId> {
    if ( classification === 'upper' || classification === 'lower') {
        return classification
    }
    if ( classification === 'legislature' && ['ne','dc'].includes(stateId)) {
        return 'upper'
    }
    return undefined
}


export interface StateChamber {
    stateId: StateId
    chamberId: ChamberId
}

export const chamberIdToChar = (id: ChamberId) => id.substr(0, 1)

export class ChamberType {

    public readonly char: ChamberChar

    constructor(readonly _id: ChamberId) {
        this.char = _id.substr(0, 1) as ChamberChar
    }

    get id(): ChamberId {
        return this._id
    }

    /* probably not used
        expandCensusGeoid(censusGeoid): string {
            return `sld${this.char}-${censusGeoid}`
        }
    */

    public toString(): string {
        return 'ChamberType ' + this.char
    }

    public get other(): ChamberType {
        // tslint:disable-next-line:no-use-before-declare
        return this.char === 'u' ? lowerChamberType : upperChamberType
    }
}

export const upperChamberType = new ChamberType('upper')
export const lowerChamberType = new ChamberType('lower')
export function getChamberType(id: ChamberId): ChamberType {
    const c = id.substr(0, 1)
    return c === 'u' ? upperChamberType : lowerChamberType
}

export type ChamberSet = { [key in ChamberId]?: Chamber } & Object

//
// Session /////////////////////////

export type SessionId = string

//
// Bill ////////////////////////////

export type OCDBillId = string // todo BillId doesn't exist anymore, fold together?
export type BillId = string // an OpenStates bill id, not a state-assigned ID
export type BillName = string // State-level bill ID, e.g. HB 101
export type BillSubject = string // http://docs.openstates.org/en/latest/policies/categorization.html#subject-categorization
export type BillType = string // http://docs.openstates.org/en/latest/policies/categorization.html#bill-types
export type BillActionType = string // http://docs.openstates.org/en/latest/policies/categorization.html#action-categorization

//
// Vote ///////////////////////////

export type VoteId = string
export type OCDVoteId = string
export type VoteResult = 'pass' | 'fail'
export type VoteOption = 'yes' | 'no' | 'other'

export enum VoteValue { NO = -1, OTHER = 0, YES = 1 }
export type VoteCountSet = { [k: number /*in VoteValue*/]: number }

export type NetVoteCount = number // sum of VoteValues; may be negative

export type Motion = string
export type MotionType =
    'AMEND' |
    'APPROVE_SECTION' |
    'END_POSTPONE' |
    'KILL' |
    'OVERRIDE_VETO' |
    'PASS' |
    'PASS_AMENDED' |
    'PASS_COC' |
    'PASS_CONCUR' |
    'POSTPONE' |
    'RECONSIDER' |
    'REREFER' |
    'SEND_TO_COC'

//
// Legislator, Party //////////////////////

export type OCDPersonId = string
export type LegiId = string
export type PartyId = string // todo consider restricting when current set is known
export type DemiParty = 'd' | 'r' | 'o'

export type OfficeType =  'capitol' | 'district'
export type CommitteeId = string

export type OCDPostId = string
export type Ordinal = number

//
// District ///////////////////////

export type OCDDivisionId = string

export type DistrictId = string
export type DistrictName = string // unique within state + chamber

export type DistrictTypeId = 'l' | 'u' | 'f'

export class DistrictType {

    constructor(readonly id: DistrictTypeId, readonly chamberType: ChamberType) {
    }

    public toString(): string {
        return 'DistrictType ' + this.id
    }

}

export const lowerDistrictType = new DistrictType('l', lowerChamberType)
export const upperDistrictType = new DistrictType('u', upperChamberType)
export const floterialDistrictType = new DistrictType('f', lowerChamberType)

// const districtTypes = [lowerDistrictType, upperDistrictType, floterialDistrictType]
export const districtTypesById: {[key in DistrictTypeId]:DistrictType} = {
    l: lowerDistrictType,
    u: upperDistrictType,
    f: floterialDistrictType,
}

export type LongLatArr = [number, number]
export type Geoid = string

