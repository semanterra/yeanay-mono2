import { MetaRecord, StateId } from '@yeanay/yeanay-commons'
import { RawGqlOrganization } from '../db/rawGql/rawGqlTypes'
import { OrganizationQFields } from '../gql/types/gql-types'
import { makeJurisdictionId } from '../gql/types/ocdIds'

import { RecordValidator } from '../validate/RecordValidator'
import * as val from '../validate/validate'
import { RawProc, RawProcConfig } from './rawProc'

const metaRecord: MetaRecord<RawGqlOrganization> = {
    describe: (instance: RawGqlOrganization) => ({ ocd_id: instance.id }),
    name    : 'raw_gql_organization',
    names   : 'raw_gql_organizations',
}


export class OrganizationProc extends RawProc {

    private valor: RecordValidator<RawGqlOrganization> = new RecordValidator(
        {
            errorSink: this.errorSink,
            metaRecord,
            severity : val.VSeverity.Record,
        }
    )

    constructor(config: RawProcConfig) {
        super(config, 'organization')
    }

    public async processState(stateId: StateId): Promise<void> {
        const jurisId = makeJurisdictionId(stateId)
        const orgs = await this.openStatesGqlApi.getOrganizationsP(jurisId)
        for ( const org of orgs ) {
            await this.processOrg(org, stateId)
        }
    }

    public async processOrg(org: OrganizationQFields, state_id: StateId): Promise<void> {
        const dbOrg: RawGqlOrganization = {
            id             : org.id!,
            state_id,
            jurisdiction_id: makeJurisdictionId(state_id),
            classification : org.classification,
            parent         : org.parent && org.parent.id,
            json           : org,
        }
        if ( this.prevalidate(dbOrg) < val.VSeverity.Record ) {
            await this.rawStore.upsertOrg(dbOrg)
        }
    }

    private prevalidate(org: RawGqlOrganization): val.VSeverity {

        this.valor.target(org)
            .verifyProps('id', 'state_id', 'jurisdiction_id', 'classification', 'json')
        return this.valor.targetSeverity
    }
}
