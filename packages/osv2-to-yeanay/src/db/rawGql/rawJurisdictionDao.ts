import { OCDJurisdictionId, Promise0, StateId } from '@yeanay/yeanay-commons'
import { Dao, DbConnection, SchemaName, } from '@yeanay/yeanay-daoist'
import { makeJurisdictionId } from '../../gql/types/ocdIds'
import { RawGqlJurisdiction } from './rawGqlTypes'

export class RawJurisdictionDao extends Dao<RawGqlJurisdiction, OCDJurisdictionId> {

    protected businessKeyPropNames: (keyof RawGqlJurisdiction)[] = ['state_id']

    constructor(conn: DbConnection, schemaName: SchemaName) {
        super(conn, schemaName, 'jurisdiction', [
            'id',
            'state_id',
            'json',
            'latest_update',
            'boundary_latest_update',
        ])
    }

    public async setLatestUpdate(state_id: StateId, latest_update:Date): Promise0 {
        const id:OCDJurisdictionId = makeJurisdictionId(state_id)
        await this.update(id, {latest_update})
        return
    }

    public async setLatestBoundaryUpdate(state_id: StateId, boundary_latest_update:Date): Promise0 {
        const id:OCDJurisdictionId = makeJurisdictionId(state_id)
        await this.update(id, {boundary_latest_update})
        return
    }
    public async findByStateId(state_id: StateId): Promise<RawGqlJurisdiction|null> {
        return this.findByPrimaryKey(makeJurisdictionId(state_id))
    }
}
