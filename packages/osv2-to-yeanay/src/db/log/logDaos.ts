import { DbConnection, SchemaName } from '@yeanay/yeanay-daoist'
import { ValErrorDao } from './logDao'

export interface LogDaoSet {
    validationErrorLogDao: ValErrorDao
}

export function makeLogDaos(conn: DbConnection, schema: SchemaName): LogDaoSet {
    return {
        validationErrorLogDao: new ValErrorDao(conn, schema),
    }
}
