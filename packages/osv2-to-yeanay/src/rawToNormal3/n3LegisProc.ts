import * as osty from '@yeanay/yeanay-commons'
import {
    ChamberId,
    chamberOfOrg,
    DemiParty,
    OCDChamberId,
    OCDDivisionId,
    OCDOrganizationId,
    PartyId,
    PrimaryKey,
    Promise0,
    StateId,
} from '@yeanay/yeanay-commons'
import { ActiveSeatUsage } from '../db/normal3/normal3Daos'
import {
    N3District,
    N3Legi,
    N3LegiOffice,
    N3MemberRole,
    N3StateGov as N2StateGov,
    N3StateGov,
} from '../db/normal3/normal3Schema'
import { ChamberIdMap, RawGqlLegislator, RawGqlOrganization } from '../db/rawGql/rawGqlTypes'

import { ContactQFields, LegislatorQFields, MembershipQFields } from '../gql/types/gql-types'

import { RecordValidator } from '../validate/recordValidator'
import * as val from '../validate/validate'
import { NProc, NProcConfig } from './nProc'

/*
// Hypothesized content; prevalidate checks to be sure

export interface RawLegiOffice {
    type: OfficeType
    name: string
    address: string
    phone: string
    fax: string
    email: string
}

interface RawLegiJsonAny extends RawLegiJson {
    active: boolean
    chamber: osty.ChamberId
    district: string // state-specific name, not ID!
    party: osty.PartyId
    email: string
    full_name: string
    first_name: string
    middle_name: string
    last_name: string
    suffixes: string
    photo_url: string
    url: string
    created_at: Date
    updated_at: Date
    roles: RawRole[]
    offices?: RawLegiOffice[]
    all_ids: osty.LegiId[]
}

// Hypothesized content: prevalidate checks
type RawRole = RawMemberRole | RawCommitteeRole

interface RawBaseRole {
    term: osty.TermId
    chamber: osty.ChamberId
    state: osty.StateId
    start_date?: Date
    end_date?: Date
}

interface RawMemberRole extends RawBaseRole {
    type: 'member'      // discriminated union
    party: osty.PartyId
    district: osty.DistrictId
}

interface RawCommitteeRole extends RawBaseRole {
    type: 'committee member'      // discriminated union
    committee: string
    subcommittee?: string
    committee_id: string
    position: string
}
*/

const metaRecord: osty.MetaRecord<LegislatorQFields> = {
    describe: (instance: LegislatorQFields) => {
        const { id, name } = instance
        return { id, name }
    },
    name    : 'raw_legi',
    names   : 'raw legs',
}

function party2DemiParty(party: PartyId): DemiParty | undefined {
    // backlog: consider mapping Green, Libertarian
    if ( !party ) {
        return undefined
    }
    if ( party === 'Republican' ) {
        return 'r'
    }
    if ( party.includes('Democrat') ) {
        return 'd'
    }
    return 'o'
}

interface MembershipData { // data mined from memberships
    demi_party: DemiParty | undefined
    memberRoles: Partial<N3MemberRole>[] | undefined
    district_fk: PrimaryKey | undefined
    party_id: PartyId | undefined
    chamber_id: ChamberId | undefined
}

const mapContactTypeToOfficeField = {
    voice  : 'phone',
    address: 'address',
    email  : 'email',
    fax    : 'fax',
}

function makeChamberIdMap(rawChambers: RawGqlOrganization[], stateId:StateId): ChamberIdMap {

    const pairs = rawChambers.map<[OCDOrganizationId, ChamberId]>(
        (c) => [c.id, chamberOfOrg(c.classification as OCDChamberId, stateId)!])
    return new Map(pairs)
}

export class N3LegisProc extends NProc {

    private readonly valor: RecordValidator<LegislatorQFields>

    // reset for each state; next ordinal to assign
    private nextOrdinal: number

    private chamberIdMap: ChamberIdMap
    private chamberOrgIds: OCDOrganizationId[]

    private state_id: StateId

    constructor(nprocConfig: NProcConfig) {
        super(nprocConfig, 'legi')

        this.valor = new RecordValidator(
            {
                errorSink: this.errorSink,
                metaRecord,
                severity : val.VSeverity.Record,
            }
        )
    }

