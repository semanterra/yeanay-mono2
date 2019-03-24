import { LegiId, Maybe, PrimaryKey, StateId, VoteValue } from '@yeanay/yeanay-commons'
import {
    N3Legi,
    N3StateGov,
    N3VoteView,
    PartyVoteCounts,
    VoteCountSet,
} from '../db/normal3/normal3Schema'
import { QContext } from '../db/quality/qcontext'
import { Enhancer, EnhancerConfig } from './Enhancer'

const emptyVoteSet: VoteCountSet = {[VoteValue.YES]: 0, [VoteValue.NO]: 0, [VoteValue.OTHER]: 0}

const voteSetNet = (vs: VoteCountSet) => vs[VoteValue.YES] - vs[VoteValue.NO]
const voteSetSum = (vs: VoteCountSet) => vs[VoteValue.YES] + vs[VoteValue.NO] + vs[VoteValue.OTHER]

// -1 means all voted no, 1 means all yes.
const voteSetNetRatio = (vs: VoteCountSet) =>
    voteSetNet(vs) / ((vs[VoteValue.YES] + vs[VoteValue.NO]) || 1)

interface VoteDateRange {
    first_vote_date: Date
    last_vote_date: Date
}

const now = new Date()

const updateVoteDateRange = (range: VoteDateRange | undefined, date: Date) => {
    if ( date > now ) {  // yes, there are future votes
        return range
    }
    if (!range) {
        return {first_vote_date: date, last_vote_date: date}
    }
    if (date < range.first_vote_date) {
        return {...range, first_vote_date: date}
    }
    if (date > range.last_vote_date) {
        return {...range, last_vote_date: date}
    }
    return range as VoteDateRange

}

interface LegiMapEntry {
    legi: N3Legi
    partisanNumer: number
    partisanDenom: number
}

export class VoteEnhancer extends Enhancer {

    private nVotesInState: number
    private legiMap: Map<PrimaryKey, LegiMapEntry> = new Map<PrimaryKey, LegiMapEntry>()
    private legiIdMap:Map<LegiId, N3Legi> = new Map<LegiId, N3Legi>()
    private legisInDupes:Set<PrimaryKey> = new Set<PrimaryKey>()

    private voteMap:Map<PrimaryKey, N3VoteView> = new Map<PrimaryKey, N3VoteView>()

    private stateVoteDateRange?: VoteDateRange
    private sessionVoteRanges:Map<PrimaryKey, VoteDateRange> = new Map<PrimaryKey, VoteDateRange>()

    constructor(enhancerConfig:EnhancerConfig, qContext:QContext) {
        super(enhancerConfig, 'vote', qContext)
    }

    public async processAll(): Promise<number> {
        const states = await this.n3StateDao.all()
        let nStates = 0
        for (let state of states) {
            await this.processState(state)
            nStates += 1
        }
        return nStates
    }

