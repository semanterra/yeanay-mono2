import { startOfToday } from 'date-fns'
import { StateReporter } from '../../validate/reporterImpl'
import {
    QSnapBillDao,
    QSnapChamberDao,
    QSnapDao,
    QSnapLegiDao,
    QSnapPostDao, QSnapPostingDao,
    QSnapStateDao,
    QSnapVoteDao,
    QStaticBillDao,
    QStaticChamberDao,
    QStaticDao,
    QStaticLegiDao,
    QStaticPostDao,
    QStaticPostingDao,
    QStaticStateDao,
    QStaticVoteDao,
} from './qualityDaos'
import { QSnapDTO, QStaticDTO } from './qualityDtos'
import {
    IDed, NullOr, OCDBillId, OCDOrganizationId, OCDPersonId, OCDPostId, OCDMembershipId,
    OCDVoteId,
    PrimaryKey,
    StateId,
    Promise0,
    OCDId,
    WithoutId,
    ChamberId,
} from '@yeanay/yeanay-commons'
import { connectDb, DbConnection, SchemaName } from '@yeanay/yeanay-daoist'


export type QEntityName = 'govState' | 'chamber' | 'bill' | 'vote' | 'legi' | 'post' | 'posting'

interface StaticDaos {
    govState: QStaticStateDao
    chamber: QStaticChamberDao
    bill: QStaticBillDao
    vote: QStaticVoteDao
    legi: QStaticLegiDao
    post: QStaticPostDao
    posting: QStaticPostingDao
}

interface SnapDaos {
    govState: QSnapStateDao
    chamber: QSnapChamberDao
    bill: QSnapBillDao
    vote: QSnapVoteDao
    legi: QSnapLegiDao
    post: QSnapPostDao
    posting: QSnapPostingDao
}

export interface QContext {
    staticDaos: StaticDaos
    snapDaos: SnapDaos
    startDateBegin: Date
}


export function makeQContext(conn: DbConnection, schema: SchemaName): QContext {
    const startDateBegin = startOfToday()
    const ret: QContext = {
        staticDaos: {
            govState: new QStaticStateDao(conn, schema),
            chamber : new QStaticChamberDao(conn, schema),
            bill    : new QStaticBillDao(conn, schema),
            vote    : new QStaticVoteDao(conn, schema),
            legi    : new QStaticLegiDao(conn, schema),
            post    : new QStaticPostDao(conn, schema),
            posting : new QStaticPostingDao(conn, schema),
        },
        snapDaos  : {
            govState: new QSnapStateDao(conn, schema),
            chamber : new QSnapChamberDao(conn, schema),
            bill    : new QSnapBillDao(conn, schema),
            vote    : new QSnapVoteDao(conn, schema),
            legi    : new QSnapLegiDao(conn, schema),
            post    : new QSnapPostDao(conn, schema),
            posting : new QSnapPostingDao(conn, schema),
        },

        startDateBegin,   // beginning of day of run, UTC I think


    }

    return ret

}

export async function makeStateReporter(oid: string, name: StateId, bNew: boolean,
                                        qcontext: QContext): Promise<StateReporter> {
    const reporter = new StateReporter(bNew, qcontext)
    await reporter.init(name, oid, qcontext.startDateBegin)
    return reporter
}

