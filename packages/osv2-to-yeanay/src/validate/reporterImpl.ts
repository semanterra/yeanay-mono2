/* tslint:disable:prefer-array-literal */
import {
    ChamberId,
    OCDId,
    OCDOrganizationId,
    PrimaryKey,
    Promise0,
    StateId,
    WithoutId,
} from '@yeanay/yeanay-commons'
import { MetaSnap, metaSnaps } from '../db/quality/createQualitySchema'
import { QContext, QEntityName } from '../db/quality/qcontext'
import {
    QSnapBillDao,
    QSnapChamberDao,
    QSnapDao,
    QSnapLegiDao,
    QSnapPostDao,
    QSnapPostingDao,
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
} from '../db/quality/qualityDaos'
import {
    BoxPlot,
    QSnapBillDTO,
    QSnapChamberDTO,
    QSnapDTO,
    QSnapLegiDTO,
    QSnapMetrics,
    QSnapPostDTO,
    QSnapPostingDTO,
    QSnapStateDTO,
    QSnapVoteDTO,
    QStaticBillDTO,
    QStaticChamberDTO,
    QStaticDTO,
    QStaticLegiDTO,
    QStaticPostDTO,
    QStaticPostingDTO,
    QStaticStateDTO,
    QStaticVoteDTO,
} from '../db/quality/qualityDtos'
import {
    BoxPlotDef,
    DateDef,
    FlagDef,
    FloatDef,
    IBillReporter,
    IChamberReporter,
    ILegiReporter,
    IntDef,
    IPostingReporter,
    IPostReporter,
    IReporter,
    IStateReporter,
    IVoteReporter,
} from './ireporter'


interface PersistentReporterInit<SNAP_DTO> {
    snapDTO: SNAP_DTO,
    snapStatePK: PrimaryKey
}

abstract class PersistentReporter<STATIC_DTO extends QStaticDTO,
    SNAP_DTO extends QSnapDTO,
    STATIC_DAO extends QStaticDao<STATIC_DTO>,
    SNAP_DAO extends QSnapDao<SNAP_DTO>,
    T extends IReporter<T>> {

    // public only for testing
    public _staticDTO: STATIC_DTO
    public _snapDTO: SNAP_DTO

    protected staticDao: STATIC_DAO
    protected snapDao: SNAP_DAO


    /**
     *
     * @param oid the OCD id of the recorded entity
     * @param name a user-friendly name for the entity
     * @param entityName type of entity
     * @param isNew true if this is the first pass in which we are reporting on this entity.
     *   Usually/always this is rawToN3.  Because many objects are skipped in openStatesToRaw,
     *   it can't be there.  It controls whether this is a create or update.
     * @param qContext
     */
    constructor(readonly entityName: QEntityName,
                readonly isNew: boolean, readonly qContext: QContext) {
        // todo clean up typing somehow
        this.staticDao = qContext.staticDaos[entityName] as any as STATIC_DAO
        this.snapDao = qContext.snapDaos[entityName] as any as SNAP_DAO

    }

    /*
        protected postInit(initData: PersistentReporterInit<SNAP_DTO>): void {
            this.snapDTO = initData.snapDTO
            this.snapStatePK = initData.snapStatePK
        }
    */

    public async done(): Promise0 {
        // todo figure out getMetrics type problem
        await this.snapDao.update(this._snapDTO.id, this.getMetrics() as Partial<SNAP_DTO>)
    }

    public flag(flag: FlagDef<IStateReporter>, value: boolean = true): void {
        this._snapDTO.bools[flag.index] = value
    }

    public inc(int: IntDef<IStateReporter>, value: number = 1): void {
        const prev = this._snapDTO.ints[int.index] || 0
        this._snapDTO.ints[int.index] = prev + value
    }

    public int(int: IntDef<IStateReporter>, value: number): void {
        this._snapDTO.ints[int.index] = value
    }

    public date(date: DateDef<T>, value: Date): void {
        this._snapDTO.timeStamps[date.index] = value
    }

    public float(float: FloatDef<IStateReporter>, value: number): void {
        this._snapDTO.floats[float.index] = value

    }

    public boxPlot(boxPlot: BoxPlotDef<T>, value: BoxPlot): void {
        this._snapDTO.boxPlots[boxPlot.index] = value

    }

    /*

        protected async insert(dto: WithoutId<SNAP_DTO, number>): Promise<PrimaryKey> {
            const id = await this.snapDao.insert(dto)
            this.snapDTO = { ...dto, id } as SNAP_DTO
            return id
        }
    */

    /*

        protected async reread(snap_gov_state_fk: PrimaryKey, oid: OCDId,): Promise0 {
            this.snapDTO = await this.snapDao.findByOid(snap_gov_state_fk, oid)
        }
    */

    private getMetrics(): QSnapMetrics {
        const { bools, ints, floats, boxPlots, timeStamps } = this._snapDTO
        return { bools, ints, floats, boxPlots, timeStamps }
    }
}

