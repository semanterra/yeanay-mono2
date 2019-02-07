import { SchemaName } from '@yeanay/yeanay-daoist'
import { Config, getConfig } from '../config'
import { createNormal3Schema } from '../db/normal3/createNormal3Schema'

(async () => {
    try {
        const config: Config = getConfig()
        const schemaName: SchemaName = config.n3Schema
        await createNormal3Schema(config.dbConnectionConfig, schemaName)
        process.exit(0)
    } catch ( e ) {
        console.log('createNormal3SchemaScript failed:')
        console.log(e)
        process.exit(-1)

    }
})()


