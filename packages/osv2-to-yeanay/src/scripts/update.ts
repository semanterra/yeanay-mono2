/**
 * Created by edstaub on 6/3/17.
 */

import parseArgs = require('minimist')
import { Promise0 } from '@yeanay/yeanay-commons'
import { Config, getConfig } from '../config'
import { endToEndState, makeProcessorConfig, ProcessorConfig } from '../endToEnd/endToEnd'
import { stateIds } from '../generic/govStates'

const args = parseArgs(process.argv.slice(2))

async function update(): Promise0 {
    try {
        const config: Config = getConfig()
        const processorConfig: ProcessorConfig = makeProcessorConfig(config)

        const state = args['state']
        if ( state ) {
            await endToEndState(state, processorConfig)
        } else {
            for ( let aState of stateIds ) {
                await endToEndState(aState, processorConfig)
            }
        }
        process.exit(0)

    } catch ( e ) {
        console.log('update failed:')
        console.log(e)
        process.exit(-1)
    }
}

update()
