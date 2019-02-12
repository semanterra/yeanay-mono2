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

export async function createQualitySchema(dbConnectionConfig: DbConnectionConfig,
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

        await createValidationErrorLog(kschema, ks)
        await createStatics(kschema, ks)
        await createSnaps(kschema, ks)
        await k.destroy()
    } catch ( e ) {
        console.log(e)
        throw new VError(e, 'createLogSchema failed')
    }
    return
}

async function createStatics(fSchemaBuilder: FSchemaBuilder,
                             conn: DbConnection): Promise0 {
    await createStaticGovState(fSchemaBuilder, conn)
    await createStaticChamber(fSchemaBuilder, conn)
    await createStaticBill(fSchemaBuilder, conn)
    await createStaticVote(fSchemaBuilder, conn)
    await createStaticLegi(fSchemaBuilder, conn)
    await createStaticPosting(fSchemaBuilder, conn)
}

async function createSnaps(fSchemaBuilder: FSchemaBuilder,
                           conn: DbConnection): Promise0 {
    await createSnapGovState(fSchemaBuilder, conn)
    await createSnapChamber(fSchemaBuilder, conn)
    await createSnapBill(fSchemaBuilder, conn)
    await createSnapVote(fSchemaBuilder, conn)
    await createSnapLegi(fSchemaBuilder, conn)
    await createSnapPosting(fSchemaBuilder, conn)
}

async function createStaticGovState(fSchemaBuilder: FSchemaBuilder,
                                    conn: DbConnection): Promise0 {
    const tableName = 'static_gov_state'
    await fSchemaBuilder().createTable(tableName, (table: TableBuilder) => {
        table.increments('id')
        table.string('oid')
        table.string('name') // 'nh'
    })
    return
}

async function createStaticChamber(fSchemaBuilder: FSchemaBuilder,
                                   conn: DbConnection): Promise0 {
    const tableName = 'static_chamber'
    await fSchemaBuilder().createTable(tableName, (table: TableBuilder) => {
        table.increments('id')
        table.string('name') // upper/lower
        table.string('oid').notNullable().unique()
        table.integer('static_gov_state_fk').notNullable()
            .references('static_gov_state.id').onDelete('cascade')
    })
    return
}

async function createStaticBill(fSchemaBuilder: FSchemaBuilder,
                                conn: DbConnection): Promise0 {
    const tableName = 'static_bill'
    await fSchemaBuilder().createTable(tableName, (table: TableBuilder) => {
        table.increments('id')
        table.integer('static_gov_state_fk').notNullable()
            .references('static_gov_state.id').onDelete('cascade')
        table.string('oid').notNullable().unique()
        table.string('name') // identifier
    })
    return
}

async function createStaticVote(fSchemaBuilder: FSchemaBuilder,
                                conn: DbConnection): Promise0 {
    const tableName = 'static_vote'
    await fSchemaBuilder().createTable(tableName, (table: TableBuilder) => {
        table.increments('id')
        table.integer('static_bill_fk').notNullable()
            .references('static_bill.id').onDelete('cascade')
        table.integer('static_chamber_fk').notNullable()
            .references('static_chamber.id').onDelete('cascade')
        table.string('oid').notNullable().unique()
    })
    return
}

async function createStaticLegi(fSchemaBuilder: FSchemaBuilder,
                                conn: DbConnection): Promise0 {
    const tableName = 'static_legi'
    await fSchemaBuilder().createTable(tableName, (table: TableBuilder) => {
        table.increments('id')
        table.integer('static_gov_state_fk').notNullable()
            .references('static_gov_state.id').onDelete('cascade')
        table.string('oid').notNullable().unique()
        table.string('name')
    })
    return
}

async function createStaticPosting(fSchemaBuilder: FSchemaBuilder,
                                   conn: DbConnection): Promise0 {
    const tableName = 'static_posting'
    await fSchemaBuilder().createTable(tableName, (table: TableBuilder) => {
        table.increments('id')
        table.string('oid').notNullable().unique()
        table.string('name')
        table.integer('static_chamber_fk').notNullable()
            .references('static_chamber.id').onDelete('cascade')
        table.integer('static_legi_fk').notNullable()
            .references('static_legi.id').onDelete('cascade')
    })
    return
}



type SnapEntityName = 'govState' | 'chamber' | 'bill' | 'vote' | 'legi' | 'posting'

interface MetaSnap {
    entity: SnapEntityName
    maxBools: number
    maxInts: number
    maxFloats: number
    maxBoxPlots: number
    maxTimestamps: number
}

