import {Dao, DbConnection, SchemaName } from '@yeanay/yeanay-daoist'
import { ValErrorLogEntry } from './logSchema'


export class ValErrorDao extends Dao<ValErrorLogEntry> {

    protected businessKeyPropNames: (keyof ValErrorLogEntry)[] = ['created_at']

    constructor(conn:DbConnection, schema:SchemaName) {
        super(conn, schema, 'validation_error_log', [
            'id',
            'ocd_id',
            'app',
            'job_start',
            'stage',
            'state_id',
            'severity',
            'error',
            'record_type',
            'keys',
            'value',
            'created_at',
        ])
    }

}
