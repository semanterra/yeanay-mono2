import { SchemaName } from '@yeanay/yeanay-daoist'
import { Config, getConfig } from '../config'
import { createRawGqlSchema } from '../db/rawGql/createRawGqlSchema'

(async () => {
    try {
        const config: Config = getConfig()
        const schemaName: SchemaName = config.rawSchema
        await createRawGqlSchema(config.dbConnectionConfig, schemaName)
        process.exit(0)
    } catch ( e ) {
        console.log('createNormal3SchemaScript failed:')
        console.log(e)
        process.exit(-1)

    }
})()

