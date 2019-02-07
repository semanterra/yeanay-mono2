import { FetchResult } from 'apollo-fetch'
import {
    ChamberId,
    DistrictId,
    GqlCursor, OCDBillId, OCDDivisionId,
    OCDJurisdictionId,
    OCDOrganizationId,
    OCDOrgClassification, OCDPersonId, OCDPostId, OCDVoteId,
    StateId, VoteOption, VoteResult,
    Consumer,
    OCDChamberId,
} from '@yeanay/yeanay-commons'

export interface FetchResultt<T> extends FetchResult {
    data: T
}

type Edges<NODE> = {
    edges: {
        node: NODE
    }[]
} | null

type CursoredEdges<NODE> = {
    edges: {
        cursor: GqlCursor
        node: NODE
    }[]
} | null


export interface LinkQFields {
    note: string | null
    url: string | null
}


export interface JurisdictionsQuery {
    jurisdictions: Edges<JurisdictionQFields>
}

export interface JurisdictionQuery {
    jurisdiction: JurisdictionQFields
}

export interface SessionFieldsFragment {
    name: string | null
    startDate: string | null
    endDate: string | null
    classification: string | null
    identifier: string | null
}

export interface JurisdictionQFields {
    id: string
    name: string
    url: string | null
    featureFlags: string[]
    legislativeSessions: Edges<SessionFieldsFragment>
}


export interface OrganizationQFields {
    id: OCDOrganizationId
    name: string
    parent: { id: OCDOrganizationId }
    classification: OCDOrgClassification
    image: string
    links: LinkQFields[]
}

export interface OrganizationsQuery {
    jurisdiction: {
        id: OCDJurisdictionId
        organizations: CursoredEdges<OrganizationQFields>

    }
}

export interface ContactQFields {
    note: string
    // tslint:disable-next-line:no-reserved-keywords
    type: string
    value: string
}

export interface OrganizationQReference {
    id: OCDOrganizationId
    name: string
    classification: OCDOrgClassification
}

export interface PostQFields {
    id: OCDPostId
    label: string
    role: string
    division: LegiDivisionQFields
}

export interface LegiDivisionQFields {
    id: OCDDivisionId
    name: string
}

export interface MembershipQFields {
    organization: OrganizationQReference
    post: PostQFields | null
}

export interface LegislatorQFields {
    name: string
    id: OCDPersonId
    sortName: string | null // usually blank
    familyName: string
    givenName: string | null
    image: string
    active: boolean
    contactDetails: ContactQFields[]
    currentMemberships: MembershipQFields[]
    oldMemberships: MembershipQFields[]
    updatedAt: string
}

export interface LegislatorsQuery {
    people: CursoredEdges<LegislatorQFields>
}

export interface BillQFields {
    title: string
    id: OCDBillId
    identifier: string
    classification: string[]
    otherIdentifiers: {
        identifier: string
        scheme: string
        note: string
    }[]
    otherTitles: {
        title: string
        note: string
    }[]
    fromOrganization: {
        classification: string
        id: string
        name: string
    }
    legislativeSession: {
        identifier: string
    }
    updatedAt: string
    subject?: string[]
    votes: Edges<VoteQFields>
}

export interface VoteQFields {
    id: OCDVoteId
    updatedAt: string
    identifier: string
    motionText: string
    motionClassification: string[]
    startDate: string
    endDate: string
    result: VoteResult
    organization: {
        id: OCDOrganizationId
        classification: OCDChamberId
        name: string
    }
    votes: LegiVoteQField[]
    counts: VoteCountValue[]
    actions: BillAction[]
    sources: { url: string, note: string }
}

export interface LegiVoteQField {
    option: VoteOption
    voter: { id: OCDPersonId }
    voterName: string
}

export interface VoteCountValue {
    option: VoteOption
    value: number
}

export interface BillAction {
    organization: {
        id: OCDOrganizationId
        classification: string
        name: string
    }
    description: string
    date: string
    classification: string
    order: number
    vote: { id: OCDVoteId }
}

export interface BillsQuery {
    bills: CursoredEdges<BillQFields>
}


export interface DistrictRestFields {
    id: DistrictId  // OpenStates ID
    abbr: StateId
    chamber: ChamberId

}

export interface DistrictsQuery {
    jurisdiction: {
        organizations: {
            edges: [
                {
                    node: {
                        classification: ChamberId
                        currentMemberships: [
                            {
                                post: {
                                    division: LegiDivisionQFields
                                }
                            }
                            ]
                    }
                }
            ]
        }
    }
}


export function* nodesOfCursoredEdges<T>(
    edgesWrapper: CursoredEdges<T> | undefined,
    lastCursorSink: Consumer<GqlCursor | undefined>
): IterableIterator<T> {
    let lasttCursor: GqlCursor | undefined = undefined
    if ( edgesWrapper ) {
        for ( const edge of edgesWrapper.edges ) {
            yield edge.node
            lasttCursor = edge.cursor
        }
    }
    lastCursorSink(lasttCursor)
}

export function* nodesOfEdges<T>(edgesWrapper?: Edges<T>): IterableIterator<T> {
    if ( edgesWrapper ) {
        for ( const edge of edgesWrapper.edges ) {
            yield edge.node
        }
    }
}

export function lastCursor<T>(edgesWrapper?: CursoredEdges<T>): GqlCursor | undefined {
    if ( edgesWrapper ) {
        const { edges } = edgesWrapper
        if ( edges.length ) {
            return edges[edges.length - 1].cursor
        } // else return undefined
    } // else return undefined
}
