import {
    OCDBillId,
    OCDMembershipId,
    OCDOrganizationId,
    OCDPersonId,
    OCDPostId,
    OCDVoteId,
    ChamberId,
} from '@yeanay/yeanay-commons'
import { BoxPlot } from '../db/quality/qualityDtos'

export interface MetricDef<T> {
    index: number
    label: string
    description: string
}

export interface FlagDef<T> extends MetricDef<T> {
}

export interface IntDef<T> extends MetricDef<T> {
}

export interface DateDef<T> extends MetricDef<T> {
}

export interface FloatDef<T> extends MetricDef<T> {
}

export interface BoxPlotDef<T> extends MetricDef<T> {
}

export interface IReporter<T> {
    flag(flag: FlagDef<T>, value?: boolean): void

    inc(int: IntDef<T>, value?: number): void

    int(int: IntDef<T>, value: number): void

    boxPlot(b: BoxPlotDef<T>, value: BoxPlot): void

    date(date: DateDef<T>, value: Date): void

    done(): void
}

export interface ReporterDefs<T> {
    flag?: { [k: string]: FlagDef<T> }
    int: { [k: string]: IntDef<T> }
    date: { [k: string]: DateDef<T> }
    float: { [k: string]: FloatDef<T> }
    boxPlot: { [k: string]: BoxPlotDef<T> }
}

export interface IStateReporter extends IReporter<IStateReporter> {
    newChamber(oid: OCDOrganizationId, name: ChamberId): Promise<IChamberReporter>

    // todo newBill(oid: OCDBillId, name:string): Promise<IBillReporter>
}

function makeDefs<T extends IReporter<T>, K extends string, DEF extends MetricDef<T>>(
    defs: {[k in K]: DEF}): {[k in K]: DEF} {
    return defs
}

export const stateReporterDefs = {
    flag: {
        testFlag0: {index:0, description:'desc0',label:'label0'},
        testFlag1: {index:1, description:'desc1',label:'label1'},
    },
    int: {
        testInt0: {index:0, description:'desc0',label:'label0'},
        testInt1: {index:1, description:'desc1',label:'label1'},
    },
    date: {
        testDate0: {index:0, description:'desc0',label:'label0'},
        testDate1: {index:1, description:'desc1',label:'label1'},
    },
    float: {
        testFloat0: {index:0, description:'desc0',label:'label0'},
        testFloat1: {index:1, description:'desc1',label:'label1'},
    },
    boxPlot: {
        testBoxPlot0: {index:0, description:'desc0',label:'label0'},
        testBoxPlot1: {index:1, description:'desc1',label:'label1'},
    },
}

export interface IChamberReporter extends IReporter<IChamberReporter> {
    // todo newLegi(oid: OCDPersonId, name:string): Promise<ILegiReporter>
    // todo newPost(oid: OCDPostId, name:string): Promise<IPostReporter>
}

export interface IBillReporter extends IReporter<IBillReporter> {
    // todo newVote(oid: OCDVoteId, name:string): Promise<IVoteReporter>
}

export interface ILegiReporter extends IReporter<ILegiReporter> {
    // todo newPosting(oid: OCDMembershipId, name:string): Promise<IPostingReporter>
}

export interface IVoteReporter extends IReporter<IVoteReporter> {
// todo consider    newLegiVote(): ILegiVoteReporter
}

export interface IPostReporter extends IReporter<IPostReporter> {

}

export interface IPostingReporter extends IReporter<IPostingReporter> {
}

// Consider whether to roll this into VoteReporter
export interface ILegiVoteReporter extends IReporter<ILegiVoteReporter> {
}

