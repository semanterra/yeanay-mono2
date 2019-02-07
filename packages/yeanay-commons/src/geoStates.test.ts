import { geoStates } from './geoStates'
import { lowerChamberType, upperChamberType } from './types'

describe('geoStates', () => {
    describe('floterials', () => {
        Object.values(geoStates).forEach((state) => {
            test(state.id, () => {

                expect(state.hasFloterial).toEqual(state.id === 'nh')
            })
        })
        expect(geoStates.nh.hasFloterial).toBe(true)

    })

    describe('unicameral',() => {
        Object.values(geoStates).forEach((state) => {
            test(state.id, () => {

                expect(state.unicameral).toEqual(state.id === 'ne')
                expect(state.chamberTypes).toEqual(state.id==='ne'? [upperChamberType] : [upperChamberType, lowerChamberType])
            })
        })
        expect(geoStates.ne.unicameral).toBe(true)
    })
})
