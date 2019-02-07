import { RawGqlJurisdiction } from '../db/rawGql/rawGqlTypes'
import { MetaRecord, StateId } from '@yeanay/yeanay-commons'
import { JurisdictionQFields } from '../gql/types/gql-types'
import { parseJurisdictionId } from '../gql/types/ocdIds'

import { RecordValidator } from '../validate/recordValidator'
import * as val from '../validate/validate'
import { RawProc, RawProcConfig } from './rawProc'

const metaRecord: MetaRecord<RawGqlJurisdiction> = {
    describe: (instance: RawGqlJurisdiction) => ({ ocd_id: instance.id }),
    name    : 'raw_gql_jurisdiction',
    names   : 'raw_gql_jurisdictions',
}

// return true if stateId matches OCD Jurisdiction ID
const fIsJuriOfState = (s: StateId) =>
    (j: JurisdictionQFields) => (parseJurisdictionId(j.id!) === s)

export class JurisdictionProc extends RawProc {

    private valor: RecordValidator<RawGqlJurisdiction> = new RecordValidator(
        {
            errorSink: this.errorSink,
            metaRecord,
            severity : val.VSeverity.Record,
        }
    )

    // memoized
    private _juris?: Promise<JurisdictionQFields[]>

    constructor(config: RawProcConfig) {
        super(config, 'juris')
    }

    // todo move out to job cache
    public async getJurisP(): Promise<JurisdictionQFields[]> {
        if ( !this._juris ) {
            this._juris = this.openStatesGqlApi.getJurisdictionsP()
        }
        return this._juris!
    }

    public async processAll(): Promise<JurisdictionQFields[]> {
        const juris = await this.getJurisP()
        let iRet = 0
        for ( const juri of juris ) {
            await this.processJuri(juri)
            iRet += 1
        }
        return juris
    }


    public async processState(id: StateId): Promise<JurisdictionQFields> {
        const juris = await this.getJurisP()
        const isJuriOfState = fIsJuriOfState(id)
        const juri = juris.find(isJuriOfState)
        if ( juri ) {
            await this.processJuri(juri!)
            return juri!
        }
        throw new Error('jurisdictionProc.processState: no such state: ' + id)
    }

    private async processJuri(juri: JurisdictionQFields): Promise<Date|null|undefined> {
        const state_id = parseJurisdictionId(juri.id!)
        const dbJuri: RawGqlJurisdiction = {
            id      : juri.id!,
            state_id,
            json    : juri,
        }
        if ( this.prevalidate(dbJuri) < val.VSeverity.Record ) {
            await this.rawStore.upsertState(dbJuri)
        }
        const {latest_update} = await this.rawStore.getLatestStateUpdates(state_id)
        return latest_update
    }

    private prevalidate(juri: RawGqlJurisdiction): val.VSeverity {

        this.valor.target(juri)
            .verifyProps('id', 'state_id', 'json')
        return this.valor.targetSeverity
    }
}
