import {
    IDed,
    NullOr,
    PrimaryKey,
    StateId,
    ChamberId,
    SessionId,
    OCDDivisionId,
} from '@yeanay/yeanay-commons'

export interface QStaticDTO extends IDed {
    oid: string
    name: string

}

export type BoxPlot = number[] // [6]: min, 1st quartile, median, mean, 3rd quartile, max

export interface QSnapMetrics {
    bools: NullOr<Boolean>[]
    ints: NullOr<number>[]
    floats: NullOr<number>[]
    boxPlots: NullOr<BoxPlot>[]
    timeStamps: NullOr<Date>[]
}

export interface QSnapDTO extends QSnapMetrics, IDed {
}

// STATE


export interface QStaticStateDTO extends QStaticDTO {
    name: StateId

}


export interface QSnapStateDTO extends QSnapDTO {
    static_gov_state_fk: PrimaryKey
    latest_update: Date
}


// CHAMBER

export interface QStaticChamberDTO extends QStaticDTO {
    static_gov_state_fk: PrimaryKey
    name: ChamberId
}


export interface QSnapChamberDTO extends QSnapDTO {
    snap_gov_state_fk: PrimaryKey
    static_chamber_fk: PrimaryKey
}


// BILL

export interface QStaticBillDTO extends QStaticDTO {
    static_gov_state_fk: PrimaryKey
    session: SessionId
}


export interface QSnapBillDTO extends QSnapDTO {
    snap_gov_state_fk: PrimaryKey
    static_bill_fk: PrimaryKey
}


// LEGI

export interface QStaticLegiDTO extends QStaticDTO {
    static_gov_state_fk: PrimaryKey

}


export interface QSnapLegiDTO extends QSnapDTO {
    snap_gov_state_fk: PrimaryKey
    static_legi_fk: PrimaryKey
}


// VOTE

export interface QStaticVoteDTO extends QStaticDTO {
    static_bill_fk: PrimaryKey
    static_chamber_fk: PrimaryKey
}


export interface QSnapVoteDTO extends QSnapDTO {
    snap_gov_state_fk: PrimaryKey
    static_vote_fk: PrimaryKey
}


// POST

export interface QStaticPostDTO extends QStaticDTO {
    division_oid: OCDDivisionId
    division_name: string
    static_chamber_fk: PrimaryKey

}


export interface QSnapPostDTO extends QSnapDTO {
    snap_gov_state_fk: PrimaryKey
    static_post_fk: PrimaryKey
}


// POSTING

export interface QStaticPostingDTO extends QStaticDTO {
    static_post_fk: PrimaryKey
    static_legi_fk: PrimaryKey
}


export interface QSnapPostingDTO extends QSnapDTO {
    snap_gov_state_fk: PrimaryKey
    static_posting_fk: PrimaryKey
}

