import { RawGqlLegislator } from '../db/rawGql/rawGqlTypes'
import { MetaRecord, OCDChamberId, StateId } from '@yeanay/yeanay-commons'
import { LegislatorQFields } from '../gql/types/gql-types'

import { RecordValidator } from '../validate/RecordValidator'
import * as val from '../validate/validate'
import { RawProc, RawProcConfig } from './rawProc'

const metaRecord: MetaRecord<RawGqlLegislator> = {
    describe: (instance: RawGqlLegislator) => ({ ocd_id: instance.id }),
    name    : 'raw_gql_legislator',
    names   : 'raw_gql_legislators',
}

export class LegislatorProc extends RawProc {

    private valor: RecordValidator<RawGqlLegislator> = new RecordValidator(
        {
            errorSink: this.errorSink,
            metaRecord,
            severity : val.VSeverity.Record,
        }
    )

    constructor(config: RawProcConfig) {
        super(config, 'legi')
    }

    public async processState(stateId: StateId, since: Date): Promise<void> {
        const chambers = await this.rawStore.getChambers(stateId)
        for ( const chamber of chambers ) {
            const legis = await this.openStatesGqlApi.getLegislatorsP(chamber.id, since)
            for ( const legi of legis ) {
                await this.processLegi(stateId, chamber.classification as OCDChamberId, legi)
            }
        }
    }

    public async processLegi(state_id: StateId, chamber_id: OCDChamberId,
                             legi: LegislatorQFields,): Promise<void> {
        const dbLegi: RawGqlLegislator = {
            id  : legi.id!,
            state_id,
            chamber_id,
            name: legi.name,
            json: legi,
        }
        if ( this.prevalidate(dbLegi) < val.VSeverity.Record ) {
            await this.rawStore.upsertLegi(dbLegi)
        }
    }

    private prevalidate(org: RawGqlLegislator): val.VSeverity {

        this.valor.target(org)
            .verifyProps('id', 'state_id', 'chamber_id', 'name', 'json')
        return this.valor.targetSeverity
    }
}
