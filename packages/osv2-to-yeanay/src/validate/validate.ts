// import VError from 'verror'
import {Logger} from 'winston'
import VError = require('verror')
import {MetaRecord, StateId, KeySet, WithoutId, PrimaryKey} from '@yeanay/yeanay-commons'
import {inspect} from 'util'
import {ValErrorDao} from '../db/log/logDao'
import { ValErrorLogEntry } from '../db/log/logSchema'

export enum VSeverity { // in increasing order of severity
    None = 0,
    RecordInfo,    // record-level
    GroupInfo, // aggregate results of multiple records, or start group
    Anomaly,    // no fail, not bad, but unusual
    Warning,    // no fail, but bad
    Record,     // fail the record
    Group,   // fail the record group (usually, the state)
    Fatal,      // fail the job
}


export interface ValError {
    stateId: StateId,
    severity: VSeverity,
    error: Error
}

export interface ValRecordError<T> extends ValError {
    metaRecord: MetaRecord<T>,
    record: T,
}

export interface IErrorSink2 {
    handleError(err: ValError): Promise<void>
    handleRecordError<T>(err: ValRecordError<T>): Promise<void>
}

export type AppName = string
export type StageName = string

export type ErrorSinkMaker = (app: AppName, stage:StageName) => IErrorSink2

function describeError2(vErr: ValError): string {
    const iset = vErr.stateId ? 'in ' + vErr.stateId : ''
    return `${new Date().toISOString()}: severity ${VSeverity[vErr.severity]} ${iset}: ${vErr.error.message}`
}
function describeRecordError2<T>(vErr: ValRecordError<T>): string {
    const description = vErr.record ? vErr.metaRecord.describe(vErr.record) : 'undefined'
    const desc2 = inspect(description)
    const iset = vErr.stateId ? 'of ' + vErr.stateId : ''
    const sev = `severity ${VSeverity[vErr.severity]}`
    return `${new Date().toISOString()}: ${sev} in ${vErr.metaRecord.name} ${desc2} ${iset}: ${vErr.error.message}`
}

export class SeverityError extends VError {
    constructor(readonly severity: VSeverity, error: Error, message: string) {
        super(error, `${severity}: ${message}`)
    }
}

export interface LogEntryContext {
    app: string,
    job_start: Date,
    stage: StageName
}

export class LoggingErrorSink2 implements IErrorSink2 {
    constructor(readonly logger: Logger, readonly valErrorDao: ValErrorDao,
                readonly logEntryContext: LogEntryContext) {
    }

    protected static mapSeverity(s: VSeverity): string {
        if (s < VSeverity.Warning) {
            return 'info'
        }
        if (s === VSeverity.Warning) {
            return 'warn'
        }
        return 'error'
    }

    public async handleError(valError: ValError): Promise<void> {
        const {stateId, severity} = valError
        this.logger.log(LoggingErrorSink2.mapSeverity(severity), describeError2(valError))

        const {app, job_start, stage} = this.logEntryContext
        const logEntry: WithoutId<ValErrorLogEntry, PrimaryKey> = {
            state_id: stateId,
            severity: VSeverity[severity].toString(),
            app,
            job_start,
            stage,
            error   : valError.error.message,
            record_type  : null,
            keys: {},
            value   : null,
        }
        await this.valErrorDao.insert(logEntry)
        const i = 1
    }

    public async handleRecordError<T>(valError: ValRecordError<T>): Promise<void> {
        const {stateId, severity, metaRecord} = valError

        this.logger.log(LoggingErrorSink2.mapSeverity(severity),
            describeRecordError2(valError))
        const {app, job_start, stage} = this.logEntryContext

        const keys: KeySet = valError.record ? metaRecord.describe(valError.record) : {}

        const logEntry: WithoutId<ValErrorLogEntry, PrimaryKey> = {
            state_id: stateId,
            severity: VSeverity[severity].toString(),
            app,
            job_start,
            stage,
            error   : valError.error.message,
            record_type: metaRecord.name,
            keys,
            value   : null,
        }
        await this.valErrorDao.insert(logEntry)
        const i = 1
    }
}

export class ThrottledErrorSink extends LoggingErrorSink2 {

    private map: Map<string, number> = new Map()

    constructor(logger: Logger, valErrorDao: ValErrorDao,
                logEntryContext: LogEntryContext,
                readonly throttleCount: number = 10) {
        super(logger, valErrorDao, logEntryContext)
    }

    private static errToKey<T>(valError: ValRecordError<T>): string {
        return `${valError.metaRecord.name}[${valError.stateId}]: ${valError.error.message}`
    }

    public async handleRecordError<T>(valError: ValRecordError<T>): Promise<void> {
        const mapKey = ThrottledErrorSink.errToKey(valError)
        const mapEntry = this.map.get(mapKey)
        const count = mapEntry ? mapEntry + 1 : 1
        this.map.set(mapKey, count)
        if (count <= this.throttleCount) {
            await super.handleRecordError(valError)
            if (count === this.throttleCount) {
                this.logger.info(`Suppressing further instances of ${mapKey}`)
            }
        }
    }
}
