import { OCDDivisionId, Promise0, StateId } from '@yeanay/yeanay-commons'
import { DbConnection, SchemaName } from '@yeanay/yeanay-daoist'
import { ValErrorDao } from '../db/log/logDao'
import { RawBillDao } from '../db/rawGql/rawBillDao'
import { RawDistrictDao } from '../db/rawGql/rawDistrictDao'
import {
    RawGqlBill,
    RawGqlDistrict,
    RawGqlJurisdiction,
    RawGqlLegislator,
    RawGqlOrganization,
} from '../db/rawGql/rawGqlTypes'
import { RawJurisdictionDao } from '../db/rawGql/rawJurisdictionDao'
import { RawLegislatorDao } from '../db/rawGql/rawLegislatorDao'
import { RawOrganizationDao } from '../db/rawGql/rawOrganizationDao'
import { makeJurisdictionId } from '../gql/types/ocdIds'
import { NProcConfig } from '../rawToNormal3/nProc'
import { ErrorSinkMaker, LoggingErrorSink2 } from '../validate/validate'
import { BillProc } from './billProc'
import { DistrictProc } from './districtProc'
import { JurisdictionProc } from './jurisdictionProc'
import { LegislatorProc } from './legislatorProc'
import { OrganizationProc } from './organizationProc'
import { IRawStoreWriter, RawProcConfig, StateUpdateDates } from './rawProc'

let memoJurisProc: JurisdictionProc | undefined

// todo move outside to make knex-free
class RawStore implements IRawStoreWriter {
    protected readonly jurisDao: RawJurisdictionDao
    protected readonly districtDao: RawDistrictDao
    protected readonly orgDao: RawOrganizationDao
    protected readonly legiDao: RawLegislatorDao
    protected readonly billDao: RawBillDao

    constructor(conn: DbConnection, rawSchemaName: SchemaName) {

        this.jurisDao = new RawJurisdictionDao(conn, rawSchemaName)
        this.orgDao = new RawOrganizationDao(conn, rawSchemaName)
        this.legiDao = new RawLegislatorDao(conn, rawSchemaName)
        this.districtDao = new RawDistrictDao(conn, rawSchemaName)
        this.billDao = new RawBillDao(conn, rawSchemaName)
    }

    public findState(stateId: StateId): Promise<RawGqlJurisdiction | null> {
        return this.jurisDao.findByStateId(stateId)
    }

    public async getLatestStateUpdates(stateId: StateId): Promise<StateUpdateDates> {
        const juri: RawGqlJurisdiction | null =
            await this.jurisDao.findByPrimaryKey(makeJurisdictionId((stateId)))
        const latest_update = (juri && juri.latest_update) || new Date(0)
        const boundary_latest_update = (juri && juri.boundary_latest_update) || new Date(0)
        return { latest_update, boundary_latest_update }
    }

    public async setLatestStateUpdate(stateId: StateId, date: Date): Promise<void> {
        await this.jurisDao.setLatestUpdate(stateId, date)
    }

    public async setLatestBoundaryUpdate(stateId: StateId, date: Date): Promise<void> {
        await this.jurisDao.setLatestBoundaryUpdate(stateId, date)
    }

    public async upsertState(state: RawGqlJurisdiction): Promise<void> {
        await this.jurisDao.upsert(state)
    }

    public findDistrict(divisionId: OCDDivisionId): Promise<RawGqlDistrict | null> {
        return this.districtDao.findByPrimaryKey(divisionId)
    }

    public async upsertDistrict(itemData: RawGqlDistrict): Promise<void> {
        await this.districtDao.upsert(itemData)
    }

    public getChambers(stateId: StateId): Promise<RawGqlOrganization[]> {
        return this.orgDao.getChambersOfState(stateId)
    }

    public async upsertLegi(legi: RawGqlLegislator): Promise<void> {
        await this.legiDao.upsert(legi)
    }

    public async upsertBill(bill: RawGqlBill): Promise<void> {
        await this.billDao.upsert(bill)
    }

    public async upsertOrg(org: RawGqlOrganization): Promise<void> {
        await this.orgDao.upsert(org)
    }
}

export interface OsToRawStateConfig extends NProcConfig {
    apiKey: string,
    rawSchemaName: string
    since: Date
}

export async function osToRawState(stateId: StateId, config: OsToRawStateConfig): Promise0 {

    const { apiKey, rawSchemaName, conn, n3SchemaName, logger, loggerSchemaName, job_start, since } = config

    // todo make input param to remove knex reference
    const rawStore = new RawStore(config.conn, config.rawSchemaName)

    const valErrorDao = new ValErrorDao(conn, loggerSchemaName)

    const errorSinkMaker: ErrorSinkMaker = (app, stage) => new LoggingErrorSink2(logger,
        valErrorDao,
        { app, job_start, stage })

    const rawProcConfig: RawProcConfig = {
        rawStore,
        apiKey,
        logger,
        errorSinkMaker,
        job_start,
        since,
    }

    const jurisdictionProc = memoJurisProc || (memoJurisProc = new JurisdictionProc(rawProcConfig))
    const { latest_update } = await rawStore.getLatestStateUpdates(stateId)
    const juri = await jurisdictionProc.processState(stateId)

    const organizationProc = new OrganizationProc(rawProcConfig)
    await organizationProc.processState(stateId)

    const districtProc = new DistrictProc(rawProcConfig)
    await districtProc.processState(stateId)

    const legislatorProc = new LegislatorProc(rawProcConfig)
    await legislatorProc.processState(stateId, latest_update>since?latest_update:since)

    const billProc = new BillProc(rawProcConfig)
    await billProc.processState(stateId, juri.name!, latest_update>since?latest_update:since)

    await rawStore.setLatestStateUpdate(stateId, job_start)
}
