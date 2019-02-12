import { NullOr, StateId, IDed, OCDJurisdictionId, OCDOrganizationId, OCDBillId, OCDPersonId,
    OCDPostId,
    OCDVoteId,
    OCDMembershipId} from '@yeanay/yeanay-commons'
import { Dao } from '@yeanay/yeanay-daoist'
import { ValErrorLogEntry } from '../db/quality/logSchema'

interface MetricDef<T> {
    index: number
}

interface FlagDef<T> extends MetricDef<T> {}
interface IntDef<T> extends MetricDef<T> {}
interface CountDef<T> extends MetricDef<T> {}

interface IReporter<T> {
    flag(flag:FlagDef<T>, value?:boolean): void
    inc(int:CountDef<T>, value?:number) : void
    int(int:IntDef<T>, value:number) : void
    done(): void
}

interface IStateReporter extends IReporter<IStateReporter> {
    newChamber(oid: OCDOrganizationId, name:string): IChamberReporter
    newBill(oid: OCDBillId, name:string): IBillReporter
}

interface IChamberReporter extends IReporter<IChamberReporter> {
    newLegi(oid: OCDPersonId, name:string): ILegiReporter
    newPost(oid: OCDPostId, name:string): IPostReporter
}

interface IBillReporter extends IReporter<IBillReporter> {
    newVote(oid: OCDVoteId, name:string): IVoteReporter
}

interface ILegiReporter extends IReporter<ILegiReporter> {
    newPosting(oid: OCDMembershipId, name:string): IPostingReporter
}

interface IVoteReporter extends IReporter<IVoteReporter> {
    newLegiVote(): ILegiVoteReporter
}

interface IPostReporter extends IReporter<IPostReporter> {
}

interface IPostingReporter extends IReporter<IPostingReporter> {
}

// Consider whether to roll this into VoteReporter
interface ILegiVoteReporter extends IReporter<ILegiVoteReporter> {
}

type QEntityName = 'govState' | 'chamber' | 'bill' | 'vote' | 'legi' | 'post' | 'posting'

type DaoSet<T> = {[k in QEntityName]: T}



// STATIC

interface QStaticDTO extends IDed {
    oid: string
    name: string

}

abstract class QStaticDao<T extends QStaticDTO> extends Dao<T> {
}



// SNAP


interface QSnapDTO extends IDed {
    bools: NullOr<Boolean>[]

}
abstract class QSnapDao<T extends QSnapDTO> extends Dao<T> {
}


interface StaticDaos extends DaoSet<QStaticDao<QStaticDTO>> {
    govState: QStaticStateDao
    chamber: QStaticChamberDao
    bill: QStaticBillDao
    vote: QStaticVoteDao
    legi: QStaticLegiDao
    post: QStaticPostDao
    posting: QStaticPostingDao
}
interface SnapDaos extends DaoSet<QSnapDao<QSnapDTO>> {
    govState: QSnapStateDao
    chamber: QSnapChamberDao
    bill: QSnapBillDao
    vote: QSnapVoteDao
    legi: QSnapLegiDao
    post: QSnapPostDao
    posting: QSnapPostingDao
}
interface QContext {
    staticDaos: StaticDaos
    snapDaos: SnapDaos
}



// STATE


interface QStaticStateDTO extends QStaticDTO {
}

class QStaticStateDao extends QStaticDao<QStaticStateDTO> {
    protected businessKeyPropNames: (keyof QStaticStateDTO)[] = ['oid']
}

interface QSnapStateDTO extends QSnapDTO {
}

class QSnapStateDao extends QSnapDao<QSnapStateDTO> {
    protected businessKeyPropNames: (keyof QSnapStateDTO)[] = []
}

// CHAMBER

interface QStaticChamberDTO extends QStaticDTO {
}

class QStaticChamberDao extends QStaticDao<QStaticChamberDTO> {
    protected businessKeyPropNames: (keyof QStaticChamberDTO)[] = ['oid']
}

interface QSnapChamberDTO extends QSnapDTO {
}

class QSnapChamberDao extends QSnapDao<QSnapChamberDTO> {
    protected businessKeyPropNames: (keyof QSnapChamberDTO)[] = []
}
// BILL

interface QStaticBillDTO extends QStaticDTO {
}

class QStaticBillDao extends QStaticDao<QStaticBillDTO> {
    protected businessKeyPropNames: (keyof QStaticBillDTO)[] = ['oid']
}
interface QSnapBillDTO extends QSnapDTO {
}

class QSnapBillDao extends QSnapDao<QSnapBillDTO> {
    protected businessKeyPropNames: (keyof QSnapBillDTO)[] = []
}

