/* tslint:disable:no-http-string */

interface SavedStateGov  {
    capitol_timezone: string
    legislature_name: string
    legislature_url: string
    even_year_biennia?: boolean
}

type SavedStates = { [state:string]:SavedStateGov }

export const v1StateData:SavedStates = {
    ak: {
    capitol_timezone: 'America/Anchorage', legislature_name: 'Alaska State Legislature',
        legislature_url: 'http://w3.legis.state.ak.us/',
}, al: {
    capitol_timezone: 'America/Chicago', legislature_name: 'Alabama Legislature',
        legislature_url: 'http://www.legislature.state.al.us/',
}, ar: {
    capitol_timezone: 'America/Chicago', legislature_name: 'Arkansas General Assembly',
        legislature_url: 'http://www.arkleg.state.ar.us/',
}, az: {
    capitol_timezone: 'America/Denver', legislature_name: 'Arizona State Legislature',
        legislature_url: 'http://www.azleg.gov/',
}, ca: {
    capitol_timezone: 'America/Los_Angeles', legislature_name: 'California State Legislature',
        legislature_url: 'http://www.legislature.ca.gov/',
}, co: {
    capitol_timezone: 'America/Denver', legislature_name: 'Colorado General Assembly',
        legislature_url: 'http://leg.colorado.gov/',
}, ct: {
    capitol_timezone: 'America/New_York', legislature_name: 'Connecticut General Assembly',
        legislature_url: 'http://www.cga.ct.gov/',
}, dc: {
    capitol_timezone: 'America/New_York',
        legislature_name: 'Council of the District of Columbia',
        legislature_url: 'http://dccouncil.us/',
}, de: {
    capitol_timezone: 'America/New_York', legislature_name: 'Delaware General Assembly',
        legislature_url: 'http://legis.delaware.gov/',
}, fl: {
    capitol_timezone: 'America/New_York', legislature_name: 'Florida Legislature',
        legislature_url: 'http://www.leg.state.fl.us/',
}, ga: {
    capitol_timezone: 'America/New_York', legislature_name: 'Georgia General Assembly',
        legislature_url: 'http://www.legis.ga.gov/',
}, hi: {
    capitol_timezone: 'Pacific/Honolulu', legislature_name: 'Hawaii State Legislature',
        legislature_url: 'http://www.capitol.hawaii.gov/',
}, ia: {
    capitol_timezone: 'America/Chicago', legislature_name: 'Iowa General Assembly',
        legislature_url: 'https://www.legis.iowa.gov/',
}, id: {
    capitol_timezone: 'America/Denver', legislature_name: 'Idaho State Legislature',
        legislature_url: 'http://www.legislature.idaho.gov/',
}, il: {
    capitol_timezone: 'America/Chicago', legislature_name: 'Illinois General Assembly',
        legislature_url: 'http://www.ilga.gov/',
}, in: {
    capitol_timezone: 'America/Indiana/Indianapolis',
        legislature_name: 'Indiana General Assembly',
        legislature_url: 'http://www.in.gov/legislative/',
}, ks: {
    capitol_timezone: 'America/Chicago', legislature_name: 'Kansas State Legislature',
        legislature_url: 'http://www.kslegislature.org/',
}, ky: {
    capitol_timezone: 'America/New_York', legislature_name: 'Kentucky General Assembly',
        legislature_url: 'http://www.lrc.ky.gov/',
}, la: {
    capitol_timezone: 'America/Chicago', legislature_name: 'Louisiana Legislature',
        legislature_url: 'http://www.legis.la.gov/',
        even_year_biennia: true,
}, ma: {
    capitol_timezone: 'America/New_York', legislature_name: 'Massachusetts General Court',
        legislature_url: 'http://www.malegislature.gov/',
}, md: {
    capitol_timezone: 'America/New_York', legislature_name: 'Maryland General Assembly',
        legislature_url: 'http://mgaleg.maryland.gov/',
}, me: {
    capitol_timezone: 'America/New_York', legislature_name: 'Maine Legislature',
        legislature_url: 'http://legislature.maine.gov/',
}, mi: {
    capitol_timezone: 'America/New_York', legislature_name: 'Michigan Legislature',
        legislature_url: 'http://www.legislature.mi.gov',
}, mn: {
    capitol_timezone: 'America/Chicago', legislature_name: 'Minnesota State Legislature',
        legislature_url: 'http://www.leg.state.mn.us/',
}, mo: {
    capitol_timezone: 'America/Chicago', legislature_name: 'Missouri General Assembly',
        legislature_url: 'http://www.moga.mo.gov/',
}, ms: {
    capitol_timezone: 'America/Chicago', legislature_name: 'Mississippi Legislature',
        legislature_url: 'http://www.legislature.ms.gov/',
        even_year_biennia: true,
}, mt: {
    capitol_timezone: 'America/Denver', legislature_name: 'Montana Legislature',
        legislature_url: 'http://leg.mt.gov/',
}, nc: {
    capitol_timezone: 'America/New_York', legislature_name: 'North Carolina General Assembly',
        legislature_url: 'http://www.ncleg.net/',
}, nd: {
    capitol_timezone: 'America/North_Dakota/Center',
        legislature_name: 'North Dakota Legislative Assembly',
        legislature_url: 'http://www.legis.nd.gov/',
}, ne: {
    capitol_timezone: 'America/Chicago', legislature_name: 'Nebraska Legislature',
        legislature_url: 'http://nebraskalegislature.gov/',
}, nh: {
    capitol_timezone: 'America/New_York', legislature_name: 'New Hampshire General Court',
        legislature_url: 'http://www.gencourt.state.nh.us/',
}, nj: {
    capitol_timezone: 'America/New_York', legislature_name: 'New Jersey Legislature',
        legislature_url: 'http://www.njleg.state.nj.us/',
        even_year_biennia: true,
}, nm: {
    capitol_timezone: 'America/Denver', legislature_name: 'New Mexico Legislature',
        legislature_url: 'http://www.nmlegis.gov/',
}, nv: {
    capitol_timezone: 'America/Los_Angeles', legislature_name: 'Nevada Legislature',
        legislature_url: 'http://www.leg.state.nv.us/',
}, ny: {
    capitol_timezone: 'America/New_York', legislature_name: 'New York Legislature',
        legislature_url: 'http://public.leginfo.state.ny.us/',
}, oh: {
    capitol_timezone: 'America/New_York', legislature_name: 'Ohio General Assembly',
        legislature_url: 'http://www.legislature.state.oh.us/',
}, ok: {
    capitol_timezone: 'America/Chicago', legislature_name: 'Oklahoma Legislature',
        legislature_url: 'http://www.oklegislature.gov/',
}, or: {
    capitol_timezone: 'America/Los_Angeles', legislature_name: 'Oregon Legislative Assembly',
        legislature_url: 'http://www.leg.state.or.us/',
}, pa: {
    capitol_timezone: 'America/New_York', legislature_name: 'Pennsylvania General Assembly',
        legislature_url: 'http://www.legis.state.pa.us/',
}, pr: {
    capitol_timezone: 'America/Puerto_Rico',
        legislature_name: 'Legislative Assembly of Puerto Rico',
        legislature_url: 'http://www.oslpr.org/',
}, ri: {
    capitol_timezone: 'America/New_York', legislature_name: 'Rhode Island General Assembly',
        legislature_url: 'http://www.rilin.state.ri.us/',
}, sc: {
    capitol_timezone: 'America/New_York', legislature_name: 'South Carolina Legislature',
        legislature_url: 'http://www.scstatehouse.gov/',
}, sd: {
    capitol_timezone: 'America/Chicago', legislature_name: 'South Dakota State Legislature',
        legislature_url: 'http://www.sdlegislature.gov/',
}, tn: {
    capitol_timezone: 'America/Chicago', legislature_name: 'Tennessee General Assembly',
        legislature_url: 'http://www.legislature.state.tn.us/',
}, tx: {
    capitol_timezone: 'America/Chicago', legislature_name: 'Texas Legislature',
        legislature_url: 'http://www.capitol.state.tx.us/',
}, ut: {
    capitol_timezone: 'America/Denver', legislature_name: 'Utah State Legislature',
        legislature_url: 'http://le.utah.gov/',
}, va: {
    capitol_timezone: 'America/New_York', legislature_name: 'Virginia General Assembly',
        legislature_url: 'http://virginiageneralassembly.gov/',
        even_year_biennia: true,
}, vt: {
    capitol_timezone: 'America/New_York', legislature_name: 'Vermont General Assembly',
        legislature_url: 'http://legislature.vermont.gov/',
}, wa: {
    capitol_timezone: 'America/Los_Angeles', legislature_name: 'Washington State Legislature',
        legislature_url: 'http://www.leg.wa.gov/',
}, wi: {
    capitol_timezone: 'America/Chicago', legislature_name: 'Wisconsin State Legislature',
        legislature_url: 'http://legis.wisconsin.gov/',
}, wv: {
    capitol_timezone: 'America/New_York', legislature_name: 'West Virginia Legislature',
        legislature_url: 'http://www.legis.state.wv.us/',
}, wy: {
    capitol_timezone: 'America/Denver', legislature_name: 'Wyoming State Legislature',
        legislature_url: 'http://legisweb.state.wy.us/',
},
}
