import { OCDBillId, StateId } from '@yeanay/yeanay-commons'
import { Dao, DbConnection, SchemaName } from '@yeanay/yeanay-daoist'
import { RawGqlBill } from './rawGqlTypes'

export class Cursor {
    public offset: number = 1
    constructor(public readonly limit: number = 100) {}
    public bump(): void { this.offset += this.limit }
}

export class RawBillDao extends Dao<RawGqlBill, OCDBillId> {

    protected businessKeyPropNames: (keyof RawGqlBill)[] = ['id']

    constructor(conn: DbConnection, schemaName:SchemaName) {
        super(conn, schemaName, 'bill', [
            'id',
            'state_id',
            'identifier',
            'session',
            'json',
        ])
    }
    public async getBillsOfState(state_id: StateId, cursor: Cursor): Promise<RawGqlBill[]> {
        const rows = await this.q().select().where({ state_id})
            .offset(cursor.offset).limit(cursor.limit)
        cursor.bump()
        return rows
    }

}
