import { DbConnection, SchemaName } from '@yeanay/yeanay-daoist'
import { Logger } from 'winston'
import { ValErrorDao } from '../db/quality/logDao'
import {
    N3BillDao,
    N3DistrictDao,
    N3LegiDao, N3LegiVoteDao, N3MemberRoleDao,
    N3StateGovDao,
    N3StateSessionDao, N3VoteDao,
} from '../db/normal3/normal3Daos'
import { RawBillDao } from '../db/rawGql/rawBillDao'
import { RawJurisdictionDao } from '../db/rawGql/rawJurisdictionDao'
import { RawLegislatorDao } from '../db/rawGql/rawLegislatorDao'
import { RawOrganizationDao } from '../db/rawGql/rawOrganizationDao'
import { RawDistrictDao } from '../db/rawGql/rawDistrictDao'


import * as val from '../validate/validate'

import {LogEntryContext} from '../validate/validate'

export interface NProcConfig {
    conn: DbConnection,
    n3SchemaName: SchemaName,
    rawSchemaName: SchemaName,
    logger: Logger,
    loggerSchemaName: SchemaName,
    job_start: Date,
    since: Date,
}

export class NProc {

    protected static appName: string = 'rawToNormal'

    protected readonly logEntryContext: LogEntryContext
    protected readonly errorSink: val.IErrorSink2
    protected readonly logger: Logger
    protected readonly valErrorDao: ValErrorDao
    protected readonly rawJuriDao: RawJurisdictionDao
    protected readonly n3StateDao: N3StateGovDao
    protected readonly n3SessionDao: N3StateSessionDao
    protected readonly rawDistrictDao: RawDistrictDao
    protected readonly n3DistrictDao: N3DistrictDao
    protected readonly rawOrgDao: RawOrganizationDao
    protected readonly rawLegiDao: RawLegislatorDao
    protected readonly n3LegiDao: N3LegiDao
    protected readonly n3MemberRoleDao: N3MemberRoleDao
    protected readonly rawBillDao: RawBillDao
    protected readonly n3BillDao: N3BillDao
    protected readonly n3VoteDao: N3VoteDao
    protected readonly n3LegiVoteDao: N3LegiVoteDao
    protected readonly since: Date

    constructor(nprocConfig:NProcConfig, stage: string) {
        const { conn, n3SchemaName, rawSchemaName, logger, loggerSchemaName, job_start, since } = nprocConfig
        this.logger = logger
        this.logEntryContext = {app: NProc.appName, job_start, stage}

        this.valErrorDao = new ValErrorDao(conn, loggerSchemaName)
        this.errorSink = new val.ThrottledErrorSink(logger, this.valErrorDao, this.logEntryContext, 5)

        this.rawJuriDao = new RawJurisdictionDao(conn, rawSchemaName)
        this.n3StateDao = new N3StateGovDao(conn, n3SchemaName)
        this.n3SessionDao = new N3StateSessionDao(conn, n3SchemaName)

        this.rawDistrictDao = new RawDistrictDao(conn, rawSchemaName)
        this.n3DistrictDao = new N3DistrictDao(conn, n3SchemaName)

        this.rawOrgDao = new RawOrganizationDao(conn, rawSchemaName)
        this.rawLegiDao = new RawLegislatorDao(conn, rawSchemaName)
        this.n3LegiDao = new N3LegiDao(conn, n3SchemaName)

        this.n3MemberRoleDao = new N3MemberRoleDao(conn, n3SchemaName)

        this.rawBillDao = new RawBillDao(conn, rawSchemaName)
        this.n3BillDao = new N3BillDao(conn, n3SchemaName)
        this.n3VoteDao = new N3VoteDao(conn, n3SchemaName)
        this.n3LegiVoteDao = new N3LegiVoteDao(conn, n3SchemaName)

        this.since = since
    }
}

