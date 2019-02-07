import { DbConnectionConfig, SchemaName } from '@yeanay/yeanay-daoist'
import * as config from 'config'

export interface Config {
    dbConnectionConfig: DbConnectionConfig
    n3Schema: SchemaName
    qualitySchema: SchemaName
    rawSchema: SchemaName
    osApiKey: string
    since: string
}

export function getConfig(): Config {
    const theConfig: Config = config
    const missing: string[] = []
    if ( !theConfig.dbConnectionConfig.connection!['user'] ) {
        missing.push('dbConnectionConfig.user (YN_DB_USER)')
    }
    if ( !theConfig.osApiKey ) {
        missing.push('osApiKey (YN_OS_API_KEY)')
    }
    if ( missing.length ) {
        throw new Error('Config is missing:' + missing.join(','))
    }
    return theConfig
}
/*

export const config = {
    yeanay1Postgres: {
        database: 'yeanay1',
        username: 'yeanay1',
        password: 'yeanay1',
        params: {
            host: 'localhost',
            dialect: 'postgres',
            pool: {
                max: 5,
                min: 0,
                idle: 10000,
            },
            logging: false,
        },
    },

    postgresUrl: 'postgresql://localhost:5432/yeanay1',
}

*/
