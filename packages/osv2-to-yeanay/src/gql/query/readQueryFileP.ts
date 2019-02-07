import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'

const readFileP = promisify(fs.readFile)

const cache: {[queryName:string]:string} = {}

export async function readQueryFileP(queryName: string): Promise<string> {
        let fileContents = cache[queryName]
        if ( !fileContents ) {
            const qpath = path.join(__dirname, queryName + '.graphql')
            fileContents = await readFileP(qpath, 'utf8')
            cache[queryName] = fileContents
        }
        return fileContents
}

