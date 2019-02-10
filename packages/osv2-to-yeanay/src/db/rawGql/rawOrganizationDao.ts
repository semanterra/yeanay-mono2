import { Dao, DbConnection, SchemaName, } from '@yeanay/yeanay-daoist'
import { OCDOrganizationId, OCDOrgClassification, StateId } from '@yeanay/yeanay-commons'
import { RawGqlOrganization } from './rawGqlTypes'

export class RawOrganizationDao extends Dao<RawGqlOrganization, OCDOrganizationId> {

    protected businessKeyPropNames: (keyof RawGqlOrganization)[] = ['id']

    constructor(conn: DbConnection, schemaName:SchemaName) {
        super(conn, schemaName, 'organization', [
            'id',
            'state_id',
            'jurisdiction_id',
            'classification',
            'parent',
            'json',
        ])
    }

    public async getChambersOfState(state_id: StateId): Promise<RawGqlOrganization[]> {
        const classifications: OCDOrgClassification[] =
            ['ne', 'dc'].includes(state_id) ? ['legislature'] : ['upper', 'lower']

        const rows = await this.q().select().where({ state_id }).whereIn('classification',
            classifications)
        return rows

    }
}
