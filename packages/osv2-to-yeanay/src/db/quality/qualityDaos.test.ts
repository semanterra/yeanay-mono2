import { Config, getConfig } from '../../config'

import { connectDb, DbConnection } from '@yeanay/yeanay-daoist'
import { createQualitySchema } from './createQualitySchema'
import { makeQContext } from './qcontext'

jest.setTimeout(5 * 60 * 1000)

const schemaName = 'quality_test'
let conn: DbConnection

beforeAll(async () => {

    console.log('before beforeAll')
    const config: Config = getConfig()
    await createQualitySchema(config.dbConnectionConfig, schemaName)
    conn = connectDb(config.dbConnectionConfig)
    console.log('after beforeAll')
})

describe('QContext', () => {

    test('construct all daos', () => {
        const qcontext = makeQContext(conn, schemaName)
        expect(qcontext).toBeDefined()
    })
})

afterAll(async () => {

    console.log('before afterAll')
    if ( conn ) {
        await conn.destroy()
    }
    console.log('after afterAll')
})
