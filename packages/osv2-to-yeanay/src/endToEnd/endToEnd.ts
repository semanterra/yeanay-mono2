import { StateId, Promise0 } from '@yeanay/yeanay-commons'
import { Config } from '../config'
import { makeQContext } from '../db/quality/qcontext'
import { makeTestLogger } from '../generic/log'
import { EnhancerConfig } from '../n3Enhancer/Enhancer'
// import {makeStateProcessor} from '../rawToNormal/rawToNormal'
import { osToRawState, OsToRawStateConfig } from '../osToRawGql/osToRawState'
import { VoteEnhancer } from '../n3Enhancer/VoteEnhancer'
import { Logger } from 'winston'
import { NProcConfig } from '../rawToNormal3/nProc'
import { fRawGqlToN3 } from '../rawToNormal3/rawGqlToN3'
import { DbConnection, connectDb, SchemaName } from '@yeanay/yeanay-daoist'

export interface ProcessorConfig extends NProcConfig, EnhancerConfig, OsToRawStateConfig {
    conn: DbConnection,
    qualitySchema: SchemaName
    logger: Logger,
    job_start: Date
    since: Date     // ignore anything from before this date, regardless when last updated
}

export function makeProcessorConfig(config: Config): ProcessorConfig {
    const conn = connectDb(config.dbConnectionConfig)
    const logger = makeTestLogger(['osv2-to-yeanay'])
    const job_start = new Date()

    const processorConfig: ProcessorConfig = {
        logger, job_start, conn,
        n3SchemaName    : config.n3Schema,
        loggerSchemaName: config.qualitySchema,
        qualitySchema:    config.qualitySchema,
        apiKey          : config.osApiKey,
        rawSchemaName   : config.rawSchema,
        since           : new Date(config.since),
    }
    return processorConfig
}

export async function endToEndState(state_id: StateId, config: ProcessorConfig, force: boolean,
                                    nobills: boolean): Promise0 {
    const qContext = makeQContext(config.conn, config.qualitySchema)

    console.log('starting sunlightToRawGql: ' + state_id)
    await osToRawState(state_id, config, force, nobills)
    console.log('starting rawToNormal: ' + state_id)
    const rawGqlToN3 = fRawGqlToN3(config, qContext)
    await rawGqlToN3(state_id)

    console.log('starting voteEnhancer: ' + state_id)
    const voteEnhancer = new VoteEnhancer(config, qContext)
    await voteEnhancer.processStateById(state_id)
}
