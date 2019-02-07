import * as osty from '@yeanay/yeanay-commons'
import {
    ChamberId,
    chamberOfOrg,
    Maybe,
    Motion,
    MotionType,
    OCDPersonId,
    PrimaryKey,
    Promise0,
    StateId,
    VoteOption,
    VoteValue,
} from '@yeanay/yeanay-commons'

import { mean, median } from 'mathjs'
import { LegiIdPkMap, SessionIdToPkMap, } from '../db/normal3/normal3Daos'
import {
    N3Bill as N3Bill,
    N3LegiVote as N3LegiVote,
    N3StateGov as N3StateGov,
    N3Vote as N3Vote,
} from '../db/normal3/normal3Schema'
import { Cursor } from '../db/rawGql/rawBillDao'
import { RawGqlBill } from '../db/rawGql/rawGqlTypes'
import { BillQFields, nodesOfEdges, VoteCountValue, VoteQFields, } from '../gql/types/gql-types'


import { RecordValidator } from '../validate/RecordValidator'

import * as val from '../validate/validate'
import { NProc, NProcConfig } from './nProc'
import { fResolveMotionType } from './transformMotion'

const metaRecord: osty.MetaRecord<BillQFields> = {
    describe: (instance: BillQFields) => {
        const { id, identifier } = instance
        return { id, identifier }
    },
    name    : 'raw_bill',
    names   : 'raw bills',
}

interface BadLegiReport {
    state_id: osty.StateId
    totalVoteLegs: number
    missingVoteLegs: number // voteLegs with legiId that yeanay doesn't know
    nullIdOnlyVoteLegs: number  // voteLegs with null legiId, but with name
    nullIdAndNameVoteLegs: number // both ID and name are empty
    nullNames: Set<string>
    missingIds: Set<string>
    // todo missingButInOS: Map<osty.LegiId, Raw1Legi>
}

interface StateReport {
    state_id: osty.StateId
    titleLengths: number[]
    votes: number
    voteLegis: number
}

const midnight = new Date()
midnight.setHours(0, 0, 0, 0)

const voteValueOfOption: { [o in VoteOption]: VoteValue } = {
    yes: VoteValue.YES, no: VoteValue.NO, other: VoteValue.OTHER,
}

export class N3BillsProc extends NProc {

    private readonly valor: RecordValidator<BillQFields>

    // recreated for each state
    private sessionIdToPkMap: SessionIdToPkMap

    // recreated for each state
    private legiIdPkMap: LegiIdPkMap

    private legiAliasToIdMap: Map<osty.LegiId, osty.LegiId>

    private stateReports: StateReport[] = []
    private badLegiReports: BadLegiReport[] = []  // for all states
    private badLegiReport: BadLegiReport // current state in progress

    private nVotesInState: number // votes seen in current state (roll call or not)

    private resolveMotionType: (m: Motion) => (MotionType | null)

    private state_id: StateId = 'xx'

    constructor(nprocConfig:NProcConfig) {
        super(nprocConfig, 'bill' )

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
        this.valor.stateId(state_id)
        this.state_id = state_id
        this.logger.info(`n3BillsProc: starting state ${state_id}`)

        this.nVotesInState = 0
        this.resolveMotionType = fResolveMotionType(state_id)

        const titleLengths: number[] = []
        // todo handle all_ids
        this.legiIdPkMap = await this.n3LegiDao.legiIdPkMap(state.id)
        this.sessionIdToPkMap = await this.n3SessionDao.sessionIdToPkMap(state.id)
        this.initBadLegiReport(state_id)

        const cursor = new Cursor()
        let billCount: number = 0
        let rawBills: RawGqlBill[] = []
        do {
            rawBills = await this.rawBillDao.getBillsOfState(state_id, cursor)
            billCount += rawBills.length
            for ( let rawBill of rawBills ) {
                const billUpdatedAt = new Date(rawBill.json.updatedAt)
                if ( billUpdatedAt >= this.since ) {
                    titleLengths.push(rawBill.json.title.length)
                    await this.processBill(rawBill.json as BillQFields)
                }
            }
        } while ( rawBills.length )

        if ( !billCount ) {
            this.errorSink.handleError({
                stateId : state_id,
                severity: val.VSeverity.Group,
                error   : new Error('no bills'),
            })
            return
        }
        const stateReport: StateReport = {
            state_id,
            titleLengths,
            votes    : this.nVotesInState,
            voteLegis: 0, // todo
        }
        this.stateReports.push(stateReport)
        this.badLegiReports.push(this.badLegiReport)

        if ( this.nVotesInState === 0 ) {
            this.errorSink.handleError({
                stateId : state_id,
                severity: val.VSeverity.Anomaly,
                error   : new Error('no votes'),
            })
        }
        // todo report on "no votes" per chamber

        this.logger.info(`nBillsProc: ending state ${state_id}`)
    }

