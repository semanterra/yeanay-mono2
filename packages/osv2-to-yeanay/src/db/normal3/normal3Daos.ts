import {
    ChamberId,
    IDed,
    LegiId,
    OCDDivisionId,
    Ordinal,
    PrimaryKey,
    Promise0,
    SessionId,
    StateId,
} from '@yeanay/yeanay-commons'
import { ColumnSet, Dao, DbConnection, SchemaName } from '@yeanay/yeanay-daoist'
import { fromPairs } from 'lodash'

import {
    N3Bill,
    N3District,
    N3Legi,
    N3LegiVote,
    N3MemberRole,
    N3StateGov,
    N3StateSession,
    N3Vote,
    N3VoteView,
} from './normal3Schema'

export enum TableName {
    bill = 'bill',
    district = 'district',
    district_shape = 'district_shape',
    state_gov = 'state_gov',
    legi = 'legi',
    member_role = 'member_role',
    state_session = 'state_session',
    state_session_view = 'state_session_view',
    state_term = 'state_term',
    vote = 'vote',
    vote_view = 'vote_view',
    legi_vote = 'legi_vote',
}


const standardFields = ['?id', '?created_at', '?updated_at']
export class N3StateGovDao extends Dao<N3StateGov> {

    protected businessKeyPropNames: (keyof N3StateGov)[] = ['state_id']

    constructor(conn: DbConnection, schemaName:SchemaName) {
        super(conn, schemaName, TableName.state_gov, [
            'state_id',
            'capitol_timezone',
            'feature_flags',
            'latest_update',
            'legislature_name',
            'legislature_url',
            'name',
            'id',
            'created_at',
            'updated_at',

            'first_vote_date',
            'last_vote_date',

        ])
    }

    public async all(): Promise<(N3StateGov & IDed)[]> {
        return this.q().select().orderBy('state_id')
    }

    // Tries to find a state by state id
    public async findByStateId(state_id: StateId): Promise<N3StateGov | null> {
        const rows: N3StateGov[] = await this.q().select().where({ state_id })
        return rows[0] || null
    }

    public async deleteByStateId(state_id: StateId): Promise<number> {
        return this.q().where({ state_id }).delete()
    }

}

/*
export class N3StateTermDao extends Dao<N3StateTerm> {

    protected businessKeyPropNames: (keyof N3StateTerm)[] = ['state_fk', 'term_id']

    constructor(ctx: DaoContext) {
        super(ctx, SchemaRole.normal3Schema, TableName.state_term, [
            'term_id',
            'start_year',
            'end_year',
            'id',
            'created_at',
            'updated_at',
            'state_fk',
        ])
    }

    public async allKeysOfState(state_fk: PrimaryKey): Promise<N3StateTerm[]> {
        return this.q().select(this.allKeyColumns()).where({ state_fk })
    }

    public async termIdToPkMap(pkState: PrimaryKey): Promise<TermIdToPkMap> {
        const keys = await this.allKeysOfState(pkState)
        const map: TermIdToPkMap = new Map()
        keys.forEach(k => map.set(k.term_id, k.id))
        return map
    }
}
*/

export interface StateSessionView extends N3StateSession {
    term_pk: PrimaryKey
    state_pk: PrimaryKey
    state_id: StateId
}

export type SessionIdToPkMap = Map<SessionId, PrimaryKey>

export class N3StateSessionDao extends Dao<N3StateSession> {

    protected businessKeyPropNames: (keyof N3StateSession)[] = ['state_fk', 'session_id']

    constructor(conn:DbConnection, schemaName:SchemaName) {
        super(conn, schemaName, TableName.state_session, [
            'session_id',
            'name',
            'type',
            'start_date',
            'end_date',
            'id',
            'created_at',
            'updated_at',
            'state_fk',

            'first_vote_date',
            'last_vote_date',
        ])
    }

    public async allKeysOfState(state_pk: PrimaryKey): Promise<StateSessionView[]> {
        return this.q(TableName.state_session_view).select(this.allKeyColumns()).where(
            { state_pk })
    }

    public async sessionIdToPkMap(pkState: PrimaryKey): Promise<SessionIdToPkMap> {
        const keys = await this.allKeysOfState(pkState)
        const map: SessionIdToPkMap = new Map()
        keys.forEach((k) => map.set(k.session_id, k.id))
        return map
    }

}

export type DistrictNameToIdMap = { [key in ChamberId]: Map<string, PrimaryKey> }

export interface ActiveSeatUsage {
    num_legs: number,
    num_seats: number,
    chamber_id: ChamberId,
    district_name: string,
    legi_names: string
}

export class N3DistrictDao extends Dao<N3District> {

    protected businessKeyPropNames: (keyof N3District)[] = ['state_fk', 'chamber_id', 'division_id']

    constructor(conn:DbConnection, schemaName:SchemaName) {
        super(conn, schemaName, TableName.district, [
            'division_id',
            'district_name',
            'state_fk',
            'chamber_id',
            'num_seats',
            'id',
            'created_at',
            'updated_at',
            'bbox',
            'floterial_fk',
            'is_floterial',
        ])
    }

    public async allKeysOfState(state_fk: PrimaryKey): Promise<N3District[]> {
        return this.q().select([...this.allKeyColumns(), 'district_name']).where({ state_fk })
    }

    public async findByDivisionId(division_id: OCDDivisionId): Promise<N3District> {
        const districts = await this.q().select().where({ division_id })
        return districts.length===1 ? districts[0] : undefined
    }

    public async allOfState(state_fk: PrimaryKey): Promise<N3District[]> {
        return this.q().select().where({state_fk})
    }