    public async processState(state: N3StateGov): Promise<void> {
        const { state_id } = state
        this.state_id = state_id
        this.valor.stateId(state_id)
        this.logger.info(`NLegsProc: starting state ${state_id}`)

        this.nextOrdinal = 1

        const chamberOrgs = await this.rawOrgDao.getChambersOfState(state_id)
        this.chamberIdMap = makeChamberIdMap(chamberOrgs, state_id)
        this.chamberOrgIds = chamberOrgs.map((rawOrg: RawGqlOrganization) => rawOrg.id)


        const rawLegs: RawGqlLegislator[] = await this.rawLegiDao.getLegisOfState(state_id)
        if ( !rawLegs.length ) {
            this.errorSink.handleError({
                stateId : state_id,
                severity: val.VSeverity.Group,
                error   : new Error('no legislators'),
            })
            return
        }

        for ( let rawLegi of rawLegs ) {
            await this.processLegi(rawLegi.json, state)
        }
        this.logger.info(`NLegsProc: ending state ${state_id}`)

        await this.checkLegiDistricts(state.id, state_id)

        // todo create chamber records
        // todo select distinct state_id, chamber_id from normal2.legi as legi
        // todo join normal2.state_gov as state on legi.state_fk=state.id where state_id=${state_id}
    }

    private async processLegi(rawLegi: LegislatorQFields, state: N2StateGov): Promise<void> {
        // todo screen for active

        this.prevalidate(rawLegi)
        if ( !this.valor.skip ) {
            const membershipData: MembershipData | undefined = await this.mineMembershipData(
                rawLegi)

            const offices: N3LegiOffice[] = this.mineOffices(rawLegi.contactDetails)

            if ( membershipData ) {
                await this.transformAndReplace(rawLegi, state, membershipData, offices)
            }
        }
    }

    private mineOffices(contacts: ContactQFields[]): N3LegiOffice[] {
        const offices: { r: RegExp, t: N3LegiOffice | null }[] = [
            { r: /^District*/i, t: { type: 'district' } },
            { r: /^Capitol*/i, t: { type: 'capitol' } },
            { r: /^E(\-)?mail/i, t: null },
            { r: /^/i, t: null },
        ]
        for ( const contact of contacts ) {
            const officePair = offices.find((op) => op.r.test(contact.note))
            if ( !officePair ) {
                console.log('Unknown contact note: ' + contact.note)
                continue
            }
            const office = officePair.t
            if ( office === null ) {
                continue
            }
            const officeField = mapContactTypeToOfficeField[contact.type]
            if ( !officeField ) {
                console.log('Unknown contact type: ' + contact.type)
                continue
            }
            office[officeField] = contact.value
        }
        // remove any offices with only a "type" field
        const ret = offices.map((o) => o.t).filter(
            (o: N3LegiOffice | null) => o && Object.keys(o).length > 1) as N3LegiOffice[]
        return ret
    }

    private async mineMembershipData(rawLegi: LegislatorQFields): Promise<MembershipData | undefined> {
        // important that current mems are first; "miners" depend on it
        const mems: MembershipQFields[] = [...rawLegi.currentMemberships, ...rawLegi.oldMemberships]
        const party_id = this.minePartyId(mems)
        const currentMemberRoles = await this.mineMemberRoles(rawLegi.currentMemberships, party_id, true)
        this.valor.verify((_) => (currentMemberRoles.length < 2) ? null : 'multiple active roles')
        const oldMemberRoles = await this.mineMemberRoles(rawLegi.oldMemberships, party_id, false)

        if ( 0 === (currentMemberRoles.length + oldMemberRoles.length) ) {
            return undefined
        }
        const firstRole = currentMemberRoles.length ? currentMemberRoles[0] : oldMemberRoles[0]

        const chamber_id = this.mineChamberId(mems)
        const demi_party = party_id ? party2DemiParty(party_id) : undefined
        const district_fk = firstRole.district_fk
        const memberRoles = [...currentMemberRoles, ...oldMemberRoles]

        return { party_id, demi_party, memberRoles, district_fk, chamber_id }
    }

    private mineChamberId(mems: MembershipQFields[]): ChamberId | undefined {
        const chamberMems = mems.filter(
            (mem: MembershipQFields) => chamberOfOrg(mem.organization.classification, this.state_id))
        this.valor.verify((_) => (chamberMems.length > 0) ? null : 'no chamber')

        return (chamberMems.length > 0) ? chamberOfOrg(chamberMems[0].organization.classification, this.state_id) : undefined
    }

