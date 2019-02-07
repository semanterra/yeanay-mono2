import {StateId, Promise0} from '@yeanay/yeanay-commons'
import { Config } from '../config'
import { makeTestLogger } from '../generic/log'
import { EnhancerConfig } from '../n3Enhancer/Enhancer'
// import {makeStateProcessor} from '../rawToNormal/rawToNormal'
import {osToRawState, OsToRawStateConfig} from '../osToRawGql/osToRawState'
import {VoteEnhancer} from '../n3Enhancer/VoteEnhancer'
import {Logger} from 'winston'
import { NProcConfig } from '../rawToNormal3/nProc'
import { fRawGqlToN3 } from '../rawToNormal3/rawGqlToN3'
import {DbConnection, connectDb} from '@yeanay/yeanay-daoist'

export interface ProcessorConfig extends NProcConfig, EnhancerConfig, OsToRawStateConfig {
    conn: DbConnection,
    logger: Logger,
    job_start: Date
    since: Date
}

export function makeProcessorConfig(config: Config): ProcessorConfig {
    const conn = connectDb(config.dbConnectionConfig)
    const logger = makeTestLogger(['osv2-to-yeanay'])
    const job_start = new Date()

    const processorConfig:ProcessorConfig = {
        logger, job_start, conn,
        n3SchemaName: config.n3Schema,
        loggerSchemaName: config.qualitySchema,
        apiKey: config.osApiKey,
        rawSchemaName: config.rawSchema,
        since: new Date(config.since),
    }
    return processorConfig
}

export async function endToEndState(state_id: StateId, config: ProcessorConfig): Promise0 {
    console.log('starting sunlightToRawGql: ' + state_id)
    await osToRawState(state_id, config)
    console.log('starting rawToNormal: ' + state_id)
    const rawGqlToN3 = fRawGqlToN3(config)
    await rawGqlToN3(state_id)

    console.log('starting voteEnhancer: ' + state_id)
    const voteEnhancer = new VoteEnhancer(config)
    await voteEnhancer.processStateById(state_id)
}
