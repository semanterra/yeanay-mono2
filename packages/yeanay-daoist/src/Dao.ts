import { PrimaryKey, IDed, WithoutId } from '@yeanay/yeanay-commons'
import * as Knex from 'knex'

// These types are not required in DTO's.
// Types used in DTO's should be in yeanay-commons

export type DbConnection = Knex
export type DbConnectionConfig = Knex.Config
export type SchemaName = string
export type TableName = string
export type ColumnSet<DTO> = (keyof DTO)[]
export type TableBuilder = Knex.TableBuilder
export type SchemaBuilder = Knex.SchemaBuilder

export const connectDb = Knex

/*
// todo remove here and import when commons published again
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
// For use in inserting records with autogen'd id
export interface IDed<PK> {
    id: PK
}

// For use in inserting records with autogen'd id
export type WithoutId<T extends IDed<PK>, PK> = Omit<T, 'id'>

// end todo
*/

/**
 * Dao is a base class for data access objects.
 * It is built on knex and presumes postgresql.
 * It presumes the presence of a unique primary key field called "id",
 * which typically is auto-incremented but not necessarily.
 *
 * There is support for "business keys", which is used in subclasses.
 *
 * The support for upsert is very important for this application.
 *
 * The schema name is derived from a provided schema "role"
 * and a schemaNameSet, which maps roles to names.
 * This may be changed to a simple schema name, with this
 * mapping happening somewhere upstream.
 *
 * Some methods may no longer be in use.
 */
export abstract class Dao<DTO, PK = PrimaryKey> {

    protected abstract businessKeyPropNames: (keyof DTO)[] | null
    protected businessKeyJoined?: string
    protected readonly noIdColumnSet: ColumnSet<DTO>

    /** The key on which an upsert determines that the record already exists */
    protected defaultConflictTarget: string = 'id'
    protected businessKeyColumns: ColumnSet<DTO>

    protected constructor(readonly db: DbConnection, // must have schema set via withSchema
                          readonly schemaName: SchemaName,
                          readonly tableName: TableName,
                          readonly columnSet: ColumnSet<DTO>) {
        this.noIdColumnSet = this.cullColumnSet('id', 'created_at', 'updated_at')
        this.schemaName.length // throw if missing
    }

    public cullColumnSet(...cnames: PropertyKey[]): ColumnSet<DTO> {
        return this.columnSet.filter((c) => !cnames.includes(c))
    }

    public filterColumnSet(...cnames: (keyof DTO)[]): ColumnSet<DTO> {
        return this.columnSet.filter((c) => cnames.includes(c))
    }

    public async insert(dto: WithoutId<DTO, PK>): Promise<PK> {
        const ids = await this.q().insert(dto).returning('id')
        return ids[0]
    }

    public async insertAndKey(dto: WithoutId<DTO, PK>): Promise<PK> {
        const ids = await this.q().insert(dto).returning('id')
        dto['id'] = ids[0]
        return ids[0]
    }

    public async inserts(dtos: WithoutId<DTO, PK>[]): Promise<PK[]> {
        const ids = await this.q().insert(dtos).returning('id')
        return ids
    }

    public async insertAndKeys(dtos: WithoutId<DTO, PK>[]): Promise<PK> {
        const ids = await this.q().insert(dtos).returning('id')
        dtos.forEach((dto, i) => dto['id'] = ids[i])
        return ids
    }

    // Tries to delete a user by id, and returns the number of records deleted;
    public async remove(id: PK): Promise<number> {
        return this.q().where({ id }).delete()
    }

    /** find by primary key, return null if nonexistent */
    public async findByPrimaryKey(id: PK): Promise<DTO & IDed<PK> | null> {
        const rows = await this.q().select().where({ id })
        return rows[0] || null
    }

    public async update(id: PK, data: Partial<DTO>): Promise<void> {
        return this.q().where({ id }).update(data)
    }

    public async all(): Promise<(DTO & IDed<PK>)[]> {
        return this.q().select()
    }

