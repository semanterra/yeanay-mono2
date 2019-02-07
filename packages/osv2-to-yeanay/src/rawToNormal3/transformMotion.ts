// Transform motions into a more consistent form

import { Motion, MotionType, StateId } from '@yeanay/yeanay-commons'


export function fResolveMotionType(stateId: StateId): (m: Motion) => (MotionType | null) {
    if ( stateId !== 'nh' ) {
        return (m) => null
    }
    return categorizeNHMotion
}

interface Replacer {
    s: RegExp | RegExp[],
    r: MotionType | null
}

function categorizeNHMotion(input: Motion): MotionType | null {
    for ( let { s, r } of nhTransforms ) {
        if ( Array.isArray(s) ) {
            if ( s.some((sitem) => sitem.test(input)) ) {
                return r
            }
        } else {
            if ( s.test(input) ) {
                return r
            }
        }
    }
    return null     // todo report failure upstream
}

const nhTransforms: Replacer[] = [
    {
        s: [/^Adopt CofC.*/,
            /C of C Report.*/,
            /Conference Committee Report.*/],
        r: 'PASS_COC',
    },
    {
        s: [/Adopt Amendment/,
            /^.*((Floor)|(Committ?ee)) Amendment .*/,
            /^Recommit/,
            /^EBA.*/],
        r: 'AMEND',
    },
    { s: /^Concur/, r: 'PASS_CONCUR' },
    {
        s: [/^Indefinitely Postpone/,
            /^Inexpedient to Legislate/,
            /^ITL/,
            /^.*Interim Study/,
            /^Non Concur$/],
        r: 'KILL',
    },
    {   s: [/^CofC/,
            /^.*Request a C of C/],
        r: 'SEND_TO_COC' },
    {
        s   : [
            /^La.*on .*table/i,
            /^Table.*/i,
        ], r: 'POSTPONE',
    },
    {
        s   : [/^OTP/,
            /^Ought to Pass/,
        ], r: 'PASS',
    },
    {
        s   : [/^OTPA/,
            /^Ought to Pass w.*Amendment.*/,
        ], r: 'PASS_AMENDED',
    },
    {
        s: /^.*Re-?refer.*/i,
        r: 'REREFER',
    },
    { s: /^Section.*/, r: 'APPROVE_SECTION' },
    { s: /^Reconsider/, r: 'RECONSIDER' },
    { s: /^Remove [Ff]rom (the )?Table/, r: 'END_POSTPONE' },
    { s: /^Veto Override/, r: 'OVERRIDE_VETO' },
    { s: [  /^Suspen.*rule.*/i,
            /^Special order/i,
            /^Print remarks/i,
        ], r: null },

]


