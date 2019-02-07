import VError = require('verror')
import {
    connectDb,
    DbConnection,
    DbConnectionConfig,
    SchemaBuilder,
    SchemaName,
    TableBuilder,
    TableName,
} from '@yeanay/yeanay-daoist'
import {Promise0} from '@yeanay/yeanay-commons'

type FSchemaBuilder = ()=>SchemaBuilder

async function addTimestamps(fSchemaBuilder:FSchemaBuilder, tableName: TableName): Promise0 {
    await fSchemaBuilder().alterTable(tableName,
        (tableBuilder:TableBuilder) => tableBuilder.timestamps(true, true))
    const triggerName = `${tableName}_updated_at`
    await fSchemaBuilder().raw(`
        CREATE TRIGGER ${triggerName}
        BEFORE UPDATE ON ${fSchemaBuilder}.${tableName}
        FOR EACH ROW EXECUTE PROCEDURE update_update_time()
    `)
    return
}

export async function createNormal3Schema(dbConnectionConfig: DbConnectionConfig,
                                          schema: SchemaName):Promise0 {
    try {
        const ks = connectDb(dbConnectionConfig)
        try {
            await ks.raw(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
        } catch ( e ) {
            // eat error, probably 'does not exist'
        }
        await ks.raw(`CREATE SCHEMA ${schema}`)
        await ks.destroy()

        const k:DbConnection = connectDb({ ...dbConnectionConfig, searchPath: schema })

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

        await create_state_gov(kschema)
        // await create_state_biennium(kschema)
        await create_state_session(kschema)
        await create_district(kschema)
        await create_district_shape(kschema)
        await create_legi(kschema)
        await create_member_role(kschema)
        await create_bill(kschema)
        await create_vote(kschema)
        await create_legi_vote(kschema)
        await create_views(kschema)
        await k.destroy()
    } catch ( e ) {
        console.log(e)
        throw new VError(e, 'createNormal3Schema failed')
    }
    return
}

async function create_state_gov(fSchemaBuilder:FSchemaBuilder): Promise0 {
    const tableName = 'state_gov'
    await fSchemaBuilder().createTable(tableName, (table:TableBuilder) => {
        table.increments('id')
        table.string('state_id').notNullable().unique() // 2 char
        table.specificType('feature_flags', 'VARCHAR(255) []')
        table.string('capitol_timezone')
        table.string('legislature_name').notNullable()
        table.string('legislature_url').notNullable()
        table.string('name').notNullable()
        table.date('first_vote_date')
        table.date('last_vote_date')
        table.date('latest_update')
    })
    await addTimestamps(fSchemaBuilder, tableName)
    return
}

/*
async function create_state_biennium(kschema) {
    const tableName = 'state_biennium'
    await kschema().createTable(tableName, (table:Knex.TableBuilder) => {
        table.increments('id')
        table.integer('start_year')
        table.integer('end_year')
        table.integer('state_fk').notNullable().references('state_gov.id').onDelete('cascade')
    })
    await addTimestamps(kschema, tableName)
}
*/

async function create_state_session(fSchemaBuilder:FSchemaBuilder): Promise0 {
    const tableName = 'state_session'
    await fSchemaBuilder().createTable(tableName, (table:TableBuilder) => {
        table.increments('id')
        table.string('session_id').notNullable()
        table.string('name').notNullable()
        table.string('type').notNullable()
        table.date('start_date')
        table.date('end_date')
        table.date('first_vote_date')
        table.date('last_vote_date')
        table.integer('state_fk').notNullable().references('state_gov.id').onDelete('cascade')
        table.unique(['state_fk', 'session_id' ])
    })
    await addTimestamps(fSchemaBuilder, tableName)
    return
}

async function create_district(fSchemaBuilder:FSchemaBuilder): Promise0 {
    const tableName = 'district'
    await fSchemaBuilder().createTable(tableName, (table:TableBuilder) => {
        table.increments('id')
        table.string('division_id').notNullable().unique() // ocd id
        table.string('district_name').notNullable()
        table.integer('state_fk').notNullable().references('state_gov.id').onDelete('cascade')
        table.enu('chamber_id', ['lower', 'upper'])
        table.integer('num_seats').notNullable()
        table.jsonb('bbox')
        table.boolean('is_floterial').defaultTo(false)
        table.integer('floterial_fk').references('district.id')
        table.unique(['state_fk', 'chamber_id', 'division_id'])
    })
    await addTimestamps(fSchemaBuilder, tableName)
    return
}

async function create_district_shape(fSchemaBuilder:FSchemaBuilder): Promise0 {
    const tableName = 'district_shape'
    await fSchemaBuilder().createTable(tableName, (table:TableBuilder) => {
        table.integer('district_fk').notNullable().references('district.id')
        table.integer('state_fk').notNullable().references('state_gov.id').onDelete('cascade')
        table.jsonb('shape')
    })
    await addTimestamps(fSchemaBuilder, tableName)
    return
}

/* A legi corresponds in OSV2 API to a person's current membership in a chamber. */
async function create_legi(fSchemaBuilder:FSchemaBuilder): Promise0 {
    const tableName = 'legi'
    await fSchemaBuilder().createTable(tableName, (table:TableBuilder) => {
        table.increments('id')
        table.string('legi_id').notNullable().unique() // ocd id
        table.integer('state_fk').notNullable().references('state_gov.id').onDelete('cascade')
        table.enu('chamber_id', ['lower', 'upper'])
        table.integer('district_fk').references('district.id')
        table.string('party_id')
        table.string('email')
        table.string('name').notNullable()
        table.string('sort_name').notNullable()
        table.string('last_name').notNullable()
        table.string('first_name').notNullable()
        table.integer('ordinal').notNullable()
        table.string('image')
        table.string('url')
        table.date('os_updated_at').notNullable()
        table.specificType('demi_party', 'CHAR')
        table.jsonb('offices')
        table.jsonb('committees')
        table.specificType('partisanity', 'REAL')
        table.specificType('activeness', 'REAL')
        table.specificType('effectiveness', 'REAL')
        table.specificType('weighted_activeness', 'REAL')
        table.index(['state_fk', 'chamber_id'])
    })
    await addTimestamps(fSchemaBuilder, tableName)
    return
}

async function create_member_role(fSchemaBuilder:FSchemaBuilder): Promise0 {
    const tableName = 'member_role'
    await fSchemaBuilder().createTable(tableName, (table:TableBuilder) => {
        table.increments('id')
        table.integer('legi_fk').notNullable()
            .references('legi.id').onDelete('cascade')
        table.integer('district_fk').notNullable()
            .references('district.id').onDelete('cascade')
        table.enu('chamber_id', ['lower', 'upper'])
        table.boolean('active').notNullable().defaultTo(true)
        table.date('start_date')
        table.date('end_date')
        table.string('party_id')
        table.unique(['legi_fk', 'chamber_id', 'district_fk'])
    })
    await addTimestamps(fSchemaBuilder, tableName)
    return
}


async function create_bill(fSchemaBuilder:FSchemaBuilder): Promise0 {
    const tableName = 'bill'
    await fSchemaBuilder().createTable(tableName, (table:TableBuilder) => {
        table.increments('id')
        table.integer('session_fk').notNullable().index()
            .references('state_session.id').onDelete('cascade')
        table.string('bill_id').notNullable().unique() // ocd id
        table.string('bill_name').notNullable()
        table.string('title', 20000).notNullable()
        table.specificType('alternate_titles', 'VARCHAR(20000) []').notNullable()
        table.date('os_updated_at').notNullable()
        table.specificType('subjects', 'VARCHAR(1000) []').notNullable()
        table.specificType('bill_types', 'VARCHAR(1000) []').notNullable()
    })
    await addTimestamps(fSchemaBuilder, tableName)
    return
}

async function create_vote(fSchemaBuilder:FSchemaBuilder): Promise0 {
    const tableName = 'vote'
    await fSchemaBuilder().createTable(tableName, (table:TableBuilder) => {
        table.increments('id')
        table.integer('session_fk').notNullable()
            .references('state_session.id').onDelete('cascade')
        table.enu('chamber_id', ['lower', 'upper'])
        table.date('date')
        table.string('vote_id').notNullable().unique() // ocd id
        table.boolean('passed').notNullable()
        table.string('motion', 3000).notNullable()
        table.string('motion_type', 25).nullable()
        table.integer('bill_fk').notNullable()
            .references('bill.id').onDelete('cascade')
        table.integer('yes_count').notNullable()
        table.integer('no_count').notNullable()
        table.integer('other_count').notNullable()
        table.boolean('rollcall').notNullable()
        table.specificType('partisanity', 'REAL')
        table.jsonb('demi_party_counts')
        table.integer('total_vote_count')
        table.integer('margin')
        table.integer('participation')
    })
    await addTimestamps(fSchemaBuilder, tableName)
    await fSchemaBuilder().raw('CREATE INDEX vote_session_date_idx ON vote (session_fk, date DESC)')
    return
}

async function create_legi_vote(fSchemaBuilder:FSchemaBuilder): Promise0 {
    const tableName = 'legi_vote'
    await fSchemaBuilder().createTable(tableName, (table:TableBuilder) => {
        table.integer('legi_fk').notNullable()
            .references('legi.id').onDelete('cascade')
        table.integer('vote_fk').notNullable().index()
            .references('vote.id').onDelete('cascade')
        table.specificType('vote_value', 'SMALLINT').notNullable()
        table.primary(['legi_fk', 'vote_fk'])
    })
    return
}

// tslint:disable-next-line:max-func-body-length
async function create_views(fSchemaBuilder:FSchemaBuilder): Promise0 {
    await fSchemaBuilder().raw(`
       CREATE VIEW legi_vote_view AS
          SELECT
            l.legi_id     AS legi_id,
            b.bill_id     AS bill_id,
            v.vote_id     AS vote_id,
            v.chamber_id  AS chamber_id,
            s.state_id    AS state_id,
            lv.*
          FROM legi_vote AS lv
            JOIN vote AS v ON lv.vote_fk = v.id
            JOIN bill AS b ON v.bill_fk = b.id
            JOIN legi AS l ON lv.legi_fk = l.id
            JOIN state_gov AS s ON l.state_fk = s.id 
    `)

/*
    await fSchemaBuilder().raw(`
CREATE VIEW state_biennium_view AS
  SELECT
    state_gov.state_id,
    state_biennium.*
  FROM state_biennium
    JOIN state_gov ON state_biennium.state_fk = state_gov.id
    `)
*/

    await fSchemaBuilder().raw(`
CREATE VIEW state_session_view AS
  SELECT
    state_gov.id AS state_pk,
    state_gov.state_id AS state_id,
    state_session.*
  FROM state_session
    JOIN state_gov ON state_session.state_fk = state_gov.id
    `)

    await fSchemaBuilder().raw(`
CREATE VIEW bill_view AS
  SELECT
    state_session_view.state_id,
    state_session_view.session_id,
    state_session_view.state_fk,
    state_session_view.start_date as session_start,
    state_session_view.end_date as session_end,
    bill.*
  FROM bill
    JOIN state_session_view ON bill.session_fk = state_session_view.id;
    `)

    await fSchemaBuilder().raw(`
CREATE VIEW legi_view AS
  SELECT
    state_gov.state_id,
    district.division_id,
    legi.*
  FROM legi
    JOIN state_gov ON legi.state_fk = state_gov.id
    JOIN district ON legi.district_fk = district.id;
    `)

    await fSchemaBuilder().raw(`
CREATE VIEW member_role_view AS
  SELECT
    legi_view.legi_id,
    legi_view.state_id,
    member_role.*
  FROM member_role
    JOIN legi_view ON member_role.legi_fk = legi_view.id;
    `)

    await fSchemaBuilder().raw(`
CREATE VIEW vote_view AS
  SELECT
    bill_view.state_id,
    bill_view.bill_name,
    bill_view.bill_id,
    bill_view.state_fk,
    vote.*
  FROM vote
    JOIN bill_view ON vote.bill_fk = bill_view.id;
    `)

    await fSchemaBuilder().raw(`
CREATE VIEW district_view AS
  SELECT
    state_gov.state_id,
    state_gov.name AS state_name,
    district.*
  FROM district
    JOIN state_gov ON district.state_fk = state_gov.id;
    `)

    await fSchemaBuilder().raw(`
    CREATE MATERIALIZED VIEW vote_search AS
SELECT
  vote.id,
  setweight(to_tsvector(vote.motion), 'B') ||
  setweight(to_tsvector(coalesce(vote.motion_type, '')), 'B') ||
  setweight(to_tsvector(to_char(vote.date, 'FMDD FMMonth YYYY')), 'B') ||

    setweight(to_tsvector(bill.bill_name), 'A') ||
  setweight(to_tsvector(bill.title), 'B') ||
  setweight(to_tsvector(array_to_string(bill.alternate_titles,',')), 'C') ||
  setweight(to_tsvector(array_to_string(bill.subjects, ',')), 'B') ||

  setweight(to_tsvector(state_gov.legislature_name), 'B') ||
  setweight(to_tsvector(state_gov.name), 'B') ||
  setweight(to_tsvector(state_gov.state_id), 'B')
    AS document
FROM vote
  -- todo need chamber to join to to get name of chamber
  JOIN bill ON vote.bill_fk = bill.id
  JOIN state_session ON (bill.session_fk = state_session.id)
  JOIN state_gov ON (state_session.state_fk = state_gov.id)
    `)

    await fSchemaBuilder().raw(`
    CREATE INDEX vote_search_idx ON vote_search USING gin(document)
    `)

    await fSchemaBuilder().raw(`
CREATE MATERIALIZED VIEW legi_search AS
  SELECT
    legi.id,
    legi.offices,
    setweight(to_tsvector(legi.name), 'A') ||
    setweight(to_tsvector(array_to_string(array_agg(committee_rec.committee || ' committee'), ',')), 'C') ||
    setweight(to_tsvector('district ' || district.district_name), 'B')
      AS document
  FROM legi,
        jsonb_to_recordset(legi.committees) AS committee_rec(committee TEXT),
    -- todo need chamber to join to to get name of chamber
    -- todo more geographical data, like towns, county, etc.
    state_gov,
    district
  where legi.state_fk = state_gov.id
        and legi.district_fk = district.id
  group by legi.id, district.district_name
    `)

    await fSchemaBuilder().raw(`
    CREATE INDEX legi_search_idx ON legi_search USING gin(document)
    `)
    return
}

