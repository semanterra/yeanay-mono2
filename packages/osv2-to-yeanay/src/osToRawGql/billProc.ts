import { RawGqlBill } from '../db/rawGql/rawGqlTypes'
import { MetaRecord, StateId } from '@yeanay/yeanay-commons'
import { BillQFields } from '../gql/types/gql-types'

import { RecordValidator } from '../validate/recordValidator'
import * as val from '../validate/validate'
import { RawProc, RawProcConfig } from './rawProc'

const metaRecord: MetaRecord<RawGqlBill> = {
    describe: (instance: RawGqlBill) => ({ ocd_id: instance.id }),
    name    : 'raw_gql_bill',
    names   : 'raw_gql_bills',
}


export class BillProc extends RawProc {

    private valor: RecordValidator<RawGqlBill> = new RecordValidator(
        {
            errorSink: this.errorSink,
            metaRecord,
            severity : val.VSeverity.Record,
        }
    )

    constructor(config: RawProcConfig) {
        super(config, 'bill')
    }

    public async processState(stateId: StateId, stateName: string, since: Date): Promise<void> {
        // This may be a lot of RAM, consider streaming (e.g. generator)
        await this.openStatesGqlApi.getBillsGenP(
            stateName, async (bill) => this.processBill(stateId, bill), since)
    }

    public async processBill(state_id: StateId,
                             bill: BillQFields,): Promise<void> {
        const dbBill: RawGqlBill = {
            id        : bill.id!,
            state_id,
            identifier: bill.identifier,
            session   : bill.legislativeSession.identifier,
            json      : bill,
        }
        if ( this.prevalidate(dbBill) < val.VSeverity.Record ) {
            await this.rawStore.upsertBill(dbBill)
        }
    }

    private prevalidate(bill: RawGqlBill): val.VSeverity {

        this.valor.target(bill)
            .verifyProps('id', 'state_id', 'identifier', 'session', 'json')
            .verifyStateId(bill.state_id)
        return this.valor.targetSeverity
    }
}
