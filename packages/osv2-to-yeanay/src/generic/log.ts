import { Logger } from 'winston'
import * as winston from 'winston'
import * as Transport from 'winston-transport'
import { VError } from 'verror'
import { MultiCauseError } from './async'

// todo tighten up all field declarations
interface ExceptionMeta {
    // tslint:disable-next-line
    type: string
    level: string
    errors?: any[]
    cause?: ExceptionMeta
}

function exceptionMeta(exception: Error): ExceptionMeta {
    const origCause = VError.cause(exception)
    const cause = origCause ? exceptionMeta(origCause) : undefined
    const level = exception['level'] || 'error'
    const ret: ExceptionMeta = { type: 'Error', level }
    if ( exception instanceof MultiCauseError ) {
        ret.errors = exception.errors.map(VError.fullStack)
    }
    if ( cause ) {
        ret.cause = cause
    }
    return ret
}

type FTransports = (tags: string[]) => Transport[]

function makeProductionTransports(tags: string[]): Transport[] {
    return [
        new winston.transports.Console(),
    ]
}

function makeTestTransports(tags: string[]): Transport[] {
    return [
        new winston.transports.Console(/*{ json: false, level: 'debug' }*/),
    ]
}

function makeALogger(fTransports: FTransports, tags: string[]): Logger {
    const levels = {
        debug: 5,
        trace: 4,
        info : 3,
        warn : 2,
        error: 1,
        fail : 0,
    }
    const colors = {
        debug: 'green',
        trace: 'green',
        info : 'blue',
        warn : 'yellow',
        error: 'orange',
        fail : 'red',
    }

    winston.addColors(colors)
    const logger = winston.createLogger({
        transports: fTransports(tags),
        levels,
    })
    logger['exception'] = function (exception: Error): Logger {
        const msg = VError.fullStack(exception)
        const meta = exceptionMeta(exception)
        return this.error(msg, meta)
    }
    winston.addColors(colors)
    return logger
}

export function makeLogger(tags: string[]): Logger {
    return makeALogger(makeProductionTransports, tags)
}

export function makeTestLogger(tags: string[]): Logger {
    return makeALogger(makeTestTransports, tags)
}

