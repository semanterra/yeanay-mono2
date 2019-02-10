import { Consumer, GqlCursor, OCDJurisdictionId, OCDOrganizationId } from '@yeanay/yeanay-commons'
import { createApolloFetch } from 'apollo-fetch'
import { ApolloFetch, GraphQLRequest } from 'apollo-fetch/src/types'
import { fThrottle } from '../generic/throttler'
import { readQueryFileP } from '../gql/query/readQueryFileP'
import {
    BillQFields,
    BillsQuery,
    DistrictsQuery,
    FetchResultt,
    JurisdictionQFields,
    JurisdictionQuery,
    JurisdictionsQuery,
    lastCursor,
    LegislatorQFields,
    LegislatorsQuery,
    nodesOfCursoredEdges,
    nodesOfEdges,
    OrganizationQFields,
    OrganizationsQuery,
} from '../gql/types/gql-types'
import VError = require('verror')

const openStatesUrl = 'https://openStates.org/graphql'

const openStatesMinRequestTimeMs = 500
const initialBackoff = 500

const throttle = fThrottle(openStatesMinRequestTimeMs)

function delay(ms: number): Promise<void> {
    return new Promise((resolve, reject)=> {
        setTimeout(resolve, ms) // (A)
    })
}


function dateToGql(date?: Date): string | undefined {
    const ret = date ? date.toISOString() : undefined
    return ret
}

export class OpenStatesGqlApi {
    private readonly apolloFetch: ApolloFetch

    constructor(readonly apikey: string) {
        this.apikey = apikey

        const apolloFetch = createApolloFetch({ uri: openStatesUrl })
        apolloFetch.use(({ request, options }, next) => {
            if ( !options.headers ) {
                options.headers = {}  // Create the headers object if needed.
            }
            options.headers['X-API-KEY'] = apikey

            next()
        })
        this.apolloFetch = apolloFetch
    }
    public async getJurisdictionsP(): Promise<JurisdictionQFields[]> {
        try {
            const query = await readQueryFileP('jurisdictionsQuery')
            const response = await this.getP<JurisdictionsQuery>({ query })
            return [...nodesOfEdges(response.jurisdictions)]
        } catch ( e ) {
            throw new VError(e, 'getJurisdictionsP')
        }
    }

    public async getJurisdictionP(stateId: OCDJurisdictionId): Promise<JurisdictionQFields> {
        try {
            const query = await readQueryFileP('jurisdictionQuery')
            const response = await this.getP<JurisdictionQuery>({
                query,
                variables: { ocd_state_id: stateId },
            })
            return response.jurisdiction
        } catch ( e ) {
            throw new VError(e, 'getJurisdictionsP')
        }
    }

    public async getDistrictsP(stateId: OCDJurisdictionId): Promise<DistrictsQuery> {
        try {
            const query = await readQueryFileP('districtsQuery')
            const response = await this.getP<DistrictsQuery>({
                query,
                variables: { ocd_state_id: stateId },
            })
            return response
        } catch ( e ) {
            throw new VError(e, 'getJurisdictionsP')
        }
    }

    // recursive implementation; just call with stateId
    public async getOrganizationsP(stateId: OCDJurisdictionId,
                                   after: GqlCursor | undefined = undefined,
                                   accum: OrganizationQFields[] = []
    ): Promise<OrganizationQFields[]> {
        try {
            const query = await readQueryFileP('organizationsQuery')
            const response = await this.getP<OrganizationsQuery>({
                query,
                variables: { ocd_state_id: stateId, after },
            })
            const orgs = [...nodesOfEdges(response.jurisdiction.organizations)]
            const nextAfter = lastCursor(response.jurisdiction.organizations)
            if ( nextAfter ) {
                accum.push(...orgs)
                return await this.getOrganizationsP(stateId, nextAfter, accum)
            }
            else {
                return accum
            }

        } catch ( e ) {
            throw new VError(e, 'getOrganizationsP')
        }
    }

    // recursive implementation; just call with chamber organization ID
    public async getLegislatorsP(ocd_org_id: OCDOrganizationId /* chamber */,
                                 since?: Date,
                                 after: GqlCursor | undefined = undefined,
                                 accum: LegislatorQFields[] = []
    ): Promise<LegislatorQFields[]> {
        try {
            const query = await readQueryFileP('LegislatorsQuery')
            const response = await this.getP<LegislatorsQuery>({
                query,
                variables: { ocd_org_id, after, since: dateToGql(since), },
            })
            const legis = [...nodesOfEdges(response.people)]
            const nextAfter = lastCursor(response.people)
            if ( nextAfter ) {
                accum.push(...legis)
                return await this.getLegislatorsP(ocd_org_id, since, nextAfter, accum)
            }
            else {
                return accum
            }

        } catch ( e ) {
            throw new VError(e, 'getLegislatorsP')
        }
    }

