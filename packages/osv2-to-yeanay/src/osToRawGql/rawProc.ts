import { StateId, OCDDivisionId } from '@yeanay/yeanay-commons'
import { Logger } from 'winston'
import {
    RawGqlBill,
    RawGqlDistrict,
    RawGqlJurisdiction,
    RawGqlLegislator,
    RawGqlOrganization,
} from '../db/rawGql/rawGqlTypes'
import { ErrorSinkMaker, StageName } from '../validate/validate'
import * as val from '../validate/validate'
import { OpenStatesGqlApi } from './openStatesGqlApi'


export interface StateUpdateDates {
    latest_update: Date
    boundary_latest_update: Date
}

/**
 * Persistent store interface for storing raw OS data
 */
export interface IRawStoreWriter {


    getLatestStateUpdates(stateId: StateId): Promise<StateUpdateDates>
    setLatestStateUpdate(stateId: StateId, date: Date): Promise<void>
    setLatestBoundaryUpdate(stateId: StateId, date: Date): Promise<void>

    findState(stateId: StateId): Promise<RawGqlJurisdiction | null>

    getChambers(stateId: StateId): Promise<RawGqlOrganization[]>

    /*
        upsert here means: If record can't be found by primary key, insert this one.
        else shallow-merge existing record with this one.
     */
    upsertState(state: RawGqlJurisdiction): Promise<void>
    upsertOrg(org: RawGqlOrganization): Promise<void>

    findDistrict(divisionId: OCDDivisionId): Promise<RawGqlDistrict | null>
    upsertDistrict(district: RawGqlDistrict): Promise<void>

    upsertLegi(legi: RawGqlLegislator): Promise<void>
    upsertBill(bill: RawGqlBill): Promise<void>
}


export type RawProcConfig = {
    apiKey: string,
    logger: Logger,
    rawStore: IRawStoreWriter
    errorSinkMaker: ErrorSinkMaker
    job_start: Date
    since: Date
}

export class RawProc {

    protected static appName: string = 'sunlightToRaw'

    protected openStatesGqlApi: OpenStatesGqlApi
    protected logger: Logger
    protected rawStore: IRawStoreWriter
    protected errorSink: val.IErrorSink2

    constructor(protected readonly rawProcConfig: RawProcConfig, stage:StageName) {
        const { apiKey, logger, rawStore, errorSinkMaker } = rawProcConfig
        this.logger = logger
        this.openStatesGqlApi = new OpenStatesGqlApi(apiKey)
        this.errorSink = errorSinkMaker(RawProc.appName, stage)
        this.rawStore = rawStore
    }
}
