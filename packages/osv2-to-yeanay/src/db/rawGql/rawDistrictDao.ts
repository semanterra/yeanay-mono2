import { OCDDivisionId, StateId } from '@yeanay/yeanay-commons'
import { Dao, DbConnection, SchemaName } from '@yeanay/yeanay-daoist'
import { RawGqlDistrict } from './rawGqlTypes'

export class RawDistrictDao extends Dao<RawGqlDistrict, OCDDivisionId> {

    protected businessKeyPropNames: (keyof RawGqlDistrict)[] = ['id']

    constructor(conn: DbConnection, schemaName:SchemaName) {
        super(conn, schemaName, 'district', [
            'state_id',
            'chamber_id',
            'id',
            'json',
        ])
        this.defaultConflictTarget = 'id'
    }

    public async findByStateId(state_id: StateId): Promise<RawGqlDistrict[]> {
        return this.q().select().where({ state_id })
    }
}
