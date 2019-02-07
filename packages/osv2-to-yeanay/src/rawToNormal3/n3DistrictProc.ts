import * as osty from '@yeanay/yeanay-commons'
import { chamberOfOrg, LongLatArr, PrimaryKey } from '@yeanay/yeanay-commons'
import { N3District, N3StateGov, } from '../db/normal3/normal3Schema'
import { RawGqlDistrict } from '../db/rawGql/rawGqlTypes'
import { RecordValidator } from '../validate/recordValidator'

import * as val from '../validate/validate'

import { RawFlot, rawFlots } from './nh-district-floterial'
import { NProc, NProcConfig } from './nProc'


const metaRecord: osty.MetaRecord<RawGqlDistrict> = {
    describe: (instance: RawGqlDistrict) => {
        const { id } = instance
        return { id }
    },
    name    : 'raw_district',
    names   : 'raw districts',
}

const assembleFlotId = (county: string, num: number) => `nh-lower-${county} ${num}`

function makeDistrictToFlotMap(rawFlotss: RawFlot[]): Map<string, string> {
    const flotMap = new Map<string, string>()
    rawFlotss.forEach((rawFlot) => flotMap.set(
        assembleFlotId(rawFlot.county, rawFlot.district),
        assembleFlotId(rawFlot.county, rawFlot.floterial)
    ))
    return flotMap
}

export class N3DistrictProc extends NProc {


    private readonly valor: RecordValidator<RawGqlDistrict>

    private districtIdMap: Map<string, osty.DistrictId>

    // set during district processing, then seats are counted down from legislators
    // to log underseats and overseats
    // backlog: get real number of seats from openStates!!!  This is count of legislators for now.
    private districtSeatsMap: Map<osty.DistrictId, number>

    constructor(nprocConfig:NProcConfig) {
        super(nprocConfig,'district' )

        this.valor = new RecordValidator(
            {
                errorSink: this.errorSink,
                metaRecord,
                severity : val.VSeverity.Record,
            }
        )
    }

    public async processState(state: N3StateGov): Promise<void> {
        const { state_id } = state
        this.valor.stateId(state_id)
        this.logger.info(`nDistrictsProc: starting state ${state_id}`)

        const rawDistricts: RawGqlDistrict[] = await this.rawDistrictDao.findByStateId(state_id)
        if ( !rawDistricts.length ) {
            this.errorSink.handleError({
                stateId : state_id,
                severity: val.VSeverity.Group,
                error   : new Error('no districts'),
            })
            return
        }
        this.districtIdMap = new Map()
        this.districtSeatsMap = new Map()

        for ( let rawDistrict of rawDistricts ) {
            await this.processDistrict(rawDistrict, state)
        }

        if ( state_id === 'nh' ) {

            const flotMap = makeDistrictToFlotMap(rawFlots)
            const dists = await this.n3DistrictDao.allOfState(state.id)
            for ( let dist of dists ) {
                const flotId = flotMap.get(dist.division_id)
                if ( flotId ) {
                    const flotDist = dists.find((d) => d.division_id === flotId)
                    if ( flotDist ) {
                        await this.n3DistrictDao.update(dist.id, { floterial_fk: flotDist.id })
                        await this.n3DistrictDao.update(flotDist.id, { is_floterial: true })
                    } else {
                        this.errorSink.handleError({
                            stateId : state_id,
                            severity: val.VSeverity.Anomaly,
                            error   : new Error('Missing floterial district'),
                        })
                    }
                }
            }
        }

        // todo count up seats and put sum for each chamber into state record

        this.logger.info(`nDistrictsProc: ending state ${state_id}`)
    }

    private async processDistrict(rawDistrict: RawGqlDistrict,
                                  state: N3StateGov): Promise<void> {
        this.prevalidate(rawDistrict)
        if ( !this.valor.skip ) {
            const nDistrict = await this.transformAndReplace(rawDistrict, state)
        }
    }

    private async transformAndReplace(rawDistrict: RawGqlDistrict,
                                      state: N3StateGov): Promise<PrimaryKey> {
        // add plain fields
        const extent = rawDistrict.json.boundary.extent
        const bbox: LongLatArr[] = [[extent[0], extent[1]], [extent[2], extent[3]]]
        const nDistrict: Partial<N3District> = {
            state_fk     : state.id,
            chamber_id   : chamberOfOrg(rawDistrict.chamber_id, state.state_id),
            division_id  : rawDistrict.id,
            district_name: rawDistrict.json.name,
            bbox: {_:bbox}, // wrapped to avoid Knex problem
            num_seats: rawDistrict.json.num_seats,
        }
//        const jsoned = { ...nDistrict, bbox: JSON.stringify(nDistrict.bbox)}
        const pkDistrict = (await this.n3DistrictDao.upsertByBusinessKey(nDistrict)).id

        return pkDistrict
    }

    private prevalidate(rawDistrict: RawGqlDistrict): val.VSeverity {

        this.valor.target(rawDistrict)
            .verifyProps(
                'chamber_id',
                'id'
            )
            .verifySubprops(rawDistrict.json, 'json',
                'name'
            )


        return this.valor.targetSeverity
    }
}