    private reportStates(): void {
        console.log('state, empty, min, mean, median, max')
        for ( let { state_id, titleLengths } of this.stateReports ) {
            const nonEmpty = titleLengths.filter((l) => l > 0)
            const nEmpty = (titleLengths.length - nonEmpty.length) / titleLengths.length
            console.log(
                `${state_id}, ${nEmpty}, ${Math.min(...nonEmpty)}, ${mean(nonEmpty)}, ${median(
                    nonEmpty)}, ${Math.max(...nonEmpty)}`)
        }
    }

    private initBadLegiReport(state_id: osty.StateId): void {
        this.badLegiReport = {
            state_id,
            totalVoteLegs        : 0,
            missingVoteLegs      : 0,
            nullIdOnlyVoteLegs   : 0,
            nullIdAndNameVoteLegs: 0,
            nullNames            : new Set(),
            missingIds           : new Set(),
        }
    }

    private reportBadLegs(): void {
        /** for each state, report
         * - % of legi-bill-votes null, missing
         * - number of null legs
         * - - number with null names, number of unique names
         * - number of unique missing
         * - - in other term?  in this term but missing nevertheless?  missing altogether?
         *
         */
        console.log('')
        console.log('==== BAD VOTE LEG REPORT =========')
        console.log(
            // tslint:disable-next-line:max-line-length
            'state, totalVoteLegs, missingVoteLegs, nullIdOnyVoteLegs, nullIdAndNameVoteLegs, nullNameCount, missingIdCount, nullNameIds, missingIdNames')
        for ( let badRep of this.badLegiReports ) {
            const fields = [
                badRep.state_id,
                badRep.totalVoteLegs,
                badRep.missingVoteLegs,
                badRep.nullIdOnlyVoteLegs,
                badRep.nullIdAndNameVoteLegs,
                badRep.nullNames.size,
                badRep.missingIds.size,
                `"${[...badRep.nullNames].join(', ')}"`,
                `"${[...badRep.missingIds].join(', ')}"`,
            ]
            console.log(fields.join(','))
        }
        console.log('==== END BAD VOTE LEG REPORT =========')
        console.log('')
    }

    private async processBill(rawBill: BillQFields): Promise<void> {
        this.prevalidate(rawBill)
        if ( !this.valor.skip ) {
            const nBill = await this.transformAndReplace(rawBill)
        }
    }