    public async activeSeatUsage(pkState: PrimaryKey): Promise<ActiveSeatUsage[]> {

        return this.q().select([
            this.db.raw(`count(${this.schemaName}.legi.id)::int AS num_legs`),
            'district.num_seats',
            'district.chamber_id',
            'district.district_name',
            this.db.raw(`string_agg(${this.schemaName}.legi.last_name, ', ') as legi_names`),
        ]).from(TableName.legi)

            .join(TableName.state_gov, 'legi.state_fk', 'state_gov.id')
            .join(TableName.member_role, 'member_role.legi_fk','legi.id')
            .join(TableName.district, 'member_role.district_fk', 'district.id')

            .where({ 'state_gov.id': pkState, 'member_role.active': true })
            .groupBy('district.id')
    }
}

export type LegiIdOrdinalMap = Map<LegiId, Ordinal>
export type LegiIdPkMap = Map<LegiId, PrimaryKey>

export class N3LegiDao extends Dao<N3Legi> {

    protected businessKeyPropNames: (keyof N3Legi)[] = ['legi_id']

    constructor(conn:DbConnection, schemaName:SchemaName) {
        super(conn, schemaName, TableName.legi, [
            'legi_id',
            'state_fk',
            'chamber_id',
            'district_fk',
            'party_id',
            'name',
            'sort_name',
            'first_name',
            'last_name',
            'ordinal',
            'image',
            'os_updated_at',
            'id',
            'demi_party',
            'offices',
            'committees',
            'partisanity',
            'activeness',
            'effectiveness',
            'weighted_activeness',
        ])
    }

    public async allKeysOfState(state_fk: PrimaryKey): Promise<N3Legi[]> {
        return this.q().select(...this.allKeyColumns()).where({ state_fk })
    }

    public async legiIdOrdinalMap(pkState: PrimaryKey): Promise<LegiIdOrdinalMap> {
        const keySets = await this.allKeysOfState(pkState)
        const lMap: LegiIdOrdinalMap = new Map()
        keySets.forEach((l) => lMap.set(l.legi_id, l.ordinal))
        return lMap
    }

    public async legiIdPkMap(pkState: PrimaryKey): Promise<LegiIdPkMap> {
        const keySets = await this.allKeysOfState(pkState)
        const lMap: LegiIdOrdinalMap = new Map()
        keySets.forEach((l) => lMap.set(l.legi_id, l.id))
        return lMap
    }

    public async reduceLegisOfState<T>(state_fk: PrimaryKey,
                                       rowProc: (memo: T, legi: N3Legi) => T,
                                       initial: T,
                                       columnSet?: ColumnSet<N3Legi>,): Promise<T> {
        return this.q().select(columnSet!).where({ state_fk }).reduce(rowProc, initial)
    }

}

export class N3MemberRoleDao extends Dao<N3MemberRole> {

    protected businessKeyPropNames: (keyof N3MemberRole)[] =
        ['legi_fk', 'chamber_id', 'district_fk']

    constructor(conn:DbConnection, schemaName:SchemaName) {
        super(conn, schemaName, TableName.member_role, [
            'legi_fk',
            'district_fk',
            'chamber_id',
            'active',
            'start_date',
            'end_date',
            'party_id',
            'id',
        ])
    }
}

export class N3BillDao extends Dao<N3Bill> {

    protected businessKeyPropNames: (keyof N3Bill)[] = ['bill_id']

    constructor(conn:DbConnection, schemaName:SchemaName) {
        super(conn, schemaName, TableName.bill, [
            'session_fk',
            'bill_id',
            'bill_name',
            'title',
            'alternate_titles',
            'os_updated_at',
            'subjects',
            'bill_types',
            'id',
        ])
    }
}

export class N3VoteDao extends Dao<N3Vote> {

    protected businessKeyPropNames: (keyof N3Vote)[] = ['vote_id']

    constructor(conn:DbConnection, schemaName:SchemaName) {
        super(conn, schemaName, TableName.vote, [
            'session_fk',
            'chamber_id',
            'date',
            'vote_id',
            'passed',
            'motion',
            'motion_type',
            'bill_fk',
            'yes_count',
            'no_count',
            'other_count',
            'rollcall',
            'id',

            'partisanity',
            'demi_party_counts',
            'total_vote_count',
            'margin',
        ])
    }

    public async reduceVotesOfState<T>(state_fk: PrimaryKey,
                                       rowProc: (memo: T, vote: N3VoteView) => T,
                                       initial?: T): Promise<T> {
        return this.q(TableName.vote_view)
            .where({ state_fk })
            .reduce(rowProc, initial)
    }

}

export class N3LegiVoteDao extends Dao<N3LegiVote> {

    protected businessKeyPropNames: (keyof N3LegiVote)[] = ['vote_fk', 'legi_fk']

    constructor(conn:DbConnection, schemaName:SchemaName) {
        super(conn, schemaName, TableName.legi_vote, [
            'legi_fk',
            'vote_fk',
            'vote_value',
        ])
    }

    public async allLegiVotesOfVote(vote_fk: PrimaryKey): Promise<N3LegiVote[]> {
        return this.q().select([...this.allKeyColumns(), 'vote_value']).where({vote_fk})
    }

    public async allLegiVotesOfLegi(legi_fk: PrimaryKey): Promise<N3LegiVote[]> {
        return this.q().select([...this.allKeyColumns(), 'vote_value']).where({legi_fk})
    }

    public async deleteVoteLegis(vote_fk: PrimaryKey): Promise<Number> {
        return this.q().del().where({vote_fk})
    }

    public async batchInsert(voteLegis: N3LegiVote[]): Promise0 {
        return this.q().insert(voteLegis)
    }
}
