import { Promise0, StateId } from '@yeanay/yeanay-commons'
import { N3StateGov, } from '../db/normal3/normal3Schema'
import { N3BillsProc } from './n3BillProc'
import { N3DistrictProc } from './n3DistrictProc'
import { N3LegisProc } from './n3LegisProc'

import { N3StatesProc } from './n3StatesProc'
import { NProcConfig } from './nProc'


export function fRawGqlToN3(nprocConfig:NProcConfig): (state_id: StateId)=>Promise0 {
    try {

        const n3StatesProc = new N3StatesProc(nprocConfig)

        const n3DistrictProc = new N3DistrictProc(nprocConfig)

        const nlegisProc = new N3LegisProc(nprocConfig)

        const nBillsProc = new N3BillsProc(nprocConfig)

        return async (state_id: StateId) => {
            await n3StatesProc.deleteState(state_id)
            await n3StatesProc.process(state_id)
            const state: N3StateGov | null = await n3StatesProc.getState(state_id)
            if ( state === null ) {
                throw new Error(`Can't find state ${state_id}`)
            }
            await n3DistrictProc.processState(state)
            await nlegisProc.processState(state)
            await nBillsProc.processState(state)
        }

    } catch ( e ) {
        console.log(e)
        throw e
    }

}
