import {
    ChamberId,
    OCDBillId,
    OCDDivisionId,
    OCDJurisdictionId,
    OCDOrganizationId,
    OCDOrgClassification,
    OCDPersonId,
    StateId,
} from '@yeanay/yeanay-commons'
import {
    BillQFields,
    JurisdictionQFields,
    LegiDivisionQFields,
    LegislatorQFields,
    OrganizationQFields,
} from '../../gql/types/gql-types'

export interface RawGqlJurisdiction {
    id: OCDJurisdictionId
    state_id: StateId
    json: JurisdictionQFields
    latest_update?: Date
    boundary_latest_update?: Date
}


export interface RawGqlOrganization {
    id: OCDOrganizationId
    state_id: StateId
    jurisdiction_id: OCDJurisdictionId
    classification: OCDOrgClassification
    parent: OCDOrganizationId

    json: OrganizationQFields

}

export type ChamberIdMap = Map<OCDOrganizationId, ChamberId>

export interface RawGqlLegislator {
    id: OCDPersonId
    state_id: StateId
    chamber_id: 'upper' | 'lower' | 'legislature'
    name: string
    json: LegislatorQFields
}

export interface RawGqlBill {
    id: OCDBillId
    state_id: StateId
    identifier: string
    session: string
    json: BillQFields
}

export interface RawOpenStatesBoundary {
    extent: number[]
}

export interface RawGqlDistrict {
    state_id: StateId
    chamber_id: 'upper' | 'lower' | 'legislature'
    id: OCDDivisionId
    json: LegiDivisionQFields & { boundary: RawOpenStatesBoundary, num_seats: number}
}

