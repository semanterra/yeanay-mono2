import { DbConnection, SchemaName } from '@yeanay/yeanay-daoist'
import { Logger } from 'winston'
import { ValErrorDao } from '../db/log/logDao'

import {
    N3BillDao,
    N3DistrictDao,
    N3LegiDao,
    N3LegiVoteDao,
    N3MemberRoleDao,
    N3StateGovDao,
    N3StateSessionDao,
    N3VoteDao,
} from '../db/normal3/normal3Daos'

import * as val from '../validate/validate'
import { LogEntryContext } from '../validate/validate'

export interface EnhancerConfig {
    conn: DbConnection,
    n3SchemaName: SchemaName,
    logger: Logger,
    loggerSchemaName: SchemaName,
    job_start: Date
}


export class Enhancer {

    protected static appName: string = 'enhancer'

    protected readonly logEntryContext: LogEntryContext
    protected readonly errorSink: val.IErrorSink2
    protected readonly n3StateDao: N3StateGovDao
    protected readonly logger: Logger

    protected readonly n3SessionDao: N3StateSessionDao

    protected readonly n3BillDao: N3BillDao
    protected readonly n3VoteDao: N3VoteDao
    protected readonly n3LegiVoteDao: N3LegiVoteDao

    protected readonly valErrorDao: ValErrorDao

    protected readonly n3DistrictDao: N3DistrictDao

    protected readonly n3LegiDao: N3LegiDao
    protected readonly n3MemberRoleDao: N3MemberRoleDao

    constructor(enhancerConfig: EnhancerConfig, stage: string) {
        const { conn, n3SchemaName, logger, loggerSchemaName, job_start } = enhancerConfig
        this.logger = logger
        this.logEntryContext = {app: Enhancer.appName, job_start, stage}

        this.valErrorDao = new ValErrorDao(conn, loggerSchemaName)
        this.errorSink = new val.ThrottledErrorSink(logger, this.valErrorDao, this.logEntryContext, 5)

        this.n3StateDao = new N3StateGovDao(conn, n3SchemaName)
        this.n3SessionDao = new N3StateSessionDao(conn, n3SchemaName)

        this.n3DistrictDao = new N3DistrictDao(conn, n3SchemaName)

        this.n3LegiDao = new N3LegiDao(conn, n3SchemaName)

        this.n3MemberRoleDao = new N3MemberRoleDao(conn, n3SchemaName)

        this.n3BillDao = new N3BillDao(conn, n3SchemaName)
        this.n3VoteDao = new N3VoteDao(conn, n3SchemaName)
        this.n3LegiVoteDao = new N3LegiVoteDao(conn, n3SchemaName)

    }



}
