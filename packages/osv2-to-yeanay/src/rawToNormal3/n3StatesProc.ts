import * as osty from '@yeanay/yeanay-commons'
import { ChamberSet, PrimaryKey } from '@yeanay/yeanay-commons'
import { N3StateGov } from '../db/normal3/normal3Schema'
import { RawGqlJurisdiction } from '../db/rawGql/rawGqlTypes'
import { JurisdictionQFields, nodesOfEdges, SessionFieldsFragment } from '../gql/types/gql-types'

import { RecordValidator } from '../validate/RecordValidator'

import * as val from '../validate/validate'
import { v1StateData } from './fromV1'

import { NProc, NProcConfig } from './nProc'

const earliestYearOfInterest = 2017

const metaRecord: osty.MetaRecord<RawGqlJurisdiction> = {
    describe: (instance: RawGqlJurisdiction) => ({ state_id: instance.state_id }),
    name    : 'raw_state',
    names   : 'raw states',
}

// fixed data incorporated in browser source.
interface Spewage {
    chambers: ChamberSet
}

function denull<T>(x: T | null): T | undefined {
    return x === null ? undefined : x
}

function strToDate(s: string | null): Date | null {
    if ( !s ) {
        return null
    }
    return new Date(s)
}

export class N3StatesProc extends NProc {

    private readonly valor: RecordValidator<RawGqlJurisdiction>

    constructor(nprocConfig:NProcConfig) {
        super(nprocConfig, 'state' )

        this.valor = new RecordValidator(
            {
                errorSink: this.errorSink,
                metaRecord,
                severity : val.VSeverity.Record,
            }
        )
    }

    public async process(state_id: osty.StateId): Promise<void> {
        const rawState = await this.rawJuriDao.findByStateId(state_id)

        if ( rawState ) {
            if ( this.prevalidate(rawState) < val.VSeverity.Record ) {
                await this.transformAndReplace(rawState)
            }
        }
    }

    public async deleteState(state_id: osty.StateId): Promise<number> {
        return this.n3StateDao.deleteByStateId(state_id)
    }

    public async getState(state_id: osty.StateId): Promise<N3StateGov | null> {
        return this.n3StateDao.findByStateId(state_id)
    }

    private async transformAndReplace(rawState: RawGqlJurisdiction): Promise<number> {


        // add plain fields
        const json: JurisdictionQFields = rawState.json
        const v1State = v1StateData[rawState.state_id]
        const row: N3StateGov = await this.n3StateDao.upsert({
            state_id        : rawState.state_id,
            name            : json.name,
            feature_flags   : json.featureFlags,
            latest_update   : new Date(0),    // not yet available
            capitol_timezone: v1State.capitol_timezone!,   // prevalidated
            legislature_name: v1State.legislature_name!,   // prevalidated
            legislature_url : v1State.legislature_url!,    // prevalidated
        }, 'state_id')

        for ( const sess of nodesOfEdges(json.legislativeSessions!) ) {
            await this.transformSession(sess, row.id)
        }

        return row.id
    }

    /*
        private async createBiennia(stateId:StateId) {
            const even_year_biennia = v1StateData[stateId].even_year_biennia
            const thisYear = new Date().getFullYear()
            for ( let y:number = earliestYearOfInterest; y++; y <= thisYear) {
                if ( ((y % 2)==0) == even_year_biennia ) {

                }
            }

        }
    */

    private async transformSession(session: SessionFieldsFragment,
                                   state_fk: PrimaryKey): Promise<PrimaryKey> {
        const sessionPk = (await this.n3SessionDao.upsert({
            session_id: session.identifier!,
            name      : session.name,
            type      : session.classification!,
            start_date: strToDate(session.startDate),
            end_date  : strToDate(session.endDate),
            state_fk,
        }, 'state_fk, session_id')).id
        return sessionPk
    }


    // a checker needs

    private prevalidate(rawState: RawGqlJurisdiction): val.VSeverity {
        const json = rawState.json
        this.valor.stateId(rawState.state_id)
        this.valor.target(rawState)
            .verifySubprops(json, 'json',
                'id',                           // tslint:disable-line:align
                'name',
                'featureFlags',
                'name',
                'url'
            )

        this.valor.verifyRange(json.legislativeSessions!.edges.length, 'terms', 1)

        const sessionNames: Set<string> = new Set()

        return this.valor.targetSeverity

    }
}