type MetaSnaps = { [k in SnapEntityName]: MetaSnap }
const defaultMetasnap
    = { maxBools: 64, maxInts: 64, maxFloats: 64, maxBoxPlots: 0, maxTimestamps: 2 }

const metaSnaps: MetaSnaps = {
    govState: {
        entity     : 'govState',
        ...defaultMetasnap,
        maxBoxPlots: 20,
    },
    chamber : {
        entity     : 'chamber',
        ...defaultMetasnap,
        maxBoxPlots: 20,
    },
    bill    : {
        entity: 'bill',
        ...defaultMetasnap,
    },
    vote    : {
        entity: 'vote',
        ...defaultMetasnap,
    },
    legi    : {
        entity: 'legi',
        ...defaultMetasnap,
    },
    posting : {
        entity: 'posting',
        ...defaultMetasnap,
    },
}

function addDataColumns(table: TableBuilder, name: SnapEntityName): void {
    const meta = metaSnaps[name]
    if ( meta.maxBools ) {
        table.specificType('bools', 'boolean[]')
    }
    if ( meta.maxInts ) {
        table.specificType('ints', 'integer[]')
    }
    if ( meta.maxFloats ) {
        table.specificType('floats', 'real[]')
    }
    if ( meta.maxBoxPlots ) {
        table.specificType('boxPlots', 'real[][5]')
    }
    if ( meta.maxTimestamps ) {
        table.specificType('timeStamps', 'timestamp[]')
    }
}

async function createSnapGovState(fSchemaBuilder: FSchemaBuilder,
                                  conn: DbConnection): Promise0 {
    const tableName = 'snap_gov_state'
    await fSchemaBuilder().createTable(tableName, (table: TableBuilder) => {
        table.increments('id')
        table.integer('static_gov_state_fk').notNullable()
            .references('static_gov_state.id').onDelete('cascade')
        table.timestamp('latest_update')
        addDataColumns(table, 'govState')
    })
    return
}

async function createSnapChamber(fSchemaBuilder: FSchemaBuilder,
                                 conn: DbConnection): Promise0 {
    const tableName = 'snap_chamber'
    await fSchemaBuilder().createTable(tableName, (table: TableBuilder) => {
        table.increments('id')
        table.integer('static_chamber_fk').notNullable()
            .references('static_chamber.id').onDelete('cascade')
        addDataColumns(table, 'chamber')
    })
    return
}

async function createSnapBill(fSchemaBuilder: FSchemaBuilder,
                              conn: DbConnection): Promise0 {
    const tableName = 'snap_bill'
    await fSchemaBuilder().createTable(tableName, (table: TableBuilder) => {
        table.increments('id')
        table.integer('static_bill_fk').notNullable()
            .references('static_bill.id').onDelete('cascade')
        addDataColumns(table, 'bill')
    })
    return
}

async function createSnapVote(fSchemaBuilder: FSchemaBuilder,
                              conn: DbConnection): Promise0 {
    const tableName = 'snap_vote'
    await fSchemaBuilder().createTable(tableName, (table: TableBuilder) => {
        table.increments('id')
        table.integer('snap_bill_fk').notNullable()
            .references('snap_bill.id').onDelete('cascade')
        table.integer('snap_chamber_fk').notNullable()
            .references('snap_chamber.id').onDelete('cascade')
        table.string('vote_oid').unique()
        table.boolean('rollcall')
        addDataColumns(table, 'vote')
    })
    return
}

async function createSnapLegi(fSchemaBuilder: FSchemaBuilder,
                              conn: DbConnection): Promise0 {
    const tableName = 'snap_legi'
    await fSchemaBuilder().createTable(tableName, (table: TableBuilder) => {
        table.increments('id')
        table.integer('snap_gov_state_fk').notNullable()
            .references('snap_gov_state.id').onDelete('cascade')
        table.string('legi_person_oid').unique()
        addDataColumns(table, 'legi')
    })
    return
}

async function createSnapPosting(fSchemaBuilder: FSchemaBuilder,
                                 conn: DbConnection): Promise0 {
    const tableName = 'snap_posting'
    await fSchemaBuilder().createTable(tableName, (table: TableBuilder) => {
        table.increments('id')
        table.integer('snap_chamber_fk').notNullable()
            .references('snap_chamber.id').onDelete('cascade')
        table.integer('snap_legi_fk').notNullable()
            .references('snap_legi.id').onDelete('cascade')
        table.boolean('current')
        addDataColumns(table, 'posting')
    })
    return
}


async function createValidationErrorLog(fSchemaBuilder: FSchemaBuilder,
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