    public async processStateById(state_id: StateId): Promise<void> {
        const state: N3StateGov | null = await this.n3StateDao.findByStateId(state_id)
        if (state === null) {
            throw new Error(`Can't find state ${state_id}`)
        }
        return this.processState(state)
    }
    public async processState(state: N3StateGov): Promise<void> {
        console.log(`processState ${state.state_id}`)
        this.legiMap.clear()
        this.legiIdMap.clear()
        this.voteMap.clear()
        this.legisInDupes.clear()
        this.sessionVoteRanges.clear()

        this.stateVoteDateRange = undefined
        const {state_id} = state
        this.logger.info(`VoteEnhancer: starting state ${state_id}`)

        this.nVotesInState = 0

        const legiStreamResult =
            await this.n3LegiDao.reduceLegisOfState(state.id, this.processLegi1, true)
        console.log('after legi stream')
        const voteStreamResult =
            await this.n3VoteDao.reduceVotesOfState(state.id, this.processVote, true)
        console.log(`after vote stream, ${this.legiMap.size}`)

        for ( let [session_fk, voteDateRange] of this.sessionVoteRanges ) {
            this.n3SessionDao.update(session_fk, voteDateRange)
        }
        if ( this.stateVoteDateRange ) {
            this.n3StateDao.update(state.id, this.stateVoteDateRange)
        }
        for ( let [legi_fk, {legi, partisanNumer, partisanDenom}] of this.legiMap ) {
            const partisanity = partisanNumer / partisanDenom


            const legiVotes = await this.n3LegiVoteDao.allLegiVotesOfLegi(legi_fk)
            let activeNumer = 0
            const activeDenom = legiVotes.length
            let effectiveNumer = 0
            let effectiveDenom = 0
            for ( let legiVote of legiVotes ) {
                const margin = Math.abs(this.voteMap.get(legiVote.vote_fk)!.margin || 1)
                if ( legiVote.vote_value ) {
                    activeNumer += 1
                    effectiveNumer += margin
                }
                effectiveDenom += margin
                const vote = this.voteMap.get(legiVote.vote_fk)

            }
            const activeness = activeDenom? (activeNumer/activeDenom) : undefined
            const effectiveness = effectiveDenom? (effectiveNumer/effectiveDenom) : undefined
            this.n3LegiDao.update(legi_fk, {partisanity, activeness, effectiveness })
        }

        console.log(`done processState ${state.state_id}`)
    }

    private processLegi1 = async (_:any, legi: N3Legi) => {
        this.legiMap.set(legi.id, {legi, partisanNumer:0, partisanDenom:0})
        this.legiIdMap.set(legi.legi_id, legi)
        // console.log('legi')
        return undefined
    }

    private processVote = async(_:any, vote: N3VoteView) => {
        // console.log('begin vote')
        let demi_party_counts: PartyVoteCounts = {
            r: {...emptyVoteSet},
            d: {...emptyVoteSet},
            o: {...emptyVoteSet},
        }

        // update state and session date ranges
        this.stateVoteDateRange = updateVoteDateRange(this.stateVoteDateRange, vote.date!)
        const oldSessionDateRange = this.sessionVoteRanges.get(vote.session_fk)
        const newRange = updateVoteDateRange(oldSessionDateRange, vote.date!)
        if ( newRange ) {
            this.sessionVoteRanges.set(
                vote.session_fk, newRange)
        }

        // make demi_party_counts
        const legiVotes = await this.n3LegiVoteDao.allLegiVotesOfVote(vote.id!)
        for (let legiVote of legiVotes) {
            const legiMapEntry: Maybe<LegiMapEntry> = this.legiMap.get(legiVote.legi_fk)
            const legi = legiMapEntry!.legi
            demi_party_counts[legi!.demi_party!][legiVote.vote_value] += 1
        }
        // compute other enhanced vote fields
        const total_vote_count = vote.yes_count! + vote.no_count! + vote.other_count!
        const margin = vote.yes_count! - vote.no_count!

        const activeness = (vote.yes_count! + vote.no_count!) / (total_vote_count || 1)
        const netRVoteRatio = voteSetNetRatio(demi_party_counts.r)
        const netDVoteRatio = voteSetNetRatio(demi_party_counts.d)
        const partisanity = ( netRVoteRatio - netDVoteRatio ) * activeness / 2
        const updates = {partisanity, total_vote_count, margin, demi_party_counts}

        // store vote enhancement
        vote.partisanity = partisanity
        vote.total_vote_count = total_vote_count
        vote.margin = margin
        vote.demi_party_counts = demi_party_counts
        this.voteMap.set(vote.id!, {...vote, ...updates})
        await this.n3VoteDao.update(vote.id!, updates)

        // walk through legiVotes again, adding partisanity * 1 or -1 to each legi's partisanity numerator
        for (let legiVote2 of legiVotes) {
            if ( legiVote2.vote_value ) {
                const pValue = legiVote2.vote_value * partisanity
                const fk = legiVote2.legi_fk
                const mapEntry = this.legiMap.get(fk)!
                mapEntry.partisanNumer += pValue
                mapEntry.partisanDenom += Math.abs(partisanity)
            }
        }

        // console.log('end vote')
        return undefined
    }

}

