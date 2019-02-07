import {IErrorSink2, ValError, ValRecordError} from './validate'

export class SinkSummarizer implements IErrorSink2 {

    public worstError?: ValError = undefined
    public lastError?: ValError = undefined
    public errorCount: 0

    constructor(readonly sink: IErrorSink2) {
    }

    public async handleError(err: ValError): Promise<void> {
        if (!this.worstError || err.severity > this.worstError.severity) {
            this.worstError = err
        }
        this.lastError = err
        this.errorCount += 1
        await this.sink.handleError(err)
    }

    public async handleRecordError<T>(err: ValRecordError<T>): Promise<void> {
        if (!this.worstError || err.severity > this.worstError.severity) {
            this.worstError = err
        }
        this.lastError = err
        this.errorCount += 1
        await this.sink.handleRecordError(err)
    }

    public resetSummary(): void {
        this.worstError = this.lastError = undefined
        this.errorCount = 0
    }

}
