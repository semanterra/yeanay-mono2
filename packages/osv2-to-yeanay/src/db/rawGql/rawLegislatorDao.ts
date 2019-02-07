import { OCDPersonId, StateId } from '@yeanay/yeanay-commons'
import { Dao, DbConnection, SchemaName, } from '@yeanay/yeanay-daoist'
import { RawGqlLegislator } from './rawGqlTypes'

export class RawLegislatorDao extends Dao<RawGqlLegislator, OCDPersonId> {

    protected businessKeyPropNames: (keyof RawGqlLegislator)[] = ['id']

    constructor(conn: DbConnection, schemaName:SchemaName) {
        super(conn, schemaName, 'legislator', [
            'id',
            'state_id',
            'chamber_id',
            'name',
            'json',
        ])
    }

    public async getLegisOfState(state_id: StateId): Promise<RawGqlLegislator[]> {
        const rows = await this.q().select().where({ state_id })
        return rows

    }



}
