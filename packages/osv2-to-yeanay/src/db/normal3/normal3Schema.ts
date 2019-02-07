import {
    ChamberId,
    CommitteeId,
    DemiParty,
    LegiId,
    OCDDivisionId,
    OCDPersonId,
    OfficeType,
    PartyId,
    PrimaryKey,
    StateId,
    MotionType, VoteValue,
} from '@yeanay/yeanay-commons'
import { LongLatArr } from '@yeanay/yeanay-commons'

export interface N3LegiView {
    state_id: StateId | null
    legi_id: LegiId | null
    state_fk: PrimaryKey | null
    active: boolean | null
    chamber_id: ChamberId | null
    district_fk: PrimaryKey | null
    party_id: string | null
    email: string | null
    full_name: string | null
    first_name: string | null
    last_name: string | null
    sort_name: string | null
    suffixes: string | null
    ordinal: number | null
    photo_url: string | null
    url: string | null
    all_ids: Object | null
    os_created_at: Date | null
    os_updated_at: Date | null
    id: number | null
    created_at: Date | null
    updated_at: Date | null

}

export interface N3Bill {
    session_fk: PrimaryKey
    bill_id: string
    bill_name: string
    title: string
    alternate_titles: Object
    os_updated_at: Date
    subjects: Object
    bill_types: Object
    id: number
    created_at: Date | null
    updated_at: Date | null
}

export interface N3StateSession {
    session_id: string
    name: string | null
    // tslint:disable-next-line
    type: string
    start_date: Date | null
    end_date: Date | null
    id: number
    created_at: Date | null
    updated_at: Date | null
    state_fk: PrimaryKey

    first_vote_date: Date
    last_vote_date: Date

}

export interface N3MemberRoleView {
    legi_id: LegiId | null
    state_id: StateId | null
    legi_fk: PrimaryKey | null
    district_fk: PrimaryKey | null
    active: boolean | null
    chamber_id: ChamberId | null
    start_date: Date | null
    end_date: Date | null
    party_id: string | null
    id: number | null
    created_at: Date | null
    updated_at: Date | null

}

/*
export interface N3StateTerm {
    term_id: string
    start_year: number
    end_year: number
    id: number
    created_at: Date | null
    updated_at: Date | null
    state_fk: PrimaryKey

}
*/

export interface NormalDistrictRegion {
    center_lat: number,
    center_lon: number,
    lat_delta: number,
    lon_delta: number
}

export interface N3District {
    division_id: OCDDivisionId
    district_name: string
    state_fk: PrimaryKey
    chamber_id: ChamberId
    num_seats: number
    id: number
    created_at: Date | null
    updated_at: Date | null

    // knex handles top-level array stored in json poorly, so it's wrapped;
    // see https://github.com/tgriesser/knex/issues/1004
    bbox: {_:LongLatArr[]} | null
    is_floterial: boolean
    floterial_fk: number | null

}

export interface N3BillView {
    state_id: StateId | null
    term_id: string | null
    session_id: string | null
    session_fk: PrimaryKey | null
    bill_id: string | null
    bill_name: string | null
    title: string | null
    alternate_titles: Object | null
    chamber_id: ChamberId | null
    os_created_at: Date | null
    os_updated_at: Date | null
    scraped_subjects: Object | null
    subjects: Object | null
    bill_types: Object | null
    id: number | null
    created_at: Date | null
    updated_at: Date | null

}

export interface N3MemberRole {
    legi_fk: PrimaryKey
    district_fk: PrimaryKey
    chamber_id: ChamberId
    active: boolean
    start_date: Date | null
    end_date: Date | null
    party_id: string | null
    id: number
    created_at: Date | null
    updated_at: Date | null
}

export interface N3StateGov {
    state_id: StateId
    capitol_timezone: string
    feature_flags: string[]
    legislature_name: string
    legislature_url: string
    name: string
    id: number
    created_at: Date | null
    updated_at: Date | null

    first_vote_date: Date
    last_vote_date: Date
    latest_update: Date | null
}

export type VoteCountSet = { [k: number /*in VoteValue*/]: number }
export type PartyVoteCounts = { [k in DemiParty]: VoteCountSet }

export interface N3Vote {
    chamber_id: ChamberId
    date: Date
    vote_id: string
    motion: string
    motion_type: MotionType | null
    bill_fk: PrimaryKey
    yes_count: number
    no_count: number
    other_count: number
    votes: string | null
    id: number
    created_at: Date | null
    updated_at: Date | null

    session_fk: PrimaryKey
    passed: boolean
    rollcall: boolean
    partisanity: number
    demi_party_counts: { [key in DemiParty]: VoteCountSet }
    total_vote_count: number
    margin: number
}

export interface N3LegiVote {
    vote_fk: PrimaryKey
    legi_fk: PrimaryKey
    vote_value: VoteValue
}


export interface N3StateSessionView {
    state_id: StateId | null
    term_id: string | null
    session_id: string | null
    // tslint:disable-next-line:no-reserved-keywords
    type: string | null
    start_date: Date | null
    end_date: Date | null
    id: number | null
    created_at: Date | null
    updated_at: Date | null
    term_fk: PrimaryKey | null

}

export type N3LegiOffice = Partial<{
    // tslint:disable-next-line:no-reserved-keywords
    type: OfficeType
    address: string
    phone: string
    fax: string
    email: string
}>

export interface N3CommitteeAssignment {
    committee: string
    subcommittee: string
    committee_id: CommitteeId
    position: string
    chamber: ChamberId
    state: StateId
    start_date?: Date
    end_date?: Date
}

export interface N3Legi {
    legi_id: OCDPersonId
    state_fk: PrimaryKey
    chamber_id: ChamberId
    district_fk: PrimaryKey
    party_id: PartyId
    name: string
    sort_name: string
    last_name: string
    first_name: string
    ordinal: number
    image: string | null
    os_updated_at: Date
    id: number
    created_at: Date | null
    updated_at: Date | null

    demi_party?: DemiParty
    offices?: N3LegiOffice[]
    committees?: N3CommitteeAssignment[]
    partisanity?: number
    activeness?: number
    effectiveness?: number
    weighted_activeness?: number

}

export interface N3DistrictView {
    state_id: StateId | null
    district_id: string | null
    district_name: string | null
    state_fk: PrimaryKey | null
    chamber_id: ChamberId | null
    boundary_id: string | null
    num_seats: number | null
    id: number | null
    created_at: Date | null
    updated_at: Date | null

}

export interface N3VoteView {
    state_id: StateId | null
    chamber_id: ChamberId | null
    date: Date | null
    vote_id: string | null
    motion: string | null
    motion_type: MotionType | null
    bill_fk: PrimaryKey | null
    yes_count: number | null
    no_count: number | null
    other_count: number | null
    votes: string | null
    id: number | null
    created_at: Date | null
    updated_at: Date | null

    session_fk: PrimaryKey
    partisanity: number
    demi_party_counts: { [key in DemiParty]: VoteCountSet }
    total_vote_count: number
    margin: number

}
