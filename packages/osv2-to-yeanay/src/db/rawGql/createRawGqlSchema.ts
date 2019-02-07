import VError = require('verror')
import { Promise0 } from '@yeanay/yeanay-commons'
import {
    connectDb,
    DbConnection,
    DbConnectionConfig,
    SchemaBuilder,
    SchemaName,
    TableName,
} from '@yeanay/yeanay-daoist'

type FSchemaBuilder = () => SchemaBuilder

async function addTimestamps(kschema: FSchemaBuilder, tableName: TableName): Promise0 {
    await kschema().alterTable(tableName, (table) => table.timestamps(true, true))
    const triggerName = `${tableName}_updated_at`
    await kschema().raw(`
        CREATE TRIGGER ${triggerName}
        BEFORE UPDATE ON ${kschema}.${tableName}
        FOR EACH ROW EXECUTE PROCEDURE update_update_time()
    `)
    return
}

export async function createRawGqlSchema(dbConnectionConfig: DbConnectionConfig,
                                         schema: SchemaName): Promise0 {
    try {
        const ks = connectDb(dbConnectionConfig)
        try {
            await ks.raw(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
        } catch ( e ) {
            console.log('Expected exception: ' + e)
        }
        await ks.raw(`CREATE SCHEMA ${schema}`)
        await ks.destroy()

        const k = connectDb({ ...dbConnectionConfig, searchPath: schema })

        const fSchemaBuilder: FSchemaBuilder = () => k.schema.withSchema(schema)
        fSchemaBuilder.toString = () => schema

        await fSchemaBuilder().raw(`
        CREATE OR REPLACE FUNCTION update_update_time()
          RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = current_timestamp;
          RETURN NEW;
        END;
        $$ LANGUAGE 'plpgsql';
    `)
        await createJurisdiction(fSchemaBuilder, k)
        await createOrganization(fSchemaBuilder)
        await createGqlDistrict(fSchemaBuilder)
        await createLegi(fSchemaBuilder)
        await createBill(fSchemaBuilder)
        await k.destroy()
    } catch ( e ) {
        console.log(e)
        throw new VError(e, 'createRawSchema failed')
    }
    return
}

async function createJurisdiction(fSchemaBuilder: FSchemaBuilder, k:DbConnection): Promise0 {
    const tableName = 'jurisdiction'
    const schemaBuilder = fSchemaBuilder()
    await schemaBuilder.createTable(tableName, (table) => {
        table.string('id').notNullable().unique()
        table.string('state_id').notNullable().unique()
        table.timestamp('latest_update')
        // tslint:disable-next-line:quotemark
        table.timestamp('boundary_latest_update').defaultTo(k.raw('timestamp without time zone \'1970-01-01 00:00\''))

        table.jsonb('json')
    })
    await addTimestamps(fSchemaBuilder, tableName)
    return
}

async function createOrganization(fSchemaBuilder: FSchemaBuilder): Promise0 {
    const tableName = 'organization'
    await fSchemaBuilder().createTable(tableName, (table) => {
        table.string('id').notNullable().unique()
        table.string('state_id')
        table.string('jurisdiction_id')
        table.string('classification')
        table.string('parent')
        table.jsonb('json')
    })
    await addTimestamps(fSchemaBuilder, tableName)
    return
}

async function createLegi(fSchemaBuilder: FSchemaBuilder): Promise0 {
    const tableName = 'legislator'
    await fSchemaBuilder().createTable(tableName, (table) => {
        table.string('id').notNullable().unique()
        table.string('state_id').notNullable()
        table.string('chamber_id').notNullable()
        table.string('name').notNullable()
        table.jsonb('json')
    })
    await addTimestamps(fSchemaBuilder, tableName)
    return
}

async function createBill(fSchemaBuilder: FSchemaBuilder): Promise0 {
    const tableName = 'bill'
    await fSchemaBuilder().createTable(tableName, (table) => {
        table.string('id').notNullable().unique()
        table.string('state_id').notNullable()
        table.string('identifier')
        table.string('session')
        table.jsonb('json')
    })
    await addTimestamps(fSchemaBuilder, tableName)
    return
}

async function createGqlDistrict(fSchemaBuilder: FSchemaBuilder): Promise0 {
    const tableName = 'district'
    await fSchemaBuilder().createTable(tableName, (table) => {
        table.string('id').notNullable().unique()
        table.string('chamber_id').notNullable()
        table.string('state_id').notNullable()
        table.jsonb('json')
    })
    await addTimestamps(fSchemaBuilder, tableName)
    return
}

