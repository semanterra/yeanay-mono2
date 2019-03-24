import { Config, getConfig } from '../config'

import {connectDb, DbConnection} from '@yeanay/yeanay-daoist'
import { createQualitySchema } from '../db/quality/createQualitySchema'
import { makeQContext, makeStateReporter, QContext } from '../db/quality/qcontext'
import { IStateReporter, MetricDef, stateReporterDefs } from './ireporter'
import { StateReporter } from './reporterImpl'

jest.setTimeout(5 * 60 * 1000)


const schemaName = 'quality_test'

const now = new Date()

let conn:DbConnection
let qcontext: QContext
beforeAll(async () => {
    console.log('before beforeAll')
    const config: Config = getConfig()
    await createQualitySchema(config.dbConnectionConfig, schemaName)
    conn = connectDb(config.dbConnectionConfig)
    qcontext = makeQContext(conn, schemaName)
    console.log('after beforeAll')
})


describe('StateReporter', async () => {
    test('create and reopen', async () => {

        const stateReporter1 =
            await makeStateReporter('state_oid', 'nh', true,qcontext)

        const stateReporter1a =
            await makeStateReporter('state_oid', 'nh', false,qcontext)

        expect(stateReporter1a._staticDTO.id).toBe(stateReporter1._staticDTO.id)
        expect(stateReporter1a._snapDTO.id).toBe(stateReporter1._snapDTO.id)
    })
    test('create and recreate', async () => {

        const stateReporter1 =
            await makeStateReporter('state_oid2', 'sc', true,qcontext)

        const stateReporter1a =
            await makeStateReporter('state_oid2', 'sc', true,qcontext)

        expect(stateReporter1a._staticDTO.id).toBe(stateReporter1._staticDTO.id)
        expect(stateReporter1a._snapDTO.id).not.toBe(stateReporter1._snapDTO.id)
    })
    test('record data', async() => {
        const stateReporter1 =
            await makeStateReporter('state_oid3', '3', true,qcontext)
        stateReporter1.flag(stateReporterDefs.flag.testFlag0, true)
        stateReporter1.int(stateReporterDefs.int.testInt0,1000)
        stateReporter1.inc(stateReporterDefs.int.testInt1)
        stateReporter1.boxPlot(stateReporterDefs.boxPlot.testBoxPlot0, [1,2,3,4,5,6])
        stateReporter1.date(stateReporterDefs.date.testDate0, now)
        stateReporter1.float(stateReporterDefs.float.testFloat0, 1.23)
        stateReporter1.done()

        const stateReporter1a =
            await makeStateReporter('state_oid3', '3', false,qcontext)

        expect(stateReporter1a._snapDTO.bools[stateReporterDefs.flag.testFlag0.index]).toEqual(true)
        expect(stateReporter1a._snapDTO.ints[stateReporterDefs.int.testInt0.index]).toEqual(1000)
        expect(stateReporter1a._snapDTO.ints[stateReporterDefs.int.testInt1.index]).toEqual(1)
        expect(stateReporter1a._snapDTO.boxPlots[stateReporterDefs.boxPlot.testBoxPlot0.index])
            .toEqual([1,2,3,4,5,6])
        expect(stateReporter1a._snapDTO.timeStamps[stateReporterDefs.date.testDate0.index])
            .toEqual(now)
        expect(stateReporter1a._snapDTO.floats[stateReporterDefs.float.testFloat0.index])
            .toEqual(true)
    })
})

afterAll(async () => {
    console.log('before afterAll')
    if ( conn ) {
        await conn.destroy()
    }
    console.log('after afterAll')
})
