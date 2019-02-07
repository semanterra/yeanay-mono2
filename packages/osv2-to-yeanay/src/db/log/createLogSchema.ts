import VError = require('verror')
import { Promise0 } from '@yeanay/yeanay-commons'
import {
    connectDb,
    DbConnection,
    DbConnectionConfig,
    SchemaBuilder,
    SchemaName,
    TableBuilder,
} from '@yeanay/yeanay-daoist'

type FSchemaBuilder = () => SchemaBuilder

/*
CREATE TABLE validation_error_log (
    id         SERIAL PRIMARY KEY,
    ocd_id     VARCHAR(255),
    app        VARCHAR(20),
    job_start  TIMESTAMP,
    stage      VARCHAR(20), --- bills, legis, etc
state_id   VARCHAR(3),
    severity   VARCHAR(255),
    error      VARCHAR(255),
    record_type  VARCHAR(255), --
    keys     JSONB, -- locator of record, content specific to record_type
value      VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE validation_error_log
OWNER TO yeanay1;


CREATE INDEX vel_ajse_idx
ON validation_error_log (app, job_start, state_id, error);
*/

export async function createLogSchema(dbConnectionConfig: DbConnectionConfig,
                                      schema: SchemaName)
    : Promise0 {
    try {
        const ks = connectDb(dbConnectionConfig)
        try {
            await ks.raw(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
        } catch ( e ) {
            // eat error, probably 'does not exist'
        }
        await ks.raw(`CREATE SCHEMA ${schema}`)
        await ks.destroy()

        const k: DbConnection = connectDb({ ...dbConnectionConfig, searchPath: schema })

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

        await create_validation_error_log(kschema, ks)
        await k.destroy()
    } catch ( e ) {
        console.log(e)
        throw new VError(e, 'createLogSchema failed')
    }
    return
}

async function create_validation_error_log(fSchemaBuilder: FSchemaBuilder,
                                           ks: DbConnection): Promise0 {
    const tableName = 'validation_error_log'
    await fSchemaBuilder().createTable(tableName, (table: TableBuilder) => {
        table.increments('id')
        table.string('ocd_id')
        table.string('app')
        table.timestamp('job_start')
        table.string('stage')
        table.string('state_id')
        table.string('severity')
        table.string('error')
        table.string('record_type')
        table.jsonb('keys')
        table.string('value')
        table.timestamp('created_at').defaultTo(ks.fn.now())
        table.index(['app', 'job_start', 'state_id', 'error'])
    })
    return
}

