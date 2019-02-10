import { IDed, OCDId, StateId, KeySet } from '@yeanay/yeanay-commons'


export interface ValErrorLogEntry extends IDed {
    ocd_id?: OCDId
    app: string,
    job_start: Date,
    stage: string,
    state_id: StateId,
    severity: string,
    error: string,
    record_type: string | null
    keys: KeySet
    value: string | null
    created_at?: Date
}