function makeEmptyMetrics(meta: MetaSnap): QSnapMetrics {
    return {
        bools     : new Array(meta.maxBools).fill(null),
        ints      : new Array(meta.maxInts).fill(null),
        floats    : new Array(meta.maxFloats).fill(null),
        boxPlots  : new Array(meta.maxBoxPlots).fill(null),
        timeStamps: new Array(meta.maxTimestamps).fill(null),
    }
}


export class StateReporter extends PersistentReporter<QStaticStateDTO, QSnapStateDTO,
    QStaticStateDao, QSnapStateDao,
    IStateReporter> implements IStateReporter {

    constructor(isNew: boolean,
                readonly qContext: QContext) {
        super('govState', isNew, qContext)
    }

    public async init(name: StateId, oid: OCDId,
                      latest_update: Date): Promise<PersistentReporterInit<QSnapStateDTO>> {

        if ( this.isNew ) {
            // create static state if not already created
            const newStaticDto: WithoutId<QStaticStateDTO, number> = { oid, name, }
            this._staticDTO = await this.staticDao.upsertByBusinessKey(newStaticDto)

            const snapBusinessKey = {
                static_gov_state_fk: this._staticDTO.id,
                latest_update,
            }

            // if this state snapshot already exists, delete it.  This will cascade-delete
            //  the rest of the snapshot
            const oldSnapDto = await this.snapDao.first(snapBusinessKey)
            if ( oldSnapDto ) {
                await this.snapDao.remove(oldSnapDto.id)
            }
            // create the new snap
            const newSnapDto: WithoutId<QSnapStateDTO, number> = {
                ...snapBusinessKey,
                ...makeEmptyMetrics(metaSnaps.govState),
            }
            const id = await this.snapDao.insert(newSnapDto)
            const snapDTO: QSnapStateDTO = { ...newSnapDto, id }
            this._snapDTO = snapDTO
            return {
                snapDTO,
                snapStatePK: id,
            }
        } else {
            const staticDTO: null | QStaticStateDTO = await this.staticDao.first({ oid })
            if ( !staticDTO ) {
                throw new Error('StateReporter.init: reinit is missing static')
            }
            this._staticDTO = staticDTO
            const snapDTO: QSnapStateDTO | null = await this.snapDao.first({
                static_gov_state_fk: staticDTO.id, latest_update,
            })
            if ( !snapDTO ) {
                throw new Error('StateReporter: missing state snap')
            }
            this._snapDTO = snapDTO
            return { snapDTO, snapStatePK: snapDTO.id }
        }

    }

    public async newChamber(oid: OCDOrganizationId, name: ChamberId): Promise<IChamberReporter> {

        const chamberReporter = new ChamberReporter('chamber', this.isNew, this.qContext) // todo
        await chamberReporter.init(this._staticDTO.id, oid, name, this._snapDTO.id)
        return chamberReporter

    }

    /* todo
    public newBill(oid: OCDBillId, name: string): IBillReporter {
        return new BillReporter('bill', this.isNew, this.qContext)
    }
*/

}

