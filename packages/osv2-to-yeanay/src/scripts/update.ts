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

        let start = 'aa'
        let end = 'zz'
        const state = args['state']

        if ( state ) {
            const splits = state.split('-')
            start = splits[0]
            if ( splits.length > 1 ) {
                end = splits[1]
            }
        }
        const force = !!args['force']
        const nobills = !!args['nobills']
        for ( let aState of stateIds ) {
            // todo temp hack skip already done
            if ( aState >= start && aState <= end ) {
                await endToEndState(aState, processorConfig, force, nobills)
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
