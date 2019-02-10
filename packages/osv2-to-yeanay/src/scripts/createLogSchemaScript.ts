import { SchemaName } from '@yeanay/yeanay-daoist'
import { Config, getConfig } from '../config'
import { createQualitySchema } from '../db/quality/createQualitySchema'

(async () => {
    try {
        const config: Config = getConfig()
        const schemaName: SchemaName = config.qualitySchema
        await createQualitySchema(config.dbConnectionConfig, schemaName)
        process.exit(0)
    } catch ( e ) {
        console.log('createNormal3SchemaScript failed:')
        console.log(e)
        process.exit(-1)

    }
})()

