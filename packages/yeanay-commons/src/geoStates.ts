/* tslint:disable: max-file-line-count */
import {
    ChamberId, ChamberSet, ChamberType, DistrictType, floterialDistrictType,
    lowerChamberType, lowerDistrictType,
    StateId,
    upperChamberType,
    upperDistrictType,
} from './types'
import { mapValues } from './util/object'

export interface RawGeoState {
    id: StateId, name: string
}

export class GeoStateData implements RawGeoState {
    public id: StateId
    public name: string
    public chambers: ChamberSet

    constructor(raw: RawGeoState, stateStatic: StateStatic) {
        Object.assign(this, raw)
        // add id to chamber objects
        const chambers = mapValues<StaticChamberSet, Chamber>(stateStatic.chambers, (v:Chamber, k:ChamberId) => ({id: k, ...v}))
        this.chambers = chambers
    }

    get unicameral(): boolean {
        return this.id === 'ne'
    }

    get hasFloterial(): boolean {
        return this.id === 'nh'
    }

    get chamberTypes(): ChamberType[] {
        return ( this.unicameral ) ? [upperChamberType] : [upperChamberType, lowerChamberType]
    }

    get lowestChamber(): ChamberType {
        return this.unicameral ? upperChamberType : lowerChamberType
    }

    get lowestDistrictType(): DistrictType {
        return this.unicameral ? upperDistrictType : lowerDistrictType
    }

    get districtTypes(): DistrictType[] {
        let ret:DistrictType[] = [upperDistrictType]
        if ( !this.unicameral ) {
            ret.push(lowerDistrictType)
        }
        if ( this.hasFloterial ) {
            ret.push(floterialDistrictType)
        }
        return ret
    }
}

const rawGeoStates: { [id: string]: RawGeoState } = {
// @formatter:off
    ak: { id: 'ak',  name: 'Alaska' },
    al: { id: 'al',  name: 'Alabama' },
    ar: { id: 'ar',  name: 'Arkansas' },
    az: { id: 'az',  name: 'Arizona' },
    ca: { id: 'ca',  name: 'California' },
    co: { id: 'co',  name: 'Colorado' },
    ct: { id: 'ct',  name: 'Connecticut' },
    dc: { id: 'dc',  name: 'District of Columbia' },
    de: { id: 'de',  name: 'Delaware' },
    fl: { id: 'fl',  name: 'Florida' },
    ga: { id: 'ga',  name: 'Georgia' },
    hi: { id: 'hi',  name: 'Hawaii' },
    ia: { id: 'ia',  name: 'Iowa' },
    id: { id: 'id',  name: 'Idaho' },
    il: { id: 'il',  name: 'Illinois' },
    in: { id: 'in',  name: 'Indiana' },
    ks: { id: 'ks',  name: 'Kansas' },
    ky: { id: 'ky',  name: 'Kentucky' },
    la: { id: 'la',  name: 'Louisiana' },
    ma: { id: 'ma',  name: 'Massachusetts' },
    md: { id: 'md',  name: 'Maryland' },
    me: { id: 'me',  name: 'Maine' },
    mi: { id: 'mi',  name: 'Michigan' },
    mn: { id: 'mn',  name: 'Minnesota' },
    mo: { id: 'mo',  name: 'Missouri' },
    ms: { id: 'ms',  name: 'Mississippi' },
    mt: { id: 'mt',  name: 'Montana' },
    nc: { id: 'nc',  name: 'North Carolina' },
    nd: { id: 'nd',  name: 'North Dakota' },
    ne: { id: 'ne',  name: 'Nebraska' },
    nh: { id: 'nh',  name: 'New Hampshire' },
    nj: { id: 'nj',  name: 'New Jersey' },
    nm: { id: 'nm',  name: 'New Mexico' },
    nv: { id: 'nv',  name: 'Nevada' },
    ny: { id: 'ny',  name: 'New York' },
    oh: { id: 'oh',  name: 'Ohio' },
    ok: { id: 'ok',  name: 'Oklahoma' },
    or: { id: 'or',  name: 'Oregon' },
    pa: { id: 'pa',  name: 'Pennsylvania' },
    pr: { id: 'pr',  name: 'Puerto Rico' },
    ri: { id: 'ri',  name: 'Rhode Island' },
    sc: { id: 'sc',  name: 'South Carolina' },
    sd: { id: 'sd',  name: 'South Dakota' },
    tn: { id: 'tn',  name: 'Tennessee' },
    tx: { id: 'tx',  name: 'Texas' },
    ut: { id: 'ut',  name: 'Utah' },
    va: { id: 'va',  name: 'Virginia' },
    vt: { id: 'vt',  name: 'Vermont' },
    wa: { id: 'wa',  name: 'Washington' },
    wi: { id: 'wi',  name: 'Wisconsin' },
    wv: { id: 'wv',  name: 'West Virginia' },
    wy: { id: 'wy',  name: 'Wyoming' },
// @formatter:on
}

export interface Chamber {
    id: ChamberId
    name: string,
    title: string // title of a member legislator
}
export interface StaticChamber {
    name: string,
    title: string // title of a member legislator
}
export type StaticChamberSet = { [key in ChamberId]?: StaticChamber }

export interface StateStatic {
    chambers: StaticChamberSet
}
// from OpenStates, via nStatesProc.spewStatic
type StateStaticSet = { [key in keyof typeof rawGeoStates]: StateStatic }

const stateStaticSet: StateStaticSet = {
    ak: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    al: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    ar: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    az: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    ca: {
        chambers: {
            lower: {
                name : 'Assembly',
                title: 'Assemblymember',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    co: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    ct: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    dc: {
        chambers: {
            upper: {
                name : 'Council',
                title: 'Councilmember',
            },
        },
    },
    de: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    fl: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    ga: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    hi: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    ia: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    id: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    il: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    in: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    ks: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    ky: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    la: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    ma: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    md: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Delegate',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    me: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    mi: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    mn: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    mo: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    ms: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    mt: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    nc: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    nd: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    ne: {
        chambers: {
            upper: {
                name : 'Unicameral',
                title: 'Senator',
            },
        },
    },
    nh: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    nj: {
        chambers: {
            lower: {
                name : 'Assembly',
                title: 'Assembly Member',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    nm: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    nv: {
        chambers: {
            lower: {
                name : 'Assembly',
                title: 'Assembly Member',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    ny: {
        chambers: {
            lower: {
                name : 'Assembly',
                title: 'Assembly Member',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    oh: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    ok: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    or: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    pa: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    pr: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    ri: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    sc: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    sd: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    tn: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    tx: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    ut: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    va: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Delegate',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    vt: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    wa: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    wi: {
        chambers: {
            lower: {
                name : 'Assembly',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    wv: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Delegate',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
    wy: {
        chambers: {
            lower: {
                name : 'House',
                title: 'Representative',
            },
            upper: {
                name : 'Senate',
                title: 'Senator',
            },
        },
    },
}


// Make a hash by id of GeoStates containing rawGeoStates and bboxes
export const geoStates: { [key: string]: GeoStateData } = mapValues(rawGeoStates,
    (s) => new GeoStateData(s, stateStaticSet[s.id])
)