// LEGI

interface QStaticLegiDTO extends QStaticDTO {
}
class QStaticLegiDao extends QStaticDao<QStaticLegiDTO> {
    protected businessKeyPropNames: (keyof QStaticLegiDTO)[] = ['oid']
}
interface QSnapLegiDTO extends QSnapDTO {
}

class QSnapLegiDao extends QSnapDao<QSnapLegiDTO> {
    protected businessKeyPropNames: (keyof QSnapLegiDTO)[] = []
}

// VOTE

interface QStaticVoteDTO extends QStaticDTO {
}
class QStaticVoteDao extends QStaticDao<QStaticVoteDTO> {
    protected businessKeyPropNames: (keyof QStaticVoteDTO)[] = ['oid']
}
interface QSnapVoteDTO extends QSnapDTO {
}

class QSnapVoteDao extends QSnapDao<QSnapVoteDTO> {
    protected businessKeyPropNames: (keyof QSnapVoteDTO)[] = []
}

// POST

interface QStaticPostDTO extends QStaticDTO {
}
class QStaticPostDao extends QStaticDao<QStaticPostDTO> {
    protected businessKeyPropNames: (keyof QStaticPostDTO)[] = ['oid']
}

interface QSnapPostDTO extends QSnapDTO {
}

class QSnapPostDao extends QSnapDao<QSnapPostDTO> {
    protected businessKeyPropNames: (keyof QSnapPostDTO)[] = []
}


// POSTING

interface QStaticPostingDTO extends QStaticDTO {
}
class QStaticPostingDao extends QStaticDao<QStaticPostingDTO> {
    protected businessKeyPropNames: (keyof QStaticPostingDTO)[] = ['oid']
}

interface QSnapPostingDTO extends QSnapDTO {
}

class QSnapPostingDao extends QSnapDao<QSnapPostingDTO> {
    protected businessKeyPropNames: (keyof QSnapPostingDTO)[] = []
}



class PersistentReporter<STATIC_DTO extends QStaticDTO, SNAP_DTO extends QSnapDTO, T extends IReporter<T>>  {

    protected snapDTO: QSnapDTO
    
    protected staticDao: QStaticDao<QStaticDTO>
    protected snapDao: QSnapDao<QSnapDTO>

    constructor(readonly oid: string, readonly name: string, readonly entityName:QEntityName, readonly qContext: QContext) {
        this.staticDao = qContext.staticDaos[entityName]
        this.snapDao = qContext.snapDaos[entityName]
        
        // parent should initialize snapDTO
    }


    public done(): void {
        // todo flush the DTO
    }

    public flag(flag: FlagDef<IStateReporter>, value?: boolean): void {
        // todo
    }

    public inc(int: CountDef<IStateReporter>, value?: number): void {
        // todo
    }

    public int(int: IntDef<IStateReporter>, value: number): void {
        // todo
    }

}


class StateReporter extends PersistentReporter<QStaticStateDTO, QSnapStateDTO, IStateReporter> implements IStateReporter {
    
/*
    constructor(stateOid: OCDJurisdictionId, stateId: StateId, staticDao: QStaticStateDao, snapDao: QSnapStateDao) {
        super(stateOid, stateId, staticDao, snapDao)
    }
*/

    
    public newBill(oid: OCDBillId, name: string): IBillReporter {
        return undefined as any as IBillReporter  // todo
    }

    public newChamber(oid: OCDOrganizationId, name: string): IChamberReporter {
        return undefined as any as IChamberReporter // todo
    }
}

class ChamberReporter extends PersistentReporter<QStaticChamberDTO, QSnapChamberDTO, IChamberReporter>
implements IChamberReporter {
    public newLegi(oid: OCDPersonId, name: string): ILegiReporter {
        return new LegiReporter(oid, name, 'legi', this.qContext)
    }

    public newPost(oid: OCDPostId, name: string): IPostReporter {
        return new PostReporter(oid, name, 'post', this.qContext)
    }
}

class LegiReporter extends PersistentReporter<QStaticLegiDTO, QSnapLegiDTO, ILegiReporter>
    implements ILegiReporter {
    public newPosting(oid: OCDMembershipId, name: string): IPostingReporter {
        return new PostingReporter(oid, name, 'posting', this.qContext)
    }
}

class PostReporter extends PersistentReporter<QStaticPostDTO, QSnapPostDTO, IPostReporter>
    implements IPostReporter {
}

class PostingReporter extends PersistentReporter<QStaticPostingDTO, QSnapPostingDTO, IPostingReporter>
    implements IPostingReporter {
}

