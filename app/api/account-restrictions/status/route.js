import {NextResponse} from 'next/server'
import quarantineService from '../../../../lib/account-restrictions/quarantineService.cjs'
import {resolveCanonicalAccountId} from '../../profile/_identity.js'
export const dynamic='force-dynamic';export const revalidate=0
function rawAccountId(request){return String(request.headers.get('x-auth-account-id')||request.headers.get('x-forum-user-id')||request.headers.get('x-forum-user')||'').trim()}
export async function GET(request){let accountId=rawAccountId(request);if(!accountId)return NextResponse.json({ok:false,error:'auth_required'},{status:401});try{accountId=String((await resolveCanonicalAccountId(accountId))||accountId).trim()}catch{}const now=Date.now(),quarantine=await quarantineService.getActiveQuarantine(accountId,now).catch(()=>null);return NextResponse.json({ok:true,serverNow:new Date(now).toISOString(),stateVersion:'6.0.0',quarantine,composerRestriction:null,composerTextRestrictionSupported:false},{headers:{'cache-control':'no-store'}})}
