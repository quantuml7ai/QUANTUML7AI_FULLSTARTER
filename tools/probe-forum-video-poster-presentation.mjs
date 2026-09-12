import { schedulePosterReleaseAfterPresentedFrame } from '../lib/forumVideoPosterPresentation.js'
function assert(ok, msg) { if (!ok) throw new Error(msg) }
let cb = null, released = 0
const video = { isConnected:true, paused:false, ended:false, readyState:2, requestVideoFrameCallback(fn){cb=fn;return 7}, cancelVideoFrameCallback(){} }
const cancel = schedulePosterReleaseAfterPresentedFrame(video, () => { released += 1 })
assert(released === 0, 'released before frame')
cb?.(1,{presentedFrames:1}); assert(released === 1, 'not released after frame'); cancel()
let cb2=null, cancelled=0
const video2={isConnected:true,paused:false,ended:false,readyState:2,requestVideoFrameCallback(fn){cb2=fn;return 8},cancelVideoFrameCallback(){}}
const cancel2=schedulePosterReleaseAfterPresentedFrame(video2,()=>{cancelled+=1}); cancel2(); cb2?.(); assert(cancelled===0,'cancel failed')
let cb3=null,cold=0
const video3={isConnected:true,paused:false,ended:false,readyState:1,requestVideoFrameCallback(fn){cb3=fn;return 9},cancelVideoFrameCallback(){}}
schedulePosterReleaseAfterPresentedFrame(video3,()=>{cold+=1}); cb3?.(); assert(cold===0,'cold release')
console.log(JSON.stringify({ok:true,firstFrameRelease:released,cancelledRelease:cancelled,coldRelease:cold},null,2))