    private minePartyId(mems: MembershipQFields[]): PartyId | undefined {
        const partyMems = mems.filter(
            (mem: MembershipQFields) => mem.organization.classification === 'party')
        this.valor.verify((_) => (partyMems.length > 0) ? null : 'no party')


        return (partyMems.length > 0) ? partyMems[0].organization.name : undefined
    }

    private async mineMemberRoles(mems: MembershipQFields[],
                                  party_id: PartyId|undefined, active: boolean):
        Promise<Partial<N3MemberRole>[]> {
        // find membership that's a chamber, alarm if more than one.

        const chamberMems = mems.filter(
            (mem: MembershipQFields) => this.chamberOrgIds.includes(mem.organization.id))
        const ret: Partial<N3MemberRole>[] = []

        for ( let chamberMem of chamberMems ) {
            const division_id: OCDDivisionId = chamberMem.post!.division!.id
            const district: N3District = await this.n3DistrictDao.findByDivisionId(division_id)

            const chamber_id = chamberOfOrg(chamberMem.organization.classification as OCDChamberId, this.state_id)
            // all but legi_fk, id, and timestamps
            const memberRole: Partial<N3MemberRole> = {
                district_fk: district.id,
                chamber_id,
                start_date : null,
                end_date   : null,
                party_id   : party_id || undefined,
                active,
            }
            ret.push(memberRole)
        }
        return ret
    }

    private async transformAndReplace(rawLegi: LegislatorQFields,
                                      state: N3StateGov, membershipData: MembershipData,
                                      offices: N3LegiOffice[]): Promise<PrimaryKey> {
        // console.log('hello')

        const {
            demi_party,
            memberRoles,
            district_fk,
            party_id,
            chamber_id,
        } = membershipData

        const nLegi: Partial<N3Legi> = {
            state_fk     : state.id,
            legi_id      : rawLegi.id,
            chamber_id,
            district_fk,
            party_id,
            name         : rawLegi.name,
            sort_name    : rawLegi.sortName || `${rawLegi.familyName}, ${rawLegi.givenName}`,
            first_name   : rawLegi.givenName!,
            last_name    : rawLegi.familyName,
            ordinal      : this.nextOrdinal,
            image        : rawLegi.image,
            os_updated_at: new Date(rawLegi.updatedAt),
            demi_party,
            offices      : JSON.stringify(offices) as any,
            committees   : '[]' as any, // todo
        }
        this.nextOrdinal += 1

        try {
            const pkLegi = (await this.n3LegiDao.upsertByBusinessKey(nLegi)).id
            memberRoles!.forEach((role)=>role.legi_fk = pkLegi)
            await this.n3MemberRoleDao.upsertArrayByBusinessKey(memberRoles!)
            return pkLegi
        } catch (e) {
            throw e // for breakpointing
        }
    }


    private prevalidate(rawLegi: LegislatorQFields): val.VSeverity {

        this.valor.target(rawLegi)
            .verifyProps(
                'id',                   // tslint:disable-line:align
                'sortName',
                'familyName',
                'givenName',
                'contactDetails',
                'currentMemberships'
            )
        return this.valor.targetSeverity
    }

    private async checkLegiDistricts(pkState: PrimaryKey, state_id: osty.StateId): Promise0 {
        // check for districts with too many or too few active legislators
        const activeSeatUsage: ActiveSeatUsage[] = await this.n3DistrictDao.activeSeatUsage(
            pkState)
        for ( let { num_legs, num_seats, district_name, chamber_id, legi_names } of activeSeatUsage ) {
            const diff = num_legs - num_seats
            if ( diff ) {
                const manyFew = diff > 0 ? 'many' : 'few'
                const error = new Error(`District ${chamber_id} ${district_name} has ${Math.abs(
                    diff)} too ${manyFew} active legislators: ${legi_names}`)
                // a seat may be vacant (anomaly) but should never have more than one active legi
                this.errorSink.handleError({
                    stateId : state_id,
                    severity: diff > 0 ? val.VSeverity.Warning : val.VSeverity.Anomaly,
                    error,
                })
            }
        }

    }
}

