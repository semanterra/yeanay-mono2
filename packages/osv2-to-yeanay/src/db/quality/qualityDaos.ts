import { IDed, NullOr, PrimaryKey, OCDId, StateId, ChamberId } from '@yeanay/yeanay-commons'

import {
    QSnapBillDTO,
    QSnapChamberDTO,
    QSnapDTO,
    QSnapLegiDTO,
    QSnapPostDTO,
    QSnapPostingDTO,
    QSnapStateDTO,
    QSnapVoteDTO, QStaticBillDTO,
    QStaticChamberDTO,
    QStaticDTO,
    QStaticLegiDTO,
    QStaticPostDTO,
    QStaticPostingDTO,
    QStaticStateDTO,
    QStaticVoteDTO,
} from './qualityDtos'

import { Dao, DbConnection, SchemaName, TableName, ColumnSet } from '@yeanay/yeanay-daoist'


// STATIC

export abstract class QStaticDao<T extends QStaticDTO> extends Dao<T> {
}


// SNAP


export abstract class QSnapDao<T extends QSnapDTO> extends Dao<T> {
}


// STATE


export class QStaticStateDao extends QStaticDao<QStaticStateDTO> {
    // it's unclear whether this should be oid, name, or both
    protected businessKeyPropNames: (keyof QStaticStateDTO)[] = ['oid']

    constructor(db: DbConnection, // must have schema set via withSchema
                schemaName: SchemaName) {
        super(db, schemaName, 'static_gov_state', [
            'id', 'oid', 'name',
        ])
    }
}

export class QSnapStateDao extends QSnapDao<QSnapStateDTO> {
    protected businessKeyPropNames: (keyof QSnapStateDTO)[] =
        ['static_gov_state_fk', 'latest_update']

    constructor(db: DbConnection, // must have schema set via withSchema
                schemaName: SchemaName) {
        super(db, schemaName, 'snap_gov_state', [
            'static_gov_state_fk', 'latest_update'])
    }
}

// CHAMBER


export class QStaticChamberDao extends QStaticDao<QStaticChamberDTO> {
    protected businessKeyPropNames: (keyof QStaticChamberDTO)[] = ['oid']

    constructor(db: DbConnection, // must have schema set via withSchema
                schemaName: SchemaName) {
        super(db, schemaName, 'static_chamber', [
            'id', 'name', 'oid', 'static_gov_state_fk',
        ])
    }

    // used? 
    public async findByOid(oid: OCDId):
        Promise<null | QStaticChamberDTO> {
        return super.only({ oid })
    }
}


export class QSnapChamberDao extends QSnapDao<QSnapChamberDTO> {
    protected businessKeyPropNames: (keyof QSnapChamberDTO)[] =
        ['snap_gov_state_fk', 'static_chamber_fk']

    constructor(db: DbConnection, // must have schema set via withSchema
                schemaName: SchemaName) {
        super(db, schemaName, 'snap_chamber', [
            'snap_gov_state_fk', 'static_chamber_fk'])
    }
}

// BILL

export class QStaticBillDao extends QStaticDao<QStaticBillDTO> {
    protected businessKeyPropNames: (keyof QStaticBillDTO)[] = ['oid']

    constructor(db: DbConnection, // must have schema set via withSchema
                schemaName: SchemaName) {
        super(db, schemaName, 'static_bill', [
            'id', 'static_gov_state_fk', 'oid', 'session', 'name',
        ])
    }
}

export class QSnapBillDao extends QSnapDao<QSnapBillDTO> {
    protected businessKeyPropNames: (keyof QSnapBillDTO)[] = [
        'snap_gov_state_fk', 'static_bill_fk']

    constructor(db: DbConnection, // must have schema set via withSchema
                schemaName: SchemaName) {
        super(db, schemaName, 'snap_bill', ['snap_gov_state_fk', 'static_bill_fk'])
    }
}

// LEGI

export class QStaticLegiDao extends QStaticDao<QStaticLegiDTO> {
    protected businessKeyPropNames: (keyof QStaticLegiDTO)[] = ['oid']

    constructor(db: DbConnection, // must have schema set via withSchema
                schemaName: SchemaName) {
        super(db, schemaName, 'static_legi', [
            'id', 'static_gov_state_fk', 'oid', 'name',
        ])
    }
}

export class QSnapLegiDao extends QSnapDao<QSnapLegiDTO> {
    protected businessKeyPropNames: (keyof QSnapLegiDTO)[] = ['snap_gov_state_fk', 'static_legi_fk']

    constructor(db: DbConnection, // must have schema set via withSchema
                schemaName: SchemaName) {
        super(db, schemaName, 'snap_legi', ['snap_gov_state_fk', 'static_legi_fk'])
    }
}

// VOTE

export class QStaticVoteDao extends QStaticDao<QStaticVoteDTO> {
    protected businessKeyPropNames: (keyof QStaticVoteDTO)[] = ['oid']

    constructor(db: DbConnection, // must have schema set via withSchema
                schemaName: SchemaName) {
        super(db, schemaName, 'static_vote', [
            'static_bill_fk', 'static_chamber_fk',
        ])
    }
}

export class QSnapVoteDao extends QSnapDao<QSnapVoteDTO> {
    protected businessKeyPropNames: (keyof QSnapVoteDTO)[] = ['snap_gov_state_fk', 'static_vote_fk']

    constructor(db: DbConnection, // must have schema set via withSchema
                schemaName: SchemaName) {
        super(db, schemaName, 'snap_vote', ['snap_gov_state_fk', 'static_vote_fk'])
    }
}

// POST

export class QStaticPostDao extends QStaticDao<QStaticPostDTO> {
    protected businessKeyPropNames: (keyof QStaticPostDTO)[] = ['oid']

    constructor(db: DbConnection, // must have schema set via withSchema
                schemaName: SchemaName) {
        super(db, schemaName, 'static_post', [
            'division_oid',
            'division_name',
            'static_chamber_fk',

        ])
    }
}

export class QSnapPostDao extends QSnapDao<QSnapPostDTO> {
    protected businessKeyPropNames: (keyof QSnapPostDTO)[] = ['snap_gov_state_fk', 'static_post_fk']

    constructor(db: DbConnection, // must have schema set via withSchema
                schemaName: SchemaName) {
        super(db, schemaName, 'snap_post', ['snap_gov_state_fk', 'static_post_fk'])
    }
}


// POSTING

export class QStaticPostingDao extends QStaticDao<QStaticPostingDTO> {
    protected businessKeyPropNames: (keyof QStaticPostingDTO)[] = ['oid']

    constructor(db: DbConnection, // must have schema set via withSchema
                schemaName: SchemaName) {
        super(db, schemaName, 'static_posting', [
            'static_post_fk',
            'static_legi_fk',
        ])
    }
}

export class QSnapPostingDao extends QSnapDao<QSnapPostingDTO> {
    protected businessKeyPropNames: (keyof QSnapPostingDTO)[] = [
        'snap_gov_state_fk', 'static_posting_fk']

    constructor(db: DbConnection, // must have schema set via withSchema
                schemaName: SchemaName) {
        super(db, schemaName, 'snap_posting', ['snap_gov_state_fk', 'static_posting_fk'])
    }
}

