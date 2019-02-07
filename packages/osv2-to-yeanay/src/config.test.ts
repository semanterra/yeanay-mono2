import { getConfig } from './config'
// tslint:disable-next-line:no-var-requires
import * as JSON5 from 'json5'
import {readFileSync} from 'fs'
import * as deepmerge from 'deepmerge'

const defaltPath = 'config/default.json5'
const localPath = 'config/local.json5'

describe('config', ()=> {
    test('defaults', ()=> {
        const config = getConfig()
        const sDefault = readFileSync(defaltPath, 'utf8')
        const sLocal = readFileSync(localPath, 'utf8')
        const expected = deepmerge(JSON5.parse(sDefault), JSON5.parse(sLocal))
        expect(config).toEqual(expected)
    })
})