    private async transformAndReplace(rawBill: BillQFields): Promise<PrimaryKey> {

        // add plain fields
        const nBill: Partial<N3Bill> = {
            session_fk      : this.sessionIdToPkMap.get(rawBill.legislativeSession.identifier),
            bill_id         : rawBill.id,
            bill_name       : rawBill.identifier,
            title           : rawBill.title,
            alternate_titles: rawBill.otherTitles,
            os_updated_at   : new Date(rawBill.updatedAt),
            subjects        : rawBill.subject || [],
            bill_types      : rawBill.classification,
        }

        const pkBill: PrimaryKey = (await this.n3BillDao.upsertByBusinessKey(nBill)).id

        for ( let rawVote of nodesOfEdges(rawBill.votes) ) {

            this.nVotesInState += 1

            const voteDate = new Date(rawVote.startDate)
            if ( voteDate >= midnight ) {
                console.log(`skipping future vote ${rawBill.id} @ ${rawVote.startDate}`)
                continue
            }
            const rawChamber = rawVote.organization.classification
            const chamber_id: Maybe<ChamberId> = chamberOfOrg(rawChamber, this.state_id)
            if ( !chamber_id ) {
                console.log(`skipping vote with chamber ${rawChamber}`)
                continue
            }
            const nVote: Partial<N3Vote> = {
                session_fk : this.sessionIdToPkMap.get(rawBill.legislativeSession.identifier),
                chamber_id,
                date       : voteDate,
                vote_id    : rawVote.id,
                passed     : rawVote.result === 'pass',
                motion     : rawVote.motionText,
                motion_type: this.resolveMotionType(rawVote.motionText),
                bill_fk    : pkBill,
                yes_count  : getCount(rawVote, 'yes'),
                no_count   : getCount(rawVote, 'no'),
                other_count: getCount(rawVote, 'other'),
                rollcall   : !!rawVote.votes.length,
            }
            const pkVote: PrimaryKey = (await this.n3VoteDao.upsertByBusinessKey(nVote)).id
            await this.recordLegiVotes(rawVote, pkVote)
        }

        return pkBill
    }

    private async recordLegiVotes(rawVote: VoteQFields, vote_fk: PrimaryKey): Promise0 {
        let nullLegs = 0
        let missingLegs = 0
        let totalLegs = 0

        const nDeleted = await this.n3LegiVoteDao.deleteVoteLegis(vote_fk)
        if ( nDeleted ) {
            console.log(`${nDeleted} old legiVotes deleted`)
        }

        const legiVotes: N3LegiVote[] = []
        for ( const rawLegiVote of rawVote.votes ) {
            const ocdLegiId: OCDPersonId = rawLegiVote.voter && rawLegiVote.voter.id
            if ( !ocdLegiId ) {
                continue // reported in prevalidate
            }
            const legi_fk = this.legiIdPkMap.get(rawLegiVote.voter.id)
            legiVotes.push({
                vote_fk,
                vote_value: voteValueOfOption[rawLegiVote.option],
                legi_fk   : legi_fk!,
            })
        }
        if ( legiVotes.length ) {
            try {
                await this.n3LegiVoteDao.batchInsert(legiVotes)
            } catch ( e ) {
                console.error('batchInsert failed: ' + e)
            }
        } else {
            console.log(`no recordable legiVotes for ${rawVote.id}`)
        }
        return
    }

    private prevalidate(rawBill: BillQFields): val.VSeverity {

        this.valor.target(rawBill)
            .verifyProps(
                'title',
                'id',
                'identifier',
                'classification',
                'otherIdentifiers',
                'otherTitles',
                'fromOrganization',
                'legislativeSession',
                'updatedAt',
                // todo uncomment 'subject',
                'votes'
            )
            .verifyStringLengths(255,
                'subject'
            )
            .verifyStringLengths(12000,
                'title',                    // tslint:disable-line:align
                'otherTitles'
            )


        this.valor.withSeverity(val.VSeverity.Warning, (v) => {
            if ( rawBill.votes ) {
                for ( let rawVote of nodesOfEdges(rawBill.votes) ) {
                    if ( !rawVote.votes.length ) {
                        continue
                    }
                    if ( rawVote.votes.every((pv)=>!pv.voter || !pv.voter.id) ) {
                        this.valor.verify(()=>'no legi ids for roll call')
                    } else {

                        for ( const legiVote of rawVote.votes ) {
                            this.valor
                                .verify(
                                    () => (legiVote.voter && legiVote.voter.id) ? null
                                        : 'missing legi_id on RawBillLegiVote for ' + legiVote.voterName)
                                .verify(
                                    () => legiVote.voterName ? null
                                        : 'missing name on RawBillLegiVote')
                        }
                    }
                }
            }

        })

        return this.valor.targetSeverity
    }
}

function getCount(rawVote: VoteQFields, option: VoteOption): number {
    const vcv: Maybe<VoteCountValue> = rawVote.counts.find(
        (c: VoteCountValue) => c.option === option)
    return (vcv) ? vcv.value : 0
}
