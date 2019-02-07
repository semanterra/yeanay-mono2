/*
import * as Knex from 'knex'

import { config } from '../config'
import { DaoContext } from '@semanterra/yeanay-server-shared/src/db/Dao'

export function connectKnex(config: Knex.Config): Knex {
    return Knex({
        client: 'pg',
        ...config
    })
}
export function makeKnex(debug: boolean = true) {
    return connectKnex({
            connection: config.postgresUrl,
            debug,
        }
    ) as Knex
}

export function makeDaoContext(knex: Knex): DaoContext {
    return {
        db          : knex,
        normalSchema: 'normal2', normal3Schema: 'normal3', userSchema: 'user1', extractLogSchema: 'log',
        rawGqlSchema:  'raw_gql'

    }
}
*/
