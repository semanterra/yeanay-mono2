import { MetaRecord, StateId } from '@yeanay/yeanay-commons'

import { IErrorSink2, ValRecordError, VSeverity } from './validate'

export interface RecordValidatorOptions<T> {
    errorSink: IErrorSink2,
    metaRecord: MetaRecord<T>,
    stateId?: StateId,
    severity?: VSeverity,
}

export class RecordValidator<T> {

    public targetSeverity: VSeverity = VSeverity.None

    private readonly errorSink: IErrorSink2
    private _stateId: StateId
    private readonly metaRecord: MetaRecord<T>
    private _severity: VSeverity
    private targ?: T

    constructor(opts: RecordValidatorOptions<T>) {
        this.errorSink = opts.errorSink
        this._stateId = opts.stateId || ''
        this.metaRecord = opts.metaRecord
        this._severity = opts.severity || VSeverity.Record
    }

    // backlog dupe of in validate.ts - remove
    private static describeRecordError<T>(vErr: ValRecordError<T>): string {
        const description = vErr.record ? vErr.metaRecord.describe(vErr.record) : 'undefined'
        // tslint:disable-next-line:max-line-length
        return `${new Date().toISOString()}: severity ${VSeverity[vErr.severity]} in ${vErr.metaRecord.name} ${description} of ${vErr.stateId}: ${vErr.error.message}`
    }

    public cloneMeta<U>(meta: MetaRecord<U>): RecordValidator<U> {
        return new RecordValidator<U>({
            errorSink : this.errorSink,
            stateId   : this._stateId,
            metaRecord: meta,
            severity  : this._severity,
        })
    }

    // mutate validator
    public severity(s: VSeverity): RecordValidator<T> {
        this._severity = s
        return this
    }

    // do something with special severity, set back when done
    public withSeverity(s: VSeverity, f: (v: RecordValidator<T>) => void): RecordValidator<T> {
        const oldSeverity = this._severity
        this._severity = s
        try {
            f(this)
        } finally {
            this._severity = oldSeverity
        }
        return this
    }

    // mutate validator
    public stateId(i: StateId): RecordValidator<T> {
        this._stateId = i
        return this
    }

    // mutate validator
    public target(s: T): RecordValidator<T> {
        this.targ = s
        this.targetSeverity = VSeverity.None
        return this
    }

    public verify(f: (t: T) => string | null): RecordValidator<T> {
        if ( !this.targ ) {
            this.missingTargetError()
        } else {
            const msg: string | null = f(this.targ)
            if ( msg ) {
                this.report(new Error(msg))
            }
        }
        return this
    }

    /* true if target should be skipped */
    public get skip(): boolean {
        return this.targetSeverity >= VSeverity.Record
    }

    public verifyProps<K extends keyof T>(...propNames: K[]): RecordValidator<T> {
        return this.verify((targ) => {
            const badProps = propNames.filter((p) => targ[p] === undefined || targ[p] === null)
            switch ( true ) {
                case (badProps.length === 0):
                    return null
                case (badProps.length === 1):
                    return `missing property "${badProps[0]}"`
                default:
                    return `missing properties ${badProps.join(', ')}`
            }
        })
    }

    public verifySubprops<U, K extends keyof U>(sub: U, subName: string,
                                                ...propNames: K[]): RecordValidator<T> {
        return this.verify((_) => {
            const badProps = propNames.filter((p) => sub[p] === undefined || sub[p] === null)
            switch ( true ) {
                case (badProps.length === 0):
                    return null
                case (badProps.length === 1):
                    return `missing ${subName} property "${badProps[0]}"`
                default:
                    return `missing ${subName} properties ${badProps.join(', ')}`
            }
        })
    }

    public verifyStringLengths<K extends keyof T>(maxLength: number,
                                                  ...propNames: K[]): RecordValidator<T> {
        return this.verify((targ) => {
            const badProps: string[] = []
            for ( let p of propNames ) {
                const prop = targ[p]
                if ( Array.isArray(prop) ) {
                    for ( let el of prop ) {
                        if ( typeof el === 'string' ) {
                            const sel: string = el
                            if ( sel.length > maxLength ) {
                                badProps.push(`${p} (${sel.length}`)
                            }
                        }

                    }
                } else { // noinspection SuspiciousTypeOfGuard
                    if ( typeof prop === 'string' ) {
                                        const sprop: string = prop
                                        if ( sprop.length > maxLength ) {
                                            badProps.push(`${p} (${sprop.length}`)
                                        }
                                    }
                }
            }
            switch ( true ) {
                case (badProps.length === 0):
                    return null
                case (badProps.length === 1):
                    return `property too long: ${badProps[0]}`
                default:
                    return `properties too long: ${badProps.join(', ')}`
            }
        })
    }


    public verifyRange(value: number,
                       name: string,
                       low?: number,
                       high?: number): RecordValidator<T> {
        return this.verify((targ: T) => {
            // noinspection SuspiciousTypeOfGuard
            if ( typeof value === 'number' ) {
                switch ( true ) {
                    case (low !== undefined && low > value):
                        return `${name} is less than ${low}`
                    case (high !== undefined && high < value):
                        return `${name} is more than ${high}`
                    default:
                        return null
                }
            } else {
                return 'not a number'
            }

        })
    }

    public verifyRegex(value: string,
                       name: string,
                       pattern: RegExp): RecordValidator<T> {
        return this.verify((targ: T) => {
            // noinspection SuspiciousTypeOfGuard
            if ( typeof value === 'string' ) {
                return value.match(pattern) ? null : `${name} does not match ${pattern}`
            } else {
                return 'not a string'
            }

        })
    }

    public verifyStateId(value: StateId, name: string = 'state_id'): RecordValidator<T> {
        return this.verifyRegex(value, name, /^[a-z][a-z]$/)
    }

    private missingTargetError(): void {
        this.report(new Error('undefined target'))
    }

    private report(e: Error): void {
        if ( this._severity > this.targetSeverity ) {
            this.targetSeverity = this._severity
        }
        this.errorSink.handleRecordError(this.wrapRecordError(e))
        if ( this._severity >= VSeverity.Group ) {
            throw this.makeRecordErrorException(e)
        }
    }

    private wrapRecordError(e: Error): ValRecordError<T> {
        return {
            metaRecord: this.metaRecord,
            record    : this.targ!,
            stateId   : this._stateId,
            severity  : this._severity,
            error     : e,
        }
    }

    private makeRecordErrorException(error: Error): Error {
        return new Error(RecordValidator.describeRecordError(this.wrapRecordError(error)))
    }

}


