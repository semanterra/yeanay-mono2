import { OCDDivisionId, Promise0 } from '@yeanay/yeanay-commons'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { RawOpenStatesBoundary } from '../db/rawGql/rawGqlTypes'
import { fThrottle } from '../generic/throttler'
import VError = require('verror')

const openStatesUrlPrefix = 'https://data.openstates.org/boundaries/2018/'

const openStatesMinRequestTimeMs = 100
const initialBackoff = 100

const throttle = fThrottle(openStatesMinRequestTimeMs)

function delay(ms: number): Promise0 {
    return new Promise( (resolve, reject)=> {
        setTimeout(resolve, ms) // (A)
    })
}


function makeBoundaryUrl(districtId: OCDDivisionId): string {
    return openStatesUrlPrefix + districtId + '.json'
}

export class OpenStatesBoundaryApi {
    private readonly slowAxios: AxiosInstance

    constructor() {

        this.slowAxios = axios.create({timeout: 10000})
    }

    public async getBoundaryP(districtId: OCDDivisionId):Promise<AxiosResponse<RawOpenStatesBoundary>> {
        const url = makeBoundaryUrl(districtId)
        try {
            return await this.getP(url)
        } catch (e) {
            throw new VError(e, 'OS getBoundaryP')
        }
    }

    /**
     * Common base for all REST queries.  Throttles requests to avoid hammering OS server.
     * @param url
     * @returns promise of http response
     */

    private async getP(url: string): Promise<AxiosResponse<any>> {
        const maxRetries = 4  // including first try
        const backoffMultiplier = 2

        let retries = 0
        let backoff = initialBackoff
        let error

        while ( retries < maxRetries ) {
            backoff *= backoffMultiplier
            try {
                const ret = await throttle(
                    () => {
                        console.log(new Date().toTimeString() + '  getP: ' + url)
                        return this.slowAxios({ method: 'get', url })
                    }
                )
                if ( retries > 0 ) {
                    console.log(`retry ${retries} succeeded`)
                }
                return ret
            } catch (e) { // retry
                console.log('retrying: ' + e.toString())
                retries += 1
                await delay(backoff)
                error = e
            }
        }
        throw error
    }

}
