import { Dao } from '../Dao'
import * as Knex from 'knex'
import { schema } from './createTestSchema'

export interface DtoA {
    id: string
    astring: string
    json: object
    latest_update?: Date
}

export class DaoA extends Dao<DtoA, string> {

    protected businessKeyPropNames: (keyof DtoA)[] = ['astring']

    constructor(db: Knex) {
        super(db, schema, 'a', [
            'id',
            'astring',
            'json',
            'latest_update',
        ])
    }
}

export interface DtoB {
    id: number
    bus_key: string
    latest_update?: Date
}
export class DaoB extends Dao<DtoB> {

    protected businessKeyPropNames: (keyof DtoB)[] = ['bus_key']

    constructor(db: Knex) {
        super(db, schema, 'b', [
            'id',
            'bus_key',
            'latest_update',
        ])
    }
}
