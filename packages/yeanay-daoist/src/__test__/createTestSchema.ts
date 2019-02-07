import VError = require('verror')
import * as Knex from 'knex'
import * as config from 'config'

const konfig:Knex.Config = config.knex

export const schema = 'daoist'

type FSchemaBuilder = ()=>Knex.SchemaBuilder

async function addTimestamps(kschema: FSchemaBuilder, tableName: string): Promise<void> {
    await kschema().alterTable(tableName, (table) => table.timestamps(true, true))
    const triggerName = `${tableName}_updated_at`
    await kschema().raw(`
        CREATE TRIGGER ${triggerName}
        BEFORE UPDATE ON ${kschema}.${tableName}
        FOR EACH ROW EXECUTE PROCEDURE update_update_time()
    `)
}


export async function createTestSchema():Promise<void> {
    try {
        const ks = Knex(konfig)
        try {
            await ks.raw(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
        } catch ( e ) {
            // todo ok?
        }
        await ks.raw(`CREATE SCHEMA ${schema}`)
        await ks.destroy()

        const k = Knex({...konfig, searchPath: schema })

        const kschema = () => k.schema.withSchema(schema)
        kschema.toString = () => schema

        await kschema().raw(`
        CREATE OR REPLACE FUNCTION update_update_time()
          RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = current_timestamp;
          RETURN NEW;
        END;
        $$ LANGUAGE 'plpgsql';
    `)
        await createA(kschema)
        await createB(kschema)
        await k.destroy()
    } catch ( e ) {
        throw new VError(e, 'createTestSchema failed')
    }

}


// Has supplied, unique key - not autoincrement
async function createA(kschema: FSchemaBuilder): Promise<void> {
    const tableName = 'a'
    await kschema().createTable(tableName, (table) => {
        table.string('id').notNullable().unique()
        table.string('astring').notNullable().unique()
        table.timestamp('latest_update')
        table.jsonb('json')
    })
    await addTimestamps(kschema, tableName)
}

// auto-increment id with a business key too
async function createB(kschema: FSchemaBuilder): Promise<void> {
    const tableName = 'b'
    await kschema().createTable(tableName, (table:Knex.TableBuilder) => {
        table.increments('id')
        table.string('bus_key').notNullable().unique()
        table.date('latest_update')
    })
    await addTimestamps(kschema, tableName)
}
