import * as osty from '@yeanay/yeanay-commons'
import { ChamberId, OCDDivisionId, StateId } from '@yeanay/yeanay-commons'
import { subWeeks } from 'date-fns'
import { RawGqlDistrict, RawOpenStatesBoundary } from '../db/rawGql/rawGqlTypes'
import { DistrictsQuery, PostQFields } from '../gql/types/gql-types'
import { makeJurisdictionId } from '../gql/types/ocdIds'
import { RecordValidator } from '../validate/recordValidator'
import * as val from '../validate/validate'
import { OpenStatesBoundaryApi } from './openStatesBoundaryApi'

import { RawProc, RawProcConfig } from './rawProc'

const metaRecord: osty.MetaRecord<PostQFields> = {
    describe: (instance: PostQFields) => ({ division_id: instance.division.id }),
    name    : 'os_district', names: 'os_districts',
}

type MergedRawDistrict = PostQFields & { num_seats: number }

export class DistrictProc extends RawProc {

    private boundaryApi: OpenStatesBoundaryApi

    private searchValor: RecordValidator<PostQFields> = new RecordValidator(
        {
            errorSink: this.errorSink,
            metaRecord,
            severity : val.VSeverity.Record,
        }
    )

    constructor(config: RawProcConfig) {
        super(config, 'district')
        this.boundaryApi = new OpenStatesBoundaryApi()
    }

    public async processState(id: osty.StateId): Promise<number> {
        this.logger.info(`getting districts for state ${id}`)

        const boundaryStaleBefore: Date = subWeeks(new Date(), 4)  // 4 weeks ago
        const { boundary_latest_update } = await this.rawStore.getLatestStateUpdates(id)
        const updatingBoundaries = boundary_latest_update < boundaryStaleBefore

        let nStateDivisions = 0
        let districtQuery: DistrictsQuery
        try {
            districtQuery = await this.openStatesGqlApi.getDistrictsP(makeJurisdictionId(id))
        } catch ( e ) {
            this.logger.error(e)
        }

        for ( let districtChamber of districtQuery!.jurisdiction.organizations.edges ) {

            const chamberId: ChamberId = districtChamber.node.classification

            const memberships = districtChamber.node.currentMemberships


            // const uniqueDivisions: LegiDivisionQFields[] = _.uniqBy<LegiDivisionQFields>(divisions,
            //     'id')
            for ( let membership of memberships ) {
                const post = membership.post
                const division = post.division
                nStateDivisions += 1
                if ( this.prevalidate(post) < val.VSeverity.Record ) {
                    try {

                        let boundary: RawOpenStatesBoundary | null = null
                        if ( updatingBoundaries ) {
                            boundary = await this.fetchBoundary(division.id)
                        } else {
                            const oldDistrict = await this.rawStore.findDistrict(division.id)
                            if ( oldDistrict ) {
                                boundary = oldDistrict.json.boundary
                            } else {
                                boundary = await this.fetchBoundary(division.id)
                            }
                        }

                        const dbAttrs = this.transform(post, id, chamberId, boundary)
                        await this.rawStore.upsertDistrict(dbAttrs)

                    } catch ( e ) {
                        this.logger.error(e)
                    }
                }
            }
        }

        if ( updatingBoundaries ) {
            await this.rawStore.setLatestBoundaryUpdate(id, this.rawProcConfig.job_start)
        }
        this.logger.info(
            `done getting ${nStateDivisions} districts for state ${id}`)
        return nStateDivisions
    }


    private async fetchBoundary(divisionId: OCDDivisionId): Promise<RawOpenStatesBoundary | null> {
        let boundary: RawOpenStatesBoundary | null = null
        try {
            boundary = (await this.boundaryApi.getBoundaryP(divisionId)).data
        } catch ( e ) {
            this.searchValor.verify(() => 'no boundary available for ' + divisionId)
        }
        return boundary
    }

// noinspection JSMethodCanBeStatic
    private transform(post: PostQFields, state_id: StateId, chamber_id: ChamberId,
                      boundary: RawOpenStatesBoundary | null): RawGqlDistrict {


        const district: RawGqlDistrict = {
            state_id,
            chamber_id,
            id  : post.division.id,
            json: { ...post, boundary },
        }
        return district
    }

    private prevalidate(data: PostQFields): val.VSeverity {
        this.searchValor.target(data)
            .verifySubprops(data.division, 'division', 'id')
        return this.searchValor.targetSeverity
    }


}