    // used
    public allKeyColumns(): ColumnSet<DTO> {
        const ret = this.businessKeyPropNames ? [...this.businessKeyPropNames] : []
        if ( (this.columnSet as string[]).includes('id') ) {
            ret.push('id' as keyof DTO)
        }
        return ret
    }


    /**
     * Slightly tweaked from https://gist.github.com/adnanoner/b6c53482243b9d5d5da4e29e109af9bd.
     *
     * Perform an "Upsert" using the "INSERT ... ON CONFLICT ... " syntax in PostgreSQL 9.5
     * @link http://www.postgresql.org/docs/9.5/static/sql-insert.html
     * @author https://github.com/adnanoner
     * inspired by: https://gist.github.com/plurch/118721c2216f77640232
     * @param {string} conflictTarget - The column in the table which has a unique index constraint
     * @param {Object} itemData - a hash of properties to be inserted/updated into the row
     * @returns {Promise} - A Promise which resolves to the inserted/updated row
     */
    public async upsertArray(itemData: Partial<DTO>[],
                             conflictTarget: string = this.defaultConflictTarget)
        : Promise<DTO[]> {
        let itemsArray: Partial<DTO>[] = []
        if ( Array.isArray(itemData) ) {
            itemsArray = itemData
        } else {
            itemsArray[0] = itemData
        }
        const itemKeys = Object.keys(itemsArray[0])

        const exclusions = itemKeys
            .filter((c) => c !== conflictTarget)
            .map((c) => this.db.raw('?? = EXCLUDED.??', [c, c]).toString())
            .join(',\n')

        let valuesPreparedString = ''
        let preparedValues: string[] = []
        itemsArray.forEach((item: DTO) => {
            valuesPreparedString += '('
            for ( let i = 0; i < itemKeys.length - 1; i += 1 ) {
                valuesPreparedString += '?, '
            }
            valuesPreparedString += '?), '
            preparedValues = preparedValues.concat(Object.values(item))
        })
        // Remove last trailing comma
        valuesPreparedString = valuesPreparedString.replace(/,\s*$/, '')

        // noinspection SyntaxError
        const query = `
            INSERT INTO ${this.schemaName}.${this.tableName} (${itemKeys})
            VALUES ${valuesPreparedString}
            ON CONFLICT (${conflictTarget}) DO UPDATE SET
            ${exclusions}
            RETURNING *;
        `
        return this.db.raw(query, preparedValues)
            .then((result) => result.rows)
    }

    public async upsertArrayByBusinessKey(
        itemData: Partial<DTO>[],
        conflictTarget: string = this.defaultConflictTarget): Promise<DTO[]> {
        return this.upsertArray(itemData, this.getBusinessKeyJoined())
    }

    public async upsertByBusinessKey(itemData: Partial<DTO>): Promise<DTO> {
        return this.upsert(itemData, this.getBusinessKeyJoined())
    }

    public async upsert(itemData: Partial<DTO>,
                        conflictTarget: string = this.defaultConflictTarget): Promise<DTO> {
        return (await this.upsertArray([itemData], conflictTarget))[0]
    }

    /** querybuilder, used heavily in subclasses */
    protected q = (tableName: TableName = this.tableName) => {
        // Assume schemaName is valid, tableName may include schema (which is dropped here)
        const dotPos = tableName.indexOf('.')
        const simpleTableName = dotPos < 0 ? tableName : tableName.substr(dotPos + 1)
        return this.db.queryBuilder().withSchema(this.schemaName).table(simpleTableName)
    }

    // todo port to Knex
    protected allKeySetsQuery(t: TableName = this.tableName, ...extraProps: (keyof DTO)[]): string {
        if ( !this.businessKeyPropNames ) {
            throw new Error('allKeySets: no Business Keys')
        }

        return `SELECT id, ${this.businessKeyPropNames.concat(extraProps).join(', ')} FROM ${t}`
    }

    private getBusinessKeyJoined(): string {
        if ( !this.businessKeyJoined ) {
            if ( !this.businessKeyPropNames ) {
                throw new Error('no business key')
            }
            this.businessKeyJoined = this.businessKeyPropNames.join()
        }
        return this.businessKeyJoined
    }

}

