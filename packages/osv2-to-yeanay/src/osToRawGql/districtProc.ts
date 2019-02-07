import * as _ from 'lodash'
import { RawGqlDistrict, RawOpenStatesBoundary } from '../db/rawGql/rawGqlTypes'
import { MultiMap } from '../generic/multimap'
import * as osty from '@yeanay/yeanay-commons'
import { ChamberId, OCDDivisionId, StateId } from '@yeanay/yeanay-commons'
import { DistrictsQuery, LegiDivisionQFields } from '../gql/types/gql-types'
import { makeJurisdictionId } from '../gql/types/ocdIds'
import { RecordValidator } from '../validate/recordValidator'
import * as val from '../validate/validate'
import { OpenStatesBoundaryApi } from './openStatesBoundaryApi'

import { RawProc, RawProcConfig } from './rawProc'
import { subWeeks } from 'date-fns'

const metaRecord: osty.MetaRecord<MergedRawDistrict> = {
    describe: (instance: MergedRawDistrict) => _.pick(instance, ['district_id']),
    name    : 'os_search_district', names: 'os search district',
}

type MergedRawDistrict = LegiDivisionQFields & {num_seats: number}

export class DistrictProc extends RawProc {

    private boundaryApi: OpenStatesBoundaryApi

    private searchValor: RecordValidator<MergedRawDistrict> = new RecordValidator(
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

            const divisions = districtChamber.node.currentMemberships.map((m) => m.post.division)

            // backlog temp hack to fake number of seats as number of found legislators in district
            const multiMap = new MultiMap<OCDDivisionId, LegiDivisionQFields>((d)=>d.id)
            divisions.forEach((d)=>multiMap.put(d))

            const uniqueDivisions: Iterable<MergedRawDistrict> =
                multiMap.mapBuckets<MergedRawDistrict>((arr:LegiDivisionQFields[])=> {
                const merged: MergedRawDistrict = {...arr[0], num_seats: arr.length}
                return merged
            })

            // const uniqueDivisions: LegiDivisionQFields[] = _.uniqBy<LegiDivisionQFields>(divisions,
            //     'id')
            for ( let division of uniqueDivisions ) {
                nStateDivisions +=1
                if ( this.prevalidate(division) < val.VSeverity.Record ) {
                    try {
                        // backlog get boundary only if there is none already or it hasn't been
                        //  updated in say, a month.  Store date in boundary json?
                        //  If old one is found that isn't too stale, re-store it in new record.
                        const boundary: RawOpenStatesBoundary = updatingBoundaries
                            ? (await this.boundaryApi.getBoundaryP(division.id)).data
                            : (await this.rawStore.findDistrict(division.id))!.json.boundary

                        const dbAttrs = this.transform(division, id, chamberId, boundary)
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


    // noinspection JSMethodCanBeStatic
    private transform(division: MergedRawDistrict, state_id: StateId, chamber_id: ChamberId,
                      boundary: RawOpenStatesBoundary): RawGqlDistrict {


        const district: RawGqlDistrict = {
            state_id,
            chamber_id,
            id: division.id,
            json       : { ...division, boundary },
        }
        return district
    }

    private prevalidate(data: MergedRawDistrict): val.VSeverity {
        this.searchValor.target(data)
            .verifyProps('name', 'id')
        return this.searchValor.targetSeverity
    }


}
