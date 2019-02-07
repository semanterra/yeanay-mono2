import * as Knex from 'knex'

import * as config from 'config'
import { createTestSchema } from './__test__/createTestSchema'
import { DaoA, DtoA, DaoB, DtoB } from './__test__/daoDefs'
import { WithoutId } from '@yeanay/yeanay-commons'

// import { WithoutId } from './Dao'

let db:Knex|undefined = undefined
let gdaoA:DaoA|undefined = undefined
let gdaoB:DaoB|undefined = undefined

function getDaoA():DaoA { return gdaoA!}
function getDaoB():DaoB { return gdaoB!}

jest.setTimeout(5 * 60 * 1000)

beforeAll(async () => {
    console.log('before beforeAll')

    await createTestSchema()
    const konfig:Knex.Config = config.knex
    db = Knex(konfig)
    gdaoA = new DaoA(db)
    gdaoB = new DaoB(db)
    console.log('after beforeAll')
})

afterAll(async () => {
    console.log('before afterAll')
    if ( db ) {
        await db.destroy()
    }
    console.log('after afterAll')
})

let lastKeyIndex: number = 0

function getNewKey(): string { lastKeyIndex += 1; return 'key' + lastKeyIndex }

describe('insert',()=> {
    test('insert with key', async () => {
        console.log('before with key')
        const daoA = getDaoA()
        const suppliedKey = getNewKey()
        const aDto: DtoA = {
            id: suppliedKey,
            astring: suppliedKey+suppliedKey,
            json: { a:1 },
        }
        let key = ''
        const inserter = async (dto)=> {
            try {
                key = await daoA.insert(dto)
            } catch (e) {
                throw e
            }
            return key
        }
        await expect(inserter(aDto)).resolves.toEqual(suppliedKey)
        console.log('between inserts with key')

        await expect(inserter(aDto)).rejects.toThrow()
        console.log('after with key')
    })
    test('insert without key', async () => {
        console.log('before without key')
        const daoB = getDaoB()
        const bDto: WithoutId<DtoB, number> = {
            bus_key: '1',
        }
        let id = 0
        const inserter = async (dto) => {
            id = await daoB.insert(dto)
            return id
        }
        await expect(inserter(bDto)).resolves.toBeGreaterThan(0)

        const bDto2 = {...bDto, id}
        console.log('second insert b follows')
        await expect(inserter(bDto2)).rejects.toThrow()
        console.log('after without key')
    })
})