    public async getBillsGenP(stateName: string,
                              consumer: Consumer<BillQFields>,
                              since?: Date
    ): Promise<void> {
        const ticker = fTicker('getBillsGenP')
        return this.getBillsGenImpl(stateName, consumer, ticker, since,)
    }

    // recursive implementation; just call with chamber organization ID
    public async countLegislatorsP(ocd_org_id: OCDOrganizationId /* chamber */,
                                   since?: Date,
                                   after: GqlCursor | undefined = undefined,
                                   accum: number = 0
    ): Promise<number> {
        try {
            const query = await readQueryFileP('legislatorCountQuery')
            const response = await this.getP<LegislatorsQuery>({
                query,
                variables: { ocd_org_id, after, since: dateToGql(since), },
            })
            const nlegis = [...nodesOfEdges(response.people)].length
            const nextAfter = lastCursor(response.people)
            if ( nextAfter ) {
                accum += nlegis
                return await this.countLegislatorsP(ocd_org_id, since, nextAfter, accum)
            }
            return accum

        } catch ( e ) {
            throw new VError(e, 'getLegislatorsP')
        }
    }

    // recursive implementation; just call with stateName and consumer
    public async countBillsP(stateName: string,
                             since?: Date,
                             after: GqlCursor | undefined = undefined,
                             accum: number = 0
    ): Promise<number> {
        try {
            const query = await readQueryFileP('BillCountQuery')
            const response = await this.getP<BillsQuery>({
                query,
                variables: { stateName, after, since: dateToGql(since), },
            })
            let cursor: string | undefined = undefined
            const nBills = [...nodesOfCursoredEdges(response.bills, (c) => cursor = c)].length
            if ( cursor ) {
                accum += nBills
                return await this.countBillsP(stateName, since, cursor, accum)
            }
            return accum
        } catch ( e ) {
            throw new VError(e, 'getBillsP')
        }
    }

    private async getBillsGenImpl(stateName: string,
                                  consumer: Consumer<BillQFields>,
                                  ticker: () => void,
                                  since?: Date,
                                  after: GqlCursor | undefined = undefined,
                                  accum: BillQFields[] = []
    ): Promise<void> {
        try {
            let nBills = 0
            const query = await readQueryFileP('BillsQuery')
            const response = await this.getP<BillsQuery>({
                query,
                variables: { stateName, after, since: dateToGql(since), },
            })
            let cursor: string | undefined = undefined
            const billGen = nodesOfCursoredEdges<BillQFields>(response.bills, (c) => cursor = c)
            for ( const bill of billGen ) {
                ticker()
                await consumer(bill)
            }
            if ( cursor ) {
                await this.getBillsGenImpl(stateName, consumer, ticker, since, cursor)
            }
        } catch ( e ) {
            throw new VError(e, 'getBillsP')
        }
    }

    /**
     * Common base for all graphql queries.  Throttles requests to avoid hammering OS server.
     * @param request : graphql query (query itself, operation name, variables)
     * @returns promise of graphql response (unwrapped from http)
     */

    private async getP<T>(request: GraphQLRequest): Promise<T> {
        const maxRetries = 4  // including first try
        const backoffMultiplier = 2

        let retries = 0
        let backoff = initialBackoff
        let error

        while ( retries < maxRetries ) {
            backoff *= backoffMultiplier
            try {
                const ret = await throttle(
                    async () => {
                        const fetched: FetchResultt<T> = await this.apolloFetch(request)
                        if ( fetched.errors ) {
                            const msg = 'getP: ' + fetched.errors
                            console.log(msg)
                            throw Error(msg)
                        }
                        return fetched.data
                    }
                )
                if ( retries > 0 ) {
                    console.log(`retry ${retries} succeeded`)
                }
                return ret
            } catch ( e ) { // retry
                console.log('retrying: ' + e.toString())
                retries += 1
                await delay(backoff)
                error = e
            }
        }
        throw error
    }

}

function fTicker(label: string, skip: number = 100): () => void {
    let tick: number = 0
    console.log('starting ' + label)
    return function ticker(): void {
        tick += 1
        if ( !(tick % skip) ) {
            console.log(label + ': ' + tick)
        }
    }
}