class ChamberReporter extends PersistentReporter<QStaticChamberDTO, QSnapChamberDTO,
    QStaticChamberDao, QSnapChamberDao,
    IChamberReporter>
    implements IChamberReporter {

    public async init(static_gov_state_fk: PrimaryKey, oid: OCDOrganizationId, name: ChamberId,
                      snap_gov_state_fk: PrimaryKey): Promise0 {
        if ( this.isNew ) {
            // create static state if not already created
            const newStaticDto: WithoutId<QStaticChamberDTO, number> = {
                static_gov_state_fk,
                oid,
                name,
            }
            this._staticDTO = await this.staticDao.upsertByBusinessKey(newStaticDto)

            const snapBusinessKey = {
                snap_gov_state_fk,
                static_chamber_fk: this._staticDTO.id,
            }

            // if this state snapshot already exists, delete it.  This will cascade-delete
            //  the rest of the snapshot
            const oldSnapDto = await this.snapDao.first(snapBusinessKey)
            if ( oldSnapDto ) {
                await this.snapDao.remove(oldSnapDto.id)
            }
            // create the new snap
            const newSnapDto: WithoutId<QSnapChamberDTO, number> = {
                ...snapBusinessKey,
                ...makeEmptyMetrics(metaSnaps.chamber),
            }
            const id = await this.snapDao.insert(newSnapDto)
            this._snapDTO = { ...newSnapDto, id }

        } else {
            const staticDTO: null | QStaticChamberDTO = await this.staticDao.first({ oid })
            if ( !staticDTO ) {
                throw new Error('ChamberReporter.init: reinit is missing static')
            }
            this._staticDTO = staticDTO
            const snapDTO: QSnapChamberDTO | null = await this.snapDao.first({
                snap_gov_state_fk,
                static_chamber_fk: this._staticDTO.id,
            })
            if ( !snapDTO ) {
                throw new Error('StateReporter: missing state snap')
            }
            this._snapDTO = snapDTO
        }

    }

    // public newLegi(oid: OCDPersonId, name: string): ILegiReporter {
    //     return new LegiReporter('legi', this.isNew, this.qContext)
    // }
    //
    // public newPost(oid: OCDPostId, name: string): IPostReporter {
    //     return new PostReporter(oid, name, 'post', this.isNew, this.qContext)
    // }
}

class LegiReporter extends PersistentReporter<QStaticLegiDTO, QSnapLegiDTO,
    QStaticLegiDao, QSnapLegiDao, ILegiReporter>
    implements ILegiReporter {

    // public newPosting(oid: OCDMembershipId, name: string): IPostingReporter {
    //     return new PostingReporter(oid, name, 'posting', this.isNew, this.qContext)
    // }
}

class PostReporter extends PersistentReporter<QStaticPostDTO, QSnapPostDTO,
    QStaticPostDao, QSnapPostDao,
    IPostReporter>
    implements IPostReporter {

}

class PostingReporter extends PersistentReporter<QStaticPostingDTO, QSnapPostingDTO,
    QStaticPostingDao, QSnapPostingDao,
    IPostingReporter>
    implements IPostingReporter {


}

class BillReporter extends PersistentReporter<QStaticBillDTO, QSnapBillDTO,
    QStaticBillDao, QSnapBillDao,
    IBillReporter>
    implements IBillReporter {

    // protected async init(): Promise<PersistentReporterInit<QSnapBillDTO>> {
    //     // todo
    //     return undefined as any as Promise<PersistentReporterInit<QSnapBillDTO>>
    // }
    //
    // public newVote(oid: OCDVoteId, name: string): IVoteReporter {
    //     return new VoteReporter(oid, name, 'vote', this.isNew, this.qContext)
    // }
}

class VoteReporter extends PersistentReporter<QStaticVoteDTO, QSnapVoteDTO,
    QStaticVoteDao, QSnapVoteDao,
    IVoteReporter>
    implements IVoteReporter {

    // protected async init(): Promise<PersistentReporterInit<QSnapVoteDTO>> {
    //     // todo
    //     return undefined as any as Promise<PersistentReporterInit<QSnapVoteDTO>>
    // }

}
