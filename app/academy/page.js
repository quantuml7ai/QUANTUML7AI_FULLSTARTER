// app/academy/page.js
'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  cloneElement,
  memo,
  Children,
  isValidElement,
  Fragment
} from 'react'


import Image from 'next/image'
import { SiteSocialLinksRow } from '../../components/TopBar'
import Link from 'next/link'
import { useI18n } from '../../components/i18n'
import HomeBetweenBlocksAd from '../ads'
import AcademyExamBlock from './AcademyExamBlock'

/**
 * Блок с Q&A.
 * Внешний лейаут: .panel из глобальных стилей.
 * Весь визуал внутри — только через QL7-* и локальный <style jsx>.
 */
const ACADEMY_CHUNK_SIZE = 10
const ACADEMY_ART_VIEWBOX = '0 0 320 180'

function stableAcademyHash(value) {
  const input = String(value || '')
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619) >>> 0
  }
  return hash >>> 0
}

function svgUnit(seed, salt) {
  let value = (seed ^ Math.imul((salt + 1) >>> 0, 0x9e3779b1)) >>> 0
  value ^= value >>> 16
  value = Math.imul(value, 0x7feb352d) >>> 0
  value ^= value >>> 15
  value = Math.imul(value, 0x846ca68b) >>> 0
  value ^= value >>> 16
  return (value >>> 0) / 4294967296
}

function svgRange(seed, salt, min, max) {
  return min + svgUnit(seed, salt) * (max - min)
}

function svgInt(seed, salt, min, maxExclusive) {
  const span = Math.max(1, maxExclusive - min)
  return min + Math.floor(svgUnit(seed, salt) * span)
}

function svgRadius(seed, salt, min = 1.4, max = 8) {
  return Math.max(0.75, svgRange(seed, salt, min, max))
}

function svgSpan(seed, salt, min = 4, max = 46) {
  return Math.max(1, svgRange(seed, salt, min, max))
}

function academyQaOrdinal(baseKey) {
  const match = String(baseKey || '').match(/(\d+)(?!.*\d)/)
  return match ? Number(match[1]) : 0
}

function chunkAcademyKeys(qaKeys) {
  const keys = Array.isArray(qaKeys) ? qaKeys : []
  const chunks = []
  for (let i = 0; i < keys.length; i += ACADEMY_CHUNK_SIZE) {
    chunks.push(keys.slice(i, i + ACADEMY_CHUNK_SIZE))
  }
  return chunks
}

function buildAcademySlotKey(blockId, checkpointIndex) {
  const page = String(Number(blockId) || 0).padStart(2, '0')
  const checkpoint = String(Number(checkpointIndex) + 1).padStart(2, '0')
  return `academy_page_${page}_checkpoint_${checkpoint}`
}

function svgPoint(seed, salt, minX, maxX, minY, maxY) {
  return {
    x: svgRange(seed, salt, minX, maxX),
    y: svgRange(seed, salt + 97, minY, maxY),
  }
}

function renderPrimaryArt(type, seed, cyan, gold, violet, glowCyan, glowGold) {
  const cx = svgRange(seed, 11, 136, 184)
  const cy = svgRange(seed, 12, 78, 104)
  const r1 = svgRadius(seed, 13, 20, 34)
  const r2 = svgRadius(seed, 14, 10, 20)
  const a = svgRange(seed, 15, -16, 16)

  switch (type) {
    case 0:
      return <g fill="none"><polygon points={`${cx},${cy-54} ${cx+40},${cy-14} ${cx+26},${cy+46} ${cx},${cy+62} ${cx-28},${cy+44} ${cx-42},${cy-10}`} fill={glowCyan} stroke={cyan} strokeWidth="1.8"/><polygon points={`${cx},${cy-38} ${cx+24},${cy-10} ${cx+13},${cy+30} ${cx-14},${cy+29} ${cx-25},${cy-9}`} fill={glowGold} stroke={gold}/><path d={`M${cx-42} ${cy-10} L${cx} ${cy+4} L${cx+40} ${cy-14} M${cx} ${cy-54} V${cy+62}`} stroke={violet} opacity=".8"/><circle cx={cx} cy={cy+4} r="4" fill={gold} stroke="none"/></g>
    case 1:
      return <g fill="none"><circle cx={cx} cy={cy} r={r1+20} stroke={cyan} strokeDasharray="3 7"/><circle cx={cx} cy={cy} r={r1} stroke={gold} strokeWidth="1.6"/><circle cx={cx} cy={cy} r={r2} stroke={violet}/><ellipse cx={cx} cy={cy} rx={r1+42} ry={r2+8} stroke={cyan} transform={`rotate(${a} ${cx} ${cy})`}/><ellipse cx={cx} cy={cy} rx={r1+30} ry={r2+22} stroke={gold} opacity=".7" transform={`rotate(${-a-18} ${cx} ${cy})`}/><path d={`M${cx} ${cy} L${cx+58} ${cy-42}`} stroke={gold} strokeWidth="2"/><circle cx={cx+58} cy={cy-42} r="4" fill={gold} stroke="none"/></g>
    case 2: {
      const bars = Array.from({ length: 7 }, (_, i) => {
        const h = svgSpan(seed, 30 + i, 18, 76)
        const x = 62 + i * 30
        return <g key={i}><rect x={x} y={146-h} width="14" height={h} rx="3" fill={i%2?glowGold:glowCyan} stroke={i%2?gold:cyan}/><line x1={x+7} y1={146-h-8} x2={x+7} y2={146-h-2} stroke={violet}/></g>
      })
      return <g>{bars}<polyline points="62,126 92,112 122,120 152,82 182,94 212,60 242,38" fill="none" stroke={gold} strokeWidth="2.2"/><path d="M62 150 H252" stroke={cyan} opacity=".55"/></g>
    }
    case 3:
      return <g fill="none">{[0,1,2,3].map((ring)=><polygon key={ring} points={`${cx},${cy-18-ring*12} ${cx+22+ring*11},${cy-9-ring*6} ${cx+22+ring*11},${cy+9+ring*6} ${cx},${cy+18+ring*12} ${cx-22-ring*11},${cy+9+ring*6} ${cx-22-ring*11},${cy-9-ring*6}`} stroke={ring%2?gold:cyan} strokeWidth={ring<2?'1.5':'1'} opacity={1-ring*.15}/>)}<circle cx={cx} cy={cy} r="8" fill={glowCyan} stroke={violet}/><path d={`M${cx-72} ${cy} H${cx+72}`} stroke={violet} strokeDasharray="4 8" opacity=".55"/></g>
    case 4:
      return <g fill="none"><path d={`M${cx-72} ${cy+34} L${cx-38} ${cy-8} L${cx-10} ${cy+16} L${cx+18} ${cy-34} L${cx+68} ${cy-8}`} stroke={cyan} strokeWidth="2.3"/><path d={`M${cx-72} ${cy+50} H${cx+76}`} stroke={gold}/>{[[-72,34],[-38,-8],[-10,16],[18,-34],[68,-8]].map((pt,i)=><circle key={i} cx={cx+pt[0]} cy={cy+pt[1]} r={i===3?5:3} fill={i%2?gold:cyan} stroke="none"/>)}<path d={`M${cx-54} ${cy-52} H${cx+54}`} stroke={violet} strokeDasharray="4 7"/></g>
    case 5:
      return <g fill="none"><rect x={cx-60} y={cy-44} width="120" height="88" rx="14" stroke={cyan} strokeWidth="1.7"/><rect x={cx-44} y={cy-30} width="88" height="60" rx="10" stroke={gold}/><rect x={cx-20} y={cy-14} width="40" height="28" rx="5" fill={glowCyan} stroke={violet}/>{[-1,0,1].map((n)=><g key={n}><line x1={cx+n*28} y1={cy-54} x2={cx+n*28} y2={cy-44} stroke={gold}/><line x1={cx+n*28} y1={cy+44} x2={cx+n*28} y2={cy+54} stroke={cyan}/></g>)}</g>
    case 6:
      return <g fill="none"><path d={`M${cx} ${cy-60} L${cx+50} ${cy-32} V${cy+16} C${cx+50} ${cy+44},${cx+18} ${cy+56},${cx} ${cy+64} C${cx-18} ${cy+56},${cx-50} ${cy+44},${cx-50} ${cy+16} V${cy-32} Z`} fill={glowCyan} stroke={cyan} strokeWidth="1.8"/><path d={`M${cx-22} ${cy+2} L${cx-5} ${cy+20} L${cx+30} ${cy-20}`} stroke={gold} strokeWidth="2.6"/><circle cx={cx} cy={cy} r="18" stroke={violet}/><circle cx={cx} cy={cy} r="6" fill={gold} stroke="none"/></g>
    case 7:
      return <g fill="none">{[0,1,2,3].map((i)=>{const x=70+i*46; const yy=cy+(i%2?12:-12); return <g key={i}><rect x={x} y={yy-15} width="62" height="30" rx="15" stroke={i%2?gold:cyan} transform={`rotate(${i%2?26:-26} ${x+31} ${yy})`}/><line x1={x+18} y1={yy-6} x2={x+44} y2={yy+6} stroke={violet}/></g>})}</g>
    case 8:
      return <g fill="none"><path d={`M${cx-74} ${cy+44} C${cx-42} ${cy-26},${cx+18} ${cy-54},${cx+72} ${cy-8}`} stroke={cyan} strokeWidth="1.8"/><path d={`M${cx-72} ${cy+18} C${cx-18} ${cy-32},${cx+24} ${cy+12},${cx+72} ${cy-42}`} stroke={gold} strokeWidth="1.5"/>{Array.from({length:9},(_,i)=>{const p=svgPoint(seed,70+i,78,242,38,138); return <circle key={i} cx={p.x} cy={p.y} r={svgRadius(seed,90+i,2,4.2)} fill={i%3===0?gold:cyan} stroke="none"/>})}</g>
    case 9:
      return <g fill="none"><circle cx={cx} cy={cy} r={r1+22} stroke={cyan} strokeDasharray="4 7"/><circle cx={cx} cy={cy} r={r1} stroke={gold}/><circle cx={cx} cy={cy} r={r2} stroke={violet}/>{[0,45,90,135,180,225,270,315].map((ang,i)=>{const rad=ang*Math.PI/180; return <line key={i} x1={cx+Math.cos(rad)*(r2+4)} y1={cy+Math.sin(rad)*(r2+4)} x2={cx+Math.cos(rad)*(r1+35)} y2={cy+Math.sin(rad)*(r1+35)} stroke={i%2?gold:cyan} opacity=".55"/>})}</g>
    case 10:
      return <g fill="none"><path d={`M${cx-66} ${cy+38} L${cx-34} ${cy-16} L${cx-8} ${cy+18} L${cx+24} ${cy-38} L${cx+66} ${cy+6}`} stroke={cyan} strokeWidth="2.2"/><path d={`M${cx-66} ${cy+54} H${cx+72}`} stroke={gold}/><path d={`M${cx-48} ${cy-50} H${cx+48}`} stroke={violet} strokeDasharray="4 6"/>{[0,1,2,3,4].map((i)=><circle key={i} cx={cx-66+i*33} cy={cy+38-(i%2)*30} r="3.2" fill={i%2?gold:cyan} stroke="none"/>)}</g>
    case 11:
      return <g fill="none"><polygon points={`${cx},${cy-62} ${cx+50},${cy-12} ${cx+30},${cy+54} ${cx-30},${cy+54} ${cx-50},${cy-12}`} stroke={cyan} strokeWidth="1.6"/><polygon points={`${cx},${cy-40} ${cx+30},${cy-8} ${cx+18},${cy+32} ${cx-18},${cy+32} ${cx-30},${cy-8}`} stroke={gold}/><path d={`M${cx-68} ${cy} H${cx+68} M${cx} ${cy-68} V${cy+68}`} stroke={violet} opacity=".5"/></g>
    case 12:
      return <g fill="none"><path d={`M${cx-72} ${cy+34} Q${cx-28} ${cy-56},${cx+8} ${cy+6} T${cx+72} ${cy-34}`} stroke={cyan} strokeWidth="1.8"/><path d={`M${cx-72} ${cy-14} Q${cx-14} ${cy+52},${cx+72} ${cy-4}`} stroke={gold}/><path d={`M${cx-54} ${cy+54} H${cx+54}`} stroke={violet} strokeDasharray="5 5"/><circle cx={cx+8} cy={cy+6} r="5" fill={glowGold} stroke={gold}/></g>
    case 13:
      return <g fill="none"><path d={`M${cx-64} ${cy-40} H${cx+18} L${cx+54} ${cy-6} V${cy+42} H${cx-18} L${cx-64} ${cy-4} Z`} stroke={cyan} strokeWidth="1.6"/><path d={`M${cx-40} ${cy-18} H${cx+5} L${cx+30} ${cy+6} V${cy+24} H${cx-22} Z`} fill={glowGold} stroke={gold}/><circle cx={cx+8} cy={cy+4} r="8" stroke={violet}/></g>
    case 14:
      return <g fill="none"><path d={`M${cx-60} ${cy+48} C${cx-32} ${cy-18},${cx-12} ${cy-54},${cx} ${cy-58} C${cx+12} ${cy-54},${cx+32} ${cy-18},${cx+60} ${cy+48}`} stroke={cyan} strokeWidth="1.7"/><path d={`M${cx-54} ${cy-40} C${cx-28} ${cy+18},${cx-12} ${cy+48},${cx} ${cy+54} C${cx+12} ${cy+48},${cx+28} ${cy+18},${cx+54} ${cy-40}`} stroke={gold}/><path d={`M${cx-70} ${cy} H${cx+70}`} stroke={violet} strokeDasharray="3 7"/></g>
    case 15:
      return <g fill="none"><path d={`M${cx-60} ${cy-28} H${cx-18} V${cy-52} H${cx+20} V${cy-22} H${cx+60} V${cy+24} H${cx+20} V${cy+50} H${cx-20} V${cy+20} H${cx-60} Z`} stroke={cyan} strokeWidth="1.7"/><circle cx={cx} cy={cy} r="22" stroke={gold}/><circle cx={cx} cy={cy} r="7" fill={violet} stroke="none"/></g>
    case 16:
      return <g fill="none"><path d={`M${cx-64} ${cy+42} L${cx-38} ${cy-36} L${cx} ${cy-58} L${cx+40} ${cy-30} L${cx+64} ${cy+42} Z`} fill={glowCyan} stroke={cyan}/><path d={`M${cx-38} ${cy-36} L${cx} ${cy+8} L${cx+40} ${cy-30} M${cx} ${cy-58} V${cy+54}`} stroke={gold}/><path d={`M${cx-64} ${cy+42} H${cx+64}`} stroke={violet}/></g>
    case 17:
      return <g fill="none"><rect x={cx-62} y={cy-46} width="124" height="92" rx="18" stroke={cyan}/><path d={`M${cx-48} ${cy+18} H${cx-18} V${cy-8} H${cx+12} V${cy-30} H${cx+46}`} stroke={gold} strokeWidth="2"/><path d={`M${cx-44} ${cy+36} H${cx+44}`} stroke={violet} strokeDasharray="3 6"/>{[-36,0,36].map((n,i)=><circle key={i} cx={cx+n} cy={cy-28+i*28} r="4" fill={i%2?gold:cyan} stroke="none"/>)}</g>
    case 18:
      return <g fill="none"><circle cx={cx} cy={cy} r="54" stroke={cyan}/><path d={`M${cx-50} ${cy+18} Q${cx} ${cy-58},${cx+50} ${cy+18} Q${cx} ${cy+58},${cx-50} ${cy+18} Z`} stroke={gold}/><path d={`M${cx-58} ${cy} H${cx+58} M${cx} ${cy-58} V${cy+58}`} stroke={violet} opacity=".5"/><circle cx={cx} cy={cy} r="8" fill={glowCyan} stroke={cyan}/></g>
    case 19:
      return <g fill="none">{Array.from({length:6},(_,i)=>{const rr=14+i*8; return <circle key={i} cx={cx} cy={cy} r={rr} stroke={i%2?gold:cyan} opacity={.92-i*.1}/>})}<path d={`M${cx-66} ${cy+40} L${cx+62} ${cy-44}`} stroke={violet}/><circle cx={cx+62} cy={cy-44} r="4" fill={gold} stroke="none"/></g>
    case 20:
      return <g fill="none"><path d={`M${cx-60} ${cy-44} H${cx+34} L${cx+62} ${cy-16} V${cy+42} H${cx-34} L${cx-60} ${cy+16} Z`} stroke={cyan}/><path d={`M${cx-40} ${cy-24} H${cx+18} L${cx+40} ${cy-2} V${cy+22} H${cx-18} Z`} stroke={gold}/><path d={`M${cx-64} ${cy+52} H${cx+64}`} stroke={violet} strokeDasharray="5 6"/></g>
    case 21:
      return <g fill="none"><path d={`M${cx-68} ${cy+46} Q${cx-42} ${cy-44},${cx} ${cy+8} Q${cx+42} ${cy-44},${cx+68} ${cy+46}`} stroke={cyan} strokeWidth="1.8"/><path d={`M${cx-64} ${cy-34} Q${cx-30} ${cy+46},${cx} ${cy-8} Q${cx+30} ${cy+46},${cx+64} ${cy-34}`} stroke={gold}/><circle cx={cx} cy={cy} r="10" fill={glowGold} stroke={violet}/></g>
    case 22:
      return <g fill="none"><polygon points={`${cx-58},${cy+34} ${cx-28},${cy-42} ${cx+14},${cy-54} ${cx+58},${cy-8} ${cx+40},${cy+48} ${cx-16},${cy+54}`} stroke={cyan}/><polyline points={`${cx-28},${cy-42} ${cx},${cy+2} ${cx+58},${cy-8}`} stroke={gold}/><polyline points={`${cx-58},${cy+34} ${cx},${cy+2} ${cx+40},${cy+48}`} stroke={violet}/></g>
    case 23:
      return <g fill="none"><path d={`M${cx-70} ${cy+44} L${cx-40} ${cy-48} L${cx} ${cy-18} L${cx+38} ${cy-54} L${cx+70} ${cy+42}`} stroke={cyan} strokeWidth="1.8"/><path d={`M${cx-52} ${cy+26} L${cx-18} ${cy-30} L${cx+12} ${cy+4} L${cx+48} ${cy-34}`} stroke={gold}/><circle cx={cx+12} cy={cy+4} r="7" stroke={violet}/><path d={`M${cx-66} ${cy+54} H${cx+66}`} stroke={violet} strokeDasharray="2 6"/></g>
    case 24:
      return <g fill="none"><rect x={cx-58} y={cy-48} width="116" height="96" rx="18" stroke={cyan}/><path d={`M${cx-42} ${cy+24} H${cx-18} V${cy-18} H${cx+8} V${cy+4} H${cx+42}`} stroke={gold} strokeWidth="2"/><circle cx={cx-18} cy={cy-18} r="5" fill={glowCyan} stroke={cyan}/><circle cx={cx+8} cy={cy+4} r="5" fill={glowGold} stroke={gold}/><path d={`M${cx-44} ${cy-34} H${cx+44} M${cx-44} ${cy+34} H${cx+44}`} stroke={violet} strokeDasharray="4 6"/></g>
    case 25:
      return <g fill="none"><circle cx={cx} cy={cy} r="54" stroke={cyan}/><circle cx={cx} cy={cy} r="40" stroke={gold} strokeDasharray="8 5"/><path d={`M${cx-56} ${cy+30} Q${cx} ${cy-68},${cx+58} ${cy+18}`} stroke={violet}/><path d={`M${cx-62} ${cy-18} Q${cx} ${cy+66},${cx+62} ${cy-28}`} stroke={cyan}/><circle cx={cx} cy={cy} r="8" fill={gold} stroke="none"/></g>
    case 26:
      return <g fill="none"><path d={`M${cx-64} ${cy+38} L${cx-32} ${cy-40} L${cx} ${cy+4} L${cx+34} ${cy-52} L${cx+64} ${cy+38} Z`} stroke={cyan} strokeWidth="1.7"/><path d={`M${cx-44} ${cy+22} L${cx-18} ${cy-20} L${cx+2} ${cy+10} L${cx+28} ${cy-32} L${cx+44} ${cy+22}`} stroke={gold}/><path d={`M${cx-72} ${cy+50} H${cx+72}`} stroke={violet} strokeDasharray="6 5"/></g>
    case 27:
      return <g fill="none"><path d={`M${cx-68} ${cy-40} H${cx-24} L${cx} ${cy-58} L${cx+24} ${cy-40} H${cx+68} V${cy+40} H${cx+24} L${cx} ${cy+58} L${cx-24} ${cy+40} H${cx-68} Z`} stroke={cyan}/><path d={`M${cx-46} ${cy-18} H${cx-8} V${cy-38} H${cx+8} V${cy-18} H${cx+46} V${cy+18} H${cx+8} V${cy+38} H${cx-8} V${cy+18} H${cx-46} Z`} stroke={gold}/><circle cx={cx} cy={cy} r="12" stroke={violet}/></g>
    case 28:
      return <g fill="none"><path d={`M${cx-64} ${cy+42} C${cx-54} ${cy-44},${cx-10} ${cy-66},${cx+8} ${cy-8} C${cx+28} ${cy+54},${cx+58} ${cy+30},${cx+66} ${cy-38}`} stroke={cyan} strokeWidth="1.8"/><path d={`M${cx-62} ${cy-20} C${cx-18} ${cy+52},${cx+20} ${cy-56},${cx+64} ${cy+18}`} stroke={gold}/><path d={`M${cx-54} ${cy+54} H${cx+54}`} stroke={violet} strokeDasharray="3 7"/><circle cx={cx+8} cy={cy-8} r="6" fill={glowCyan} stroke={violet}/></g>
    case 29:
      return <g fill="none"><polygon points={`${cx},${cy-62} ${cx+56},${cy-28} ${cx+56},${cy+28} ${cx},${cy+62} ${cx-56},${cy+28} ${cx-56},${cy-28}`} stroke={cyan}/><polygon points={`${cx},${cy-38} ${cx+34},${cy-18} ${cx+34},${cy+18} ${cx},${cy+38} ${cx-34},${cy+18} ${cx-34},${cy-18}`} stroke={gold}/><path d={`M${cx-56} ${cy-28} L${cx+56} ${cy+28} M${cx+56} ${cy-28} L${cx-56} ${cy+28}`} stroke={violet} opacity=".68"/></g>
    case 30:
      return <g fill="none"><path d={`M${cx-68} ${cy+34} H${cx-40} L${cx-22} ${cy-28} L${cx} ${cy+12} L${cx+24} ${cy-46} L${cx+42} ${cy+34} H${cx+68}`} stroke={cyan} strokeWidth="2"/><path d={`M${cx-54} ${cy+50} H${cx+54}`} stroke={gold}/><circle cx={cx-22} cy={cy-28} r="4" fill={gold} stroke="none"/><circle cx={cx+24} cy={cy-46} r="4" fill={cyan} stroke="none"/><path d={`M${cx-64} ${cy-52} H${cx+64}`} stroke={violet} strokeDasharray="4 6"/></g>
    default:
      return <g fill="none"><path d={`M${cx-70} ${cy-34} H${cx-22} L${cx} ${cy-56} L${cx+22} ${cy-34} H${cx+70} V${cy+34} H${cx+22} L${cx} ${cy+56} L${cx-22} ${cy+34} H${cx-70} Z`} stroke={cyan}/><path d={`M${cx-44} ${cy} H${cx+44}`} stroke={gold}/><circle cx={cx} cy={cy} r="24" stroke={violet}/><circle cx={cx} cy={cy} r="6" fill={gold} stroke="none"/></g>
  }
}

function renderSecondaryArt(type, seed, cyan, gold, violet) {
  const opacity = '.52'
  switch (type) {
    case 0: return <g fill="none" opacity={opacity}><path d="M52 56 H102 L116 42 H164" stroke={cyan}/><path d="M156 140 H208 L224 124 H274" stroke={gold}/><circle cx="96" cy="120" r="17" stroke={violet}/></g>
    case 1: return <g fill="none" opacity={opacity}><circle cx="74" cy="70" r="18" stroke={cyan}/><circle cx="250" cy="120" r="20" stroke={gold}/><path d="M74 70 L160 92 L250 120" stroke={violet}/></g>
    case 2: return <g fill="none" opacity={opacity}><path d="M54 132 L92 84 L126 104 L164 58 L204 84 L262 48" stroke={cyan}/><path d="M54 148 H268" stroke={gold}/></g>
    case 3: return <g fill="none" opacity={opacity}><rect x="48" y="42" width="72" height="48" rx="8" stroke={cyan}/><rect x="202" y="98" width="72" height="48" rx="8" stroke={gold}/><path d="M120 66 H170 V122 H202" stroke={violet}/></g>
    case 4: return <g fill="none" opacity={opacity}><polygon points="74,56 104,40 134,56 134,90 104,108 74,90" stroke={cyan}/><polygon points="186,80 216,64 246,80 246,114 216,132 186,114" stroke={gold}/><line x1="134" y1="74" x2="186" y2="96" stroke={violet}/></g>
    case 5: return <g fill="none" opacity={opacity}><path d="M60 132 L100 46 L142 132 Z" stroke={cyan}/><path d="M174 132 L214 58 L258 132 Z" stroke={gold}/><line x1="100" y1="46" x2="214" y2="58" stroke={violet}/></g>
    case 6: return <g fill="none" opacity={opacity}><rect x="54" y="38" width="212" height="108" rx="12" stroke={cyan}/><path d="M72 122 H248 M72 94 H248 M72 66 H248" stroke="rgba(130,190,220,.32)"/><path d="M108 38 V146 M160 38 V146 M212 38 V146" stroke="rgba(130,190,220,.24)"/></g>
    case 7: return <g fill="none" opacity={opacity}><path d="M54 84 H104 L120 58 H182 L202 84 H268" stroke={cyan}/><path d="M54 112 H126 L144 138 H218 L236 112 H268" stroke={gold}/><circle cx="160" cy="96" r="7" stroke={violet}/></g>
    case 8: return <g fill="none" opacity={opacity}><path d="M60 44 C100 72,100 110,60 140" stroke={cyan}/><path d="M260 44 C220 72,220 110,260 140" stroke={gold}/><path d="M60 92 H260" stroke={violet} strokeDasharray="4 8"/></g>
    case 9: return <g fill="none" opacity={opacity}>{[0,1,2,3].map((i)=><rect key={i} x={60+i*44} y={54+i*5} width="88" height="68" rx="10" stroke={i%2?gold:cyan}/>)}</g>
    case 10: return <g fill="none" opacity={opacity}><path d="M50 136 Q100 42 160 136 T270 136" stroke={cyan}/><path d="M50 48 Q100 142 160 48 T270 48" stroke={gold}/></g>
    case 11: return <g fill="none" opacity={opacity}><path d="M64 46 L160 92 L64 138 M256 46 L160 92 L256 138" stroke={cyan}/><circle cx="160" cy="92" r="34" stroke={gold}/><circle cx="160" cy="92" r="10" fill={violet} stroke="none"/></g>
    case 12: return <g fill="none" opacity={opacity}><path d="M48 68 H92 V42 H126 M272 116 H228 V142 H194" stroke={cyan}/><path d="M126 42 H194 M126 142 H194" stroke={gold}/><circle cx="160" cy="92" r="26" stroke={violet}/></g>
    case 13: return <g fill="none" opacity={opacity}><path d="M52 122 C88 56,120 50,160 92 C198 132,232 128,270 62" stroke={cyan}/><path d="M52 58 C92 128,124 134,160 92 C198 50,232 54,270 126" stroke={gold}/></g>
    case 14: return <g fill="none" opacity={opacity}><polygon points="160,34 212,62 212,120 160,150 108,120 108,62" stroke={cyan}/><polygon points="160,54 194,74 194,110 160,130 126,110 126,74" stroke={gold}/><path d="M108 62 L212 120 M212 62 L108 120" stroke={violet}/></g>
    case 15: return <g fill="none" opacity={opacity}><path d="M44 48 H100 L122 68 H198 L220 48 H276 M44 136 H108 L126 118 H194 L212 136 H276" stroke={cyan}/><path d="M160 34 V148 M116 90 H204" stroke={gold}/></g>
    case 16: return <g fill="none" opacity={opacity}><circle cx="90" cy="90" r="32" stroke={cyan}/><circle cx="230" cy="90" r="32" stroke={gold}/><path d="M122 90 H198 M90 58 L230 122 M90 122 L230 58" stroke={violet}/></g>
    case 17: return <g fill="none" opacity={opacity}><path d="M48 132 L92 62 L136 116 L180 48 L224 104 L272 58" stroke={cyan}/><path d="M48 146 H272 M64 34 H256" stroke={gold}/></g>
    case 18: return <g fill="none" opacity={opacity}><rect x="72" y="48" width="176" height="88" rx="18" stroke={cyan}/><path d="M92 70 H144 L160 54 H212 M108 118 H156 L174 102 H228" stroke={gold}/><circle cx="160" cy="92" r="18" stroke={violet}/></g>
    default: return <g fill="none" opacity={opacity}><path d="M44 90 H94 L112 72 H208 L226 90 H276" stroke={cyan}/><path d="M44 116 H124 L142 134 H194 L212 116 H276" stroke={gold}/><circle cx="160" cy="103" r="12" stroke={violet}/></g>
  }
}

function renderArtRails(type, seed, cyan, gold) {
  const offset = svgRange(seed, 301, 4, 14)
  switch (type) {
    case 0: return <g fill="none" opacity=".82"><path d={`M18 ${30+offset} H84 L98 ${18+offset} H148`} stroke={cyan}/><path d={`M172 ${162-offset} H224 L238 ${150-offset} H302`} stroke={gold}/></g>
    case 1: return <g fill="none" opacity=".8"><path d="M20 28 H76 M20 38 H48 M300 142 H244 M300 152 H272" stroke={cyan}/><path d="M240 20 H296 V64 M80 160 H24 V116" stroke={gold}/></g>
    case 2: return <g fill="none" opacity=".8"><path d="M24 60 V24 H60 M296 120 V156 H260" stroke={cyan}/><path d="M82 20 H138 M182 160 H238" stroke={gold}/></g>
    case 3: return <g fill="none" opacity=".8"><path d="M18 82 H54 L68 68 H96 M302 98 H266 L252 112 H224" stroke={cyan}/><path d="M112 18 H172 M148 162 H208" stroke={gold}/></g>
    case 4: return <g fill="none" opacity=".8"><path d="M22 34 H116 L130 20 H184" stroke={cyan}/><path d="M298 146 H204 L190 160 H136" stroke={gold}/></g>
    case 5: return <g fill="none" opacity=".8"><path d="M24 24 H78 M24 24 V78 M296 156 H242 M296 156 V102" stroke={cyan}/><path d="M108 18 H212 M108 162 H212" stroke={gold} strokeDasharray="8 7"/></g>
    case 6: return <g fill="none" opacity=".8"><path d="M18 48 L44 20 H120 M302 132 L276 160 H200" stroke={cyan}/><path d="M200 20 H276 L302 48 M120 160 H44 L18 132" stroke={gold}/></g>
    case 7: return <g fill="none" opacity=".8"><path d="M18 90 H58 M262 90 H302" stroke={cyan}/><path d="M160 16 V44 M160 136 V164" stroke={gold}/></g>
    case 8: return <g fill="none" opacity=".8"><path d="M20 54 H44 L58 40 H112 M208 140 H262 L276 126 H300" stroke={cyan}/><path d="M20 126 H92 M228 54 H300" stroke={gold}/></g>
    case 9: return <g fill="none" opacity=".8"><path d="M22 22 H94 L108 36 H154" stroke={cyan}/><path d="M298 158 H226 L212 144 H166" stroke={gold}/></g>
    case 10: return <g fill="none" opacity=".8"><path d="M18 70 H76 M244 110 H302" stroke={cyan}/><path d="M82 18 V52 M238 128 V162" stroke={gold}/></g>
    case 11: return <g fill="none" opacity=".8"><path d="M18 34 H64 L78 20 H142 M178 160 H242 L256 146 H302" stroke={cyan}/><path d="M18 146 H86 M234 34 H302" stroke={gold}/></g>
    case 12: return <g fill="none" opacity=".8"><path d="M20 24 H52 V52 M300 156 H268 V128" stroke={cyan}/><path d="M116 18 H204 M116 162 H204" stroke={gold} strokeDasharray="3 8"/></g>
    case 13: return <g fill="none" opacity=".8"><path d="M18 96 H54 L72 78 H110 M302 84 H266 L248 102 H210" stroke={cyan}/><path d="M62 22 H114 M206 158 H258" stroke={gold}/></g>
    case 14: return <g fill="none" opacity=".8"><path d="M24 42 L42 24 H96 M296 138 L278 156 H224" stroke={cyan}/><path d="M224 24 H278 L296 42 M96 156 H42 L24 138" stroke={gold}/></g>
    default: return <g fill="none" opacity=".8"><path d="M22 42 H64 L78 28 H118 M202 152 H242 L256 138 H298" stroke={cyan}/><path d="M22 138 H74 M246 42 H298" stroke={gold}/></g>
  }
}

function renderMicroLayer(seed, cyan, gold, violet) {
  const nodes = Array.from({ length: 12 }, (_, i) => ({
    x: svgRange(seed, 500+i, 26, 294),
    y: svgRange(seed, 540+i, 24, 158),
    r: svgRadius(seed, 580+i, 1.1, 2.7),
  }))
  const ticks = Array.from({ length: 8 }, (_, i) => {
    const x = 46 + i * 30
    const h = svgSpan(seed, 620+i, 4, 14)
    return <line key={i} x1={x} y1="158" x2={x} y2={158-h} stroke={i%2?gold:cyan} opacity=".5" />
  })
  return <g>{nodes.map((n,i)=><circle key={`n${i}`} cx={n.x} cy={n.y} r={n.r} fill={i%4===0?gold:i%4===1?violet:cyan} opacity={i%3===0?'.9':'.52'} />)}{ticks}<path d="M28 52 H52 M268 128 H292" stroke={violet} opacity=".45"/><path d="M30 128 H64 M256 52 H290" stroke={cyan} opacity=".36"/></g>
}

function renderPrecisionLayer(seed, cyan, gold, violet) {
  const y1 = svgRange(seed, 700, 52, 76)
  const y2 = svgRange(seed, 701, 112, 138)
  const x1 = svgRange(seed, 702, 72, 118)
  const x2 = svgRange(seed, 703, 202, 248)
  return (
    <g fill="none" opacity=".76">
      <path d={`M28 ${y1} H${x1} L${x1 + 12} ${y1 - 10} H150 M170 ${y2} H${x2} L${x2 + 12} ${y2 - 10} H292`} stroke={cyan} strokeWidth=".7" />
      <path d={`M34 ${y2} H${x1 - 10} M${x2 + 6} ${y1} H286`} stroke={gold} strokeWidth=".7" />
      <path d="M152 28 V44 M168 136 V152" stroke={violet} strokeDasharray="2 3" />
      <rect x="28" y="28" width="34" height="10" rx="3" stroke={cyan} opacity=".55" />
      <rect x="258" y="142" width="34" height="10" rx="3" stroke={gold} opacity=".55" />
    </g>
  )
}

const PremiumKnowledgeArt = memo(function PremiumKnowledgeArt({ qaKey }) {
  const seed = stableAcademyHash(qaKey)
  const ordinal = academyQaOrdinal(qaKey)
  const family = (ordinal * 13 + svgInt(seed, 0, 0, 7)) % 32
  const secondary = (ordinal * 7 + svgInt(seed, 1, 0, 5)) % 20
  const rails = (ordinal * 5 + svgInt(seed, 2, 0, 3)) % 16
  const palette = svgInt(seed, 3, 0, 4)
  const cyan = ['#53ecff', '#78dcff', '#5ef3df', '#79c9ff'][palette]
  const gold = ['#ffd25f', '#ffe08a', '#ffc85d', '#f6d37d'][palette]
  const violet = ['#967cff', '#a58cff', '#7e91ff', '#a477e8'][palette]
  const glowCyan = ['rgba(83,236,255,.08)','rgba(120,220,255,.08)','rgba(94,243,223,.08)','rgba(121,201,255,.08)'][palette]
  const glowGold = ['rgba(255,210,95,.08)','rgba(255,224,138,.08)','rgba(255,200,93,.08)','rgba(246,211,125,.08)'][palette]
  const idBase = `academy-art-${seed.toString(16)}`
  const clipId = `${idBase}-clip`
  const cyanGrad = `${idBase}-cg`
  const goldGrad = `${idBase}-gg`
  const primaryTransform = `translate(160 90) rotate(${svgRange(seed, 4, -8, 8)}) scale(${svgRange(seed, 5, .9, 1.08)}) translate(-160 -90)`
  const secondaryTransform = `translate(${svgRange(seed, 6, -8, 8)} ${svgRange(seed, 7, -6, 6)}) rotate(${svgRange(seed, 8, -4, 4)} 160 90)`

  return (
    <svg className="QL7-art-svg" viewBox={ACADEMY_ART_VIEWBOX} preserveAspectRatio="xMidYMid meet" focusable="false" aria-hidden="true">
      <defs>
        <clipPath id={clipId}><rect x="5" y="5" width="310" height="170" rx="22" /></clipPath>
        <linearGradient id={cyanGrad} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={cyan} stopOpacity=".95"/><stop offset="1" stopColor={violet} stopOpacity=".6"/></linearGradient>
        <linearGradient id={goldGrad} x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor={gold} stopOpacity=".95"/><stop offset="1" stopColor={cyan} stopOpacity=".45"/></linearGradient>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x="5" y="5" width="310" height="170" rx="22" fill="rgba(1,9,18,.82)" stroke={`url(#${cyanGrad})`} strokeWidth="1.2" />
        <rect x="12" y="12" width="296" height="156" rx="18" fill="none" stroke="rgba(255,212,93,.12)" />
        <path d="M18 44 H112 L128 28 H232 L248 16 H302" fill="none" stroke={`url(#${cyanGrad})`} opacity=".72" />
        <path d="M18 142 H86 L102 158 H214 L230 142 H302" fill="none" stroke={`url(#${goldGrad})`} opacity=".68" />
        <path d="M20 74 H62 M258 106 H300" stroke="rgba(115,190,218,.18)" />
        <g transform={secondaryTransform}>{renderSecondaryArt(secondary, seed, cyan, gold, violet)}</g>
        <g transform={primaryTransform}>{renderPrimaryArt(family, seed, cyan, gold, violet, glowCyan, glowGold)}</g>
        {renderArtRails(rails, seed, cyan, gold)}
        {renderMicroLayer(seed, cyan, gold, violet)}
        {renderPrecisionLayer(seed, cyan, gold, violet)}
        <text x="22" y="166" fill="rgba(83,236,255,.72)" fontSize="6" letterSpacing="2.2">{seed.toString(16).toUpperCase().padStart(8, '0').slice(0, 8)}</text>
        <text x="244" y="166" fill="rgba(255,210,95,.68)" fontSize="6" letterSpacing="1.4">QL7 // {String(family + 1).padStart(2, '0')}</text>
      </g>
    </svg>
  )
})

const academyMountProfiles = new Map()

function getAcademyMountProfile(rootMargin) {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return null
  const key = String(rootMargin || '0px')
  const cached = academyMountProfiles.get(key)
  if (cached) return cached

  const callbacks = new Map()
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const callback = callbacks.get(entry.target)
        if (callback) callback(!!entry.isIntersecting)
      }
    },
    { rootMargin: key, threshold: 0.01 }
  )
  const profile = { observer, callbacks }
  academyMountProfiles.set(key, profile)
  return profile
}

function useNearViewport(rootMargin, persistOnceActive = false, deactivateDelayMs = 240) {
  const ref = useRef(null)
  const [active, setActive] = useState(false)
  const activatedRef = useRef(false)
  const deactivateTimerRef = useRef(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined
    const profile = getAcademyMountProfile(rootMargin)
    if (!profile) {
      setActive(true)
      return undefined
    }

    const onIntersect = (isIntersecting) => {
      if (deactivateTimerRef.current) window.clearTimeout(deactivateTimerRef.current)
      deactivateTimerRef.current = 0
      if (isIntersecting) {
        activatedRef.current = true
        setActive(true)
        return
      }
      if (persistOnceActive && activatedRef.current) return
      deactivateTimerRef.current = window.setTimeout(() => {
        deactivateTimerRef.current = 0
        setActive(false)
      }, Math.max(0, Number(deactivateDelayMs) || 0))
    }
    profile.callbacks.set(node, onIntersect)
    profile.observer.observe(node)
    return () => {
      if (deactivateTimerRef.current) window.clearTimeout(deactivateTimerRef.current)
      deactivateTimerRef.current = 0
      profile.observer.unobserve(node)
      profile.callbacks.delete(node)
      if (profile.callbacks.size === 0) {
        profile.observer.disconnect()
        academyMountProfiles.delete(String(rootMargin || '0px'))
      }
    }
  }, [deactivateDelayMs, persistOnceActive, rootMargin])

  return [ref, active]
}

function PremiumKnowledgeArtViewport({ qaKey }) {
  const [ref, active] = useNearViewport('320px 0px 320px 0px', false, 1800)
  const glintDelay = `-${((stableAcademyHash(qaKey) % 4200) / 1000).toFixed(3)}s`
  return (
    <div
      ref={ref}
      className="QL7-card-art"
      data-ql7-visual-scope="academy-svg-glint"
      data-ql7-visual-margin="near50"
      aria-hidden="true"
    >
      {active ? (
        <>
          <PremiumKnowledgeArt qaKey={qaKey} />
          <span className="QL7-art-glint" style={{ '--ql7-art-glint-delay': glintDelay }} />
        </>
      ) : <div className="QL7-art-placeholder" />}
    </div>
  )
}

function AcademyExamViewport({ blockId, checkpointIndex, checkpointCount, t }) {
  const [ref, active] = useNearViewport('560px 0px 560px 0px', true)
  return (
    <section
      ref={ref}
      className="QL7-exam-stage"
      data-academy-swipe-ignore="1"
      data-academy-checkpoint={checkpointIndex + 1}
    >
      <div className="QL7-exam-stage-head">
        <span className="QL7-exam-stage-kicker">{t('academy_exam_stage_label')}</span>
        <span className="QL7-exam-stage-index">{String(checkpointIndex + 1).padStart(2, '0')} / {String(checkpointCount).padStart(2, '0')}</span>
      </div>
      <div className="QL7-exam-stage-rail" aria-hidden="true"><span /><i /><b /><i /><span /></div>
      <div className="QL7-exam-stage-body">
        {active ? <AcademyExamBlock blockId={blockId} /> : <div className="QL7-exam-cold" aria-hidden="true" />}
      </div>
    </section>
  )
}

function AcademyAdViewport({ blockId, checkpointIndex }) {
  const [ref, active] = useNearViewport('900px 0px 900px 0px', true)
  const slotKey = buildAcademySlotKey(blockId, checkpointIndex)
  return (
    <section ref={ref} className="QL7-ad-stage" data-academy-swipe-ignore="1" data-academy-ad-slot={slotKey}>
      <div className="QL7-ad-stage-rail" aria-hidden="true"><span /><i /><span /></div>
      <div className="QL7-ad-stage-code" aria-hidden="true">{String(blockId).padStart(2, '0')}.{String(checkpointIndex + 1).padStart(2, '0')}</div>
      {active ? (
        <HomeBetweenBlocksAd key={slotKey} slotKey={slotKey} slotKind="academy_after" />
      ) : (
        <div className="QL7-ad-cold" aria-hidden="true" />
      )}
    </section>
  )
}

function AcademyPaginationControls({ page, pageCount, onNavigate, t }) {
  const isFirst = page === 0
  const isLast = page === pageCount - 1
  const current = String(page + 1).padStart(2, '0')
  const total = String(pageCount).padStart(2, '0')

  return (
    <nav className="QL7-pagination" data-academy-swipe-ignore="1" aria-label={`${t('academy_pagination_page')} ${page + 1} / ${pageCount}`}>
      <div className="QL7-pagination-toprail" aria-hidden="true"><span /><i /><span /></div>
      <div className="QL7-pagination-controls">
        <button type="button" onClick={() => onNavigate(0)} disabled={isFirst} aria-label={t('academy_pagination_first_aria')}>⫷</button>
        <button type="button" onClick={() => onNavigate(page - 1)} disabled={isFirst} aria-label={t('academy_pagination_prev_aria')}>‹</button>
        <div className="QL7-pagination-index" aria-hidden="true"><strong>{current}</strong><span>/</span><em>{total}</em></div>
        <button type="button" onClick={() => onNavigate(page + 1)} disabled={isLast} aria-label={t('academy_pagination_next_aria')}>›</button>
        <button type="button" onClick={() => onNavigate(pageCount - 1)} disabled={isLast} aria-label={t('academy_pagination_last_aria')}>⫸</button>
      </div>
      <div className="QL7-pagination-foot" aria-hidden="true"><i /><span>QL7</span><i /></div>
    </nav>
  )
}

function KnowledgeCard({ baseKey, index }) {
  const { t } = useI18n()
  const ordinal = academyQaOrdinal(baseKey) || index + 1
  const code = String(ordinal).padStart(4, '0')
  const localCode = String(index + 1).padStart(2, '0')

  return (
    <article className="QL7-knowledge-card">
      <div className="QL7-card-frame" aria-hidden="true"><span /><span /><span /><span /></div>
      <div className="QL7-card-copy">
        <div className="QL7-card-meta" aria-hidden="true"><b>{localCode}</b><span>QL7 // KNOWLEDGE</span><i>{code}</i></div>
        <h2 className="QL7-card-question">{t(`${baseKey}_q`)}</h2>
        <div className="QL7-cyber-divider" aria-hidden="true"><span className="cyan" /><i /><b /><em /><span className="gold" /></div>
        <div className="QL7-card-answer-label">{t('academy_card_answer_label')}</div>
        <p className="QL7-card-answer">{t(`${baseKey}_a`)}</p>
      </div>
      <PremiumKnowledgeArtViewport qaKey={baseKey} />
    </article>
  )
}

function QASection({ imageSrc, imageAlt, qaKeys, blockId, pagination }) {
  const { t } = useI18n()
  const chunks = useMemo(() => chunkAcademyKeys(qaKeys), [qaKeys])

  return (
    <section className="QL7-academy-module" data-ql7-visual-scope="panel">
      <div className="QL7-module-frame" aria-hidden="true"><span /><span /><span /><span /></div>
      <div className="QL7-hero-shell">
        <div className="QL7-banner-wrap">
          <Image src={imageSrc} alt={imageAlt} className="QL7-banner-img" width={1920} height={480} sizes="100vw" priority={false} />
          <div className="QL7-banner-overlay" aria-hidden="true" />
          <div className="QL7-banner-rails" aria-hidden="true"><span /><span /><span /><span /></div>
        </div>
        <div className="QL7-title-badge">
          <div className="QL7-title-primary">{t('academy_title_primary')}</div>
          <div className="QL7-title-rail" aria-hidden="true"><span /><i /><span /></div>
          <div className="QL7-title-secondary">{t('academy_title_secondary')}</div>
        </div>
      </div>

      <div className="QL7-checkpoint-stack">
        {chunks.map((chunk, checkpointIndex) => (
          <Fragment key={`${blockId}-${checkpointIndex}`}>
            <div className="QL7-card-stack">
              {chunk.map((baseKey, localIndex) => (
                <KnowledgeCard key={baseKey} baseKey={baseKey} index={checkpointIndex * ACADEMY_CHUNK_SIZE + localIndex} />
              ))}
            </div>
            <AcademyExamViewport blockId={blockId} checkpointIndex={checkpointIndex} checkpointCount={chunks.length} t={t} />
            <AcademyAdViewport blockId={blockId} checkpointIndex={checkpointIndex} />
            <AcademyPaginationControls page={pagination.page} pageCount={pagination.pageCount} onNavigate={pagination.onNavigate} t={t} />
          </Fragment>
        ))}
      </div>

      <style jsx global>{`
        .QL7-academy-module {
          position:relative;
          isolation:isolate;
          margin:0 auto 26px !important;
          padding:14px !important;
          overflow:visible !important;
          border:1px solid rgba(80,231,255,.42) !important;
          border-radius:32px !important;
          background:
            radial-gradient(circle at 12% 0%,rgba(34,173,220,.11),transparent 34%),
            radial-gradient(circle at 88% 12%,rgba(255,196,73,.08),transparent 30%),
            linear-gradient(180deg,rgba(4,18,31,.985),rgba(2,8,16,.995)) !important;
          box-shadow:
            inset 0 0 0 1px rgba(255,218,112,.11),
            inset 0 0 44px rgba(18,128,165,.055),
            0 12px 32px rgba(0,0,0,.28) !important;
        }
        .QL7-academy-module .QL7-module-frame { position:absolute; inset:7px; pointer-events:none; z-index:0; }
        .QL7-academy-module .QL7-module-frame span { position:absolute; width:74px; height:34px; }
        .QL7-academy-module .QL7-module-frame span:nth-child(1){left:0;top:0;border-left:1px solid rgba(83,236,255,.58);border-top:1px solid rgba(83,236,255,.58);border-radius:18px 0 0 0}
        .QL7-academy-module .QL7-module-frame span:nth-child(2){right:0;top:0;border-right:1px solid rgba(255,210,95,.46);border-top:1px solid rgba(255,210,95,.46);border-radius:0 18px 0 0}
        .QL7-academy-module .QL7-module-frame span:nth-child(3){left:0;bottom:0;border-left:1px solid rgba(255,210,95,.28);border-bottom:1px solid rgba(255,210,95,.28);border-radius:0 0 0 18px}
        .QL7-academy-module .QL7-module-frame span:nth-child(4){right:0;bottom:0;border-right:1px solid rgba(83,236,255,.38);border-bottom:1px solid rgba(83,236,255,.38);border-radius:0 0 18px 0}

        .QL7-academy-module .QL7-hero-shell { position:relative; z-index:1; overflow:hidden; border:1px solid rgba(83,236,255,.28); border-radius:26px; background:#03101c; box-shadow:inset 0 0 0 1px rgba(255,210,95,.06); }
        .QL7-academy-module .QL7-banner-wrap { position:relative; overflow:hidden; min-height:154px; max-height:338px; }
        .QL7-academy-module .QL7-banner-img { width:100%; height:100%; min-height:154px; max-height:338px; display:block; object-fit:cover; }
        @media (min-width:761px) {
          .QL7-academy-module .QL7-banner-wrap { min-height:0; max-height:none; }
          .QL7-academy-module .QL7-banner-img { height:auto; min-height:0; max-height:none; object-fit:contain; object-position:center; }
        }
        .QL7-academy-module .QL7-banner-overlay { position:absolute; inset:0; pointer-events:none; background:linear-gradient(180deg,rgba(1,8,15,.02) 30%,rgba(2,10,18,.36) 72%,rgba(2,10,18,.9) 100%); }
        .QL7-academy-module .QL7-banner-rails span { position:absolute; z-index:2; pointer-events:none; }
        .QL7-academy-module .QL7-banner-rails span:nth-child(1){left:18px;top:18px;width:124px;border-top:1px solid rgba(83,236,255,.7)}
        .QL7-academy-module .QL7-banner-rails span:nth-child(2){right:18px;top:18px;height:72px;border-right:1px solid rgba(255,210,95,.58)}
        .QL7-academy-module .QL7-banner-rails span:nth-child(3){left:18px;bottom:18px;height:72px;border-left:1px solid rgba(83,236,255,.48)}
        .QL7-academy-module .QL7-banner-rails span:nth-child(4){right:18px;bottom:18px;width:124px;border-bottom:1px solid rgba(255,210,95,.48)}

        .QL7-academy-module .QL7-title-badge { position:relative; padding:18px 24px 22px; text-align:center; background:linear-gradient(180deg,rgba(5,20,33,.995),rgba(2,12,22,.995)); border-top:1px solid rgba(83,236,255,.24); overflow:hidden; }
        .QL7-academy-module .QL7-title-badge::before,
        .QL7-academy-module .QL7-title-badge::after { content:''; position:absolute; top:18px; width:56px; height:18px; opacity:.54; }
        .QL7-academy-module .QL7-title-badge::before { left:18px; border-left:1px solid #53ecff; border-top:1px solid #53ecff; }
        .QL7-academy-module .QL7-title-badge::after { right:18px; border-right:1px solid #ffd25f; border-top:1px solid #ffd25f; }
        .QL7-academy-module .QL7-title-primary { color:#f4fbff; font-size:clamp(1.18rem,2.25vw,1.72rem); line-height:1; font-weight:950; letter-spacing:.19em; text-transform:uppercase; white-space:nowrap; }
        .QL7-academy-module .QL7-title-rail { display:flex; align-items:center; justify-content:center; gap:10px; width:min(620px,88%); height:18px; margin:9px auto 8px; }
        .QL7-academy-module .QL7-title-rail span { height:2px; flex:1; opacity:.9; }
        .QL7-academy-module .QL7-title-rail span:first-child { background:linear-gradient(90deg,transparent,rgba(0,255,208,.86)); }
        .QL7-academy-module .QL7-title-rail span:last-child { background:linear-gradient(90deg,rgba(0,255,208,.86),transparent); }
        .QL7-academy-module .QL7-title-rail i { width:10px; height:10px; flex:0 0 auto; border-radius:50%; background:#00ffd0; box-shadow:0 0 8px rgba(0,255,208,.9),0 0 18px rgba(0,180,255,.58); animation:QL7TitleRailPulse 1.6s ease-in-out infinite; }
        .QL7-academy-module .QL7-title-secondary { display:block; max-width:100%; color:#d9edf5; font-size:clamp(.58rem,1.18vw,.98rem); line-height:1.05; font-weight:820; letter-spacing:.012em; white-space:nowrap; overflow:hidden; text-overflow:clip; }

        .QL7-academy-module .QL7-checkpoint-stack { position:relative; z-index:1; padding:18px 0 2px; }
        .QL7-academy-module .QL7-card-stack { display:flex; flex-direction:column; gap:12px; }
        .QL7-academy-module .QL7-knowledge-card {
          position:relative;
          display:grid;
          grid-template-columns:minmax(0,1fr) minmax(220px,30%);
          grid-template-areas:"copy art";
          gap:16px;
          min-height:184px;
          padding:18px 18px 18px 20px;
          overflow:hidden;
          border:1px solid rgba(83,236,255,.46);
          border-radius:26px 13px 26px 13px;
          background:
            linear-gradient(90deg,rgba(83,236,255,.035),transparent 28%),
            linear-gradient(145deg,rgba(5,22,36,.99),rgba(2,10,18,.997) 62%,rgba(27,20,7,.38));
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,.025),
            inset -1px -1px 0 rgba(255,210,95,.25),
            0 4px 12px rgba(0,0,0,.16);
          contain:layout paint style;
        }
        .QL7-academy-module .QL7-knowledge-card::before { content:''; position:absolute; left:0; top:22px; bottom:22px; width:2px; background:linear-gradient(180deg,transparent,#53ecff 30%,#53ecff 70%,transparent); opacity:.85; }
        .QL7-academy-module .QL7-knowledge-card::after { content:''; position:absolute; right:0; top:34px; bottom:34px; width:1px; background:linear-gradient(180deg,transparent,#ffd25f,transparent); opacity:.62; }
        .QL7-academy-module .QL7-card-frame span { position:absolute; z-index:1; pointer-events:none; width:34px; height:18px; opacity:.86; }
        .QL7-academy-module .QL7-card-frame span:nth-child(1){left:10px;top:10px;border-left:1px solid #53ecff;border-top:1px solid #53ecff;border-radius:10px 0 0 0}
        .QL7-academy-module .QL7-card-frame span:nth-child(2){right:10px;top:10px;border-right:1px solid #ffd25f;border-top:1px solid #ffd25f;border-radius:0 10px 0 0}
        .QL7-academy-module .QL7-card-frame span:nth-child(3){left:10px;bottom:10px;border-left:1px solid rgba(83,236,255,.54);border-bottom:1px solid rgba(83,236,255,.54);border-radius:0 0 0 10px}
        .QL7-academy-module .QL7-card-frame span:nth-child(4){right:10px;bottom:10px;border-right:1px solid rgba(255,210,95,.5);border-bottom:1px solid rgba(255,210,95,.5);border-radius:0 0 10px 0}
        .QL7-academy-module .QL7-card-copy { grid-area:copy; min-width:0; align-self:center; padding-right:2px; }
        .QL7-academy-module .QL7-card-meta { display:flex; align-items:center; gap:9px; margin-bottom:10px; min-width:0; color:#6f9fb2; font:700 .52rem/1 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:.12em; text-transform:uppercase; white-space:nowrap; }
        .QL7-academy-module .QL7-card-meta b { flex:0 0 auto; min-width:34px; padding:5px 7px; border:1px solid rgba(83,236,255,.45); border-radius:8px 3px 8px 3px; color:#8df5ff; text-align:center; background:rgba(2,15,24,.74); }
        .QL7-academy-module .QL7-card-meta span { overflow:hidden; text-overflow:ellipsis; }
        .QL7-academy-module .QL7-card-meta i { flex:0 0 auto; margin-left:auto; font-style:normal; color:rgba(255,210,95,.62); }
        .QL7-academy-module .QL7-card-question { margin:0; max-width:100%; color:#f5fbff; font-size:clamp(1.08rem,1.72vw,1.52rem); line-height:1.18; font-weight:900; letter-spacing:-.015em; overflow-wrap:anywhere; word-break:normal; }
        .QL7-academy-module .QL7-cyber-divider { display:flex; align-items:center; gap:7px; width:min(620px,94%); height:18px; margin:9px 0 7px; }
        .QL7-academy-module .QL7-cyber-divider span { height:1px; flex:1; }
        .QL7-academy-module .QL7-cyber-divider .cyan { background:linear-gradient(90deg,rgba(83,236,255,.12),#53ecff); }
        .QL7-academy-module .QL7-cyber-divider .gold { background:linear-gradient(90deg,#ffd25f,rgba(255,210,95,.08)); }
        .QL7-academy-module .QL7-cyber-divider i { width:8px; height:8px; flex:0 0 auto; transform:rotate(45deg); border:1px solid #79efff; background:#06131d; }
        .QL7-academy-module .QL7-cyber-divider b { width:18px; height:1px; flex:0 0 auto; background:#ffd25f; transform:skewX(-32deg); opacity:.88; }
        .QL7-academy-module .QL7-cyber-divider em { width:8px; height:8px; flex:0 0 auto; transform:rotate(45deg); border:1px solid #ffd25f; background:#171204; box-shadow:0 0 8px rgba(255,210,95,.16); }
        .QL7-academy-module .QL7-card-answer-label { margin-bottom:5px; color:#ffd25f; font:850 .58rem/1 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:.16em; text-transform:uppercase; }
        .QL7-academy-module .QL7-card-answer { margin:0; max-width:100%; color:#c8d8e2; font-size:clamp(.88rem,1.08vw,1rem); line-height:1.47; font-weight:620; overflow-wrap:anywhere; word-break:normal; }
        .QL7-academy-module .QL7-card-art { grid-area:art; position:relative; align-self:center; width:100%; height:clamp(128px,13vw,196px); min-width:0; max-width:360px; overflow:hidden !important; border-left:1px solid rgba(83,236,255,.14); border-radius:22px; contain:layout paint style; }
        .QL7-academy-module .QL7-card-art::before { content:''; position:absolute; inset:7px; z-index:0; border:1px solid rgba(255,210,95,.09); border-radius:18px; pointer-events:none; }
        .QL7-academy-module .QL7-art-glint { position:absolute; z-index:5; top:-20%; bottom:-20%; left:-34%; width:18%; pointer-events:none; opacity:0; background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.04) 16%,rgba(178,241,255,.44) 35%,rgba(255,255,255,.98) 50%,rgba(255,220,112,.68) 64%,rgba(255,255,255,.06) 84%,transparent 100%); mix-blend-mode:screen; transform:translate3d(0,0,0) skewX(-17deg); animation:QL7AcademySvgSunGlint 7.2s ease-in-out infinite; animation-delay:var(--ql7-art-glint-delay,0s); will-change:transform,opacity; }
        .QL7-academy-module .QL7-art-placeholder { width:100%; height:100%; border-radius:inherit; background:linear-gradient(135deg,rgba(8,24,36,.7),rgba(3,10,18,.9)); }
        .QL7-academy-module .QL7-art-svg { position:absolute !important; inset:0 !important; z-index:1; display:block !important; width:100% !important; height:100% !important; min-width:0 !important; min-height:0 !important; max-width:100% !important; max-height:100% !important; overflow:hidden !important; }

        .QL7-academy-module .QL7-exam-stage { position:relative; margin:22px 0 15px; padding:12px; overflow:visible; border:1px solid rgba(255,210,95,.56); border-radius:30px 12px 30px 12px; background:linear-gradient(145deg,rgba(31,23,5,.52),rgba(3,13,23,.99) 38%,rgba(4,28,36,.84)); box-shadow:inset 0 0 0 1px rgba(83,236,255,.16),0 16px 42px rgba(0,0,0,.28); }
        .QL7-academy-module .QL7-exam-stage::before { content:''; position:absolute; inset:7px; pointer-events:none; border:1px solid rgba(83,236,255,.14); border-radius:24px 8px 24px 8px; }
        .QL7-academy-module .QL7-exam-stage-head { position:relative; z-index:2; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:2px 8px 7px; }
        .QL7-academy-module .QL7-exam-stage-kicker { color:#fff1b6; font:900 .62rem/1 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:.18em; text-transform:uppercase; }
        .QL7-academy-module .QL7-exam-stage-index { color:#8df5ff; font:800 .58rem/1 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:.13em; }
        .QL7-academy-module .QL7-exam-stage-rail { display:flex; align-items:center; gap:8px; height:12px; margin:0 8px 5px; }
        .QL7-academy-module .QL7-exam-stage-rail span { height:1px; flex:1; }
        .QL7-academy-module .QL7-exam-stage-rail span:first-child { background:linear-gradient(90deg,transparent,#ffd25f); }
        .QL7-academy-module .QL7-exam-stage-rail span:last-child { background:linear-gradient(90deg,#53ecff,transparent); }
        .QL7-academy-module .QL7-exam-stage-rail i { width:7px; height:7px; transform:rotate(45deg); border:1px solid #ffd25f; }
        .QL7-academy-module .QL7-exam-stage-rail b { width:34px; height:1px; background:#53ecff; opacity:.62; }
        .QL7-academy-module .QL7-exam-stage-body { position:relative; z-index:1; }
        .QL7-academy-module .QL7-exam-cold { min-height:286px; border-radius:22px; background:linear-gradient(180deg,rgba(8,24,34,.72),rgba(2,9,17,.94)); border:1px solid rgba(83,236,255,.11); }
        .QL7-academy-module .QL7-exam-stage .QL7-exam { margin:0 !important; padding:16px 16px 17px !important; border-radius:24px 9px 24px 9px !important; border-color:rgba(83,236,255,.3) !important; background:linear-gradient(145deg,rgba(7,27,40,.98),rgba(2,10,18,.995) 52%,rgba(32,24,6,.36)) !important; box-shadow:inset 0 0 0 1px rgba(255,210,95,.1),0 0 0 1px rgba(0,0,0,.3) !important; }
        .QL7-academy-module .QL7-exam-stage .QL7-exam-header { padding:8px 10px 10px; margin:0 0 8px !important; border:1px solid rgba(83,236,255,.13); border-radius:16px 5px 16px 5px; background:linear-gradient(90deg,rgba(10,38,52,.62),rgba(31,24,7,.34)); }
        .QL7-academy-module .QL7-exam-stage .QL7-exam-title { color:#f4fbff !important; text-shadow:none !important; letter-spacing:.1em !important; }
        .QL7-academy-module .QL7-exam-stage .QL7-exam-reward { padding:5px 7px; border:1px solid rgba(255,210,95,.16); border-radius:12px 4px 12px 4px; background:rgba(22,17,5,.34); }
        .QL7-academy-module .QL7-exam-stage .QL7-question-card { border:1px solid rgba(83,236,255,.18) !important; border-radius:20px 7px 20px 7px !important; background:linear-gradient(145deg,rgba(7,30,45,.96),rgba(3,12,21,.99) 54%,rgba(33,23,6,.28)) !important; box-shadow:inset 0 0 0 1px rgba(255,210,95,.07) !important; }
        .QL7-academy-module .QL7-exam-stage .QL7-question-text { border-radius:15px 4px 15px 4px !important; border-color:rgba(83,236,255,.28) !important; background:linear-gradient(90deg,rgba(8,42,58,.84),rgba(13,25,34,.96)) !important; text-align:left !important; }
        .QL7-academy-module .QL7-exam-stage .QL7-answer { border-radius:15px 4px 15px 4px !important; border-color:rgba(83,236,255,.24) !important; background:linear-gradient(90deg,rgba(6,27,40,.94),rgba(9,20,29,.98)) !important; }
        .QL7-academy-module .QL7-exam-stage .QL7-answer-letter { border-radius:9px 3px 9px 3px !important; background:linear-gradient(145deg,#dffcff,#8ddfeb) !important; box-shadow:none !important; }
        .QL7-academy-module .QL7-exam-stage .QL7-answer.correct { border-color:rgba(64,220,139,.92) !important; background:linear-gradient(135deg,rgba(53,204,124,.98),rgba(23,147,88,.98)) !important; }
        .QL7-academy-module .QL7-exam-stage .QL7-answer.wrong { border-color:rgba(239,87,87,.92) !important; background:linear-gradient(135deg,rgba(227,92,92,.98),rgba(167,43,43,.98)) !important; }
        .QL7-academy-module .QL7-exam-stage .QL7-exam-auth-hint { border-radius:15px 4px 15px 4px !important; background:rgba(24,35,58,.76) !important; }
        .QL7-academy-module .QL7-exam-stage .QL7-exam-completed { border-radius:20px 7px 20px 7px !important; }
        /* Coin-burst, award overlay and QCoin x2 classes are deliberately not overridden here. */

        .QL7-academy-module .QL7-ad-stage { position:relative; margin:15px 0 10px; min-height:382px; padding:12px; overflow:hidden; border:1px solid rgba(83,236,255,.38); border-radius:28px 11px 28px 11px; background:linear-gradient(145deg,rgba(4,20,32,.99),rgba(25,18,4,.38)); box-shadow:inset 0 0 0 1px rgba(255,210,95,.12); }
        .QL7-academy-module .QL7-ad-stage::before { content:''; position:absolute; inset:7px; pointer-events:none; border:1px solid rgba(255,210,95,.08); border-radius:22px 7px 22px 7px; }
        .QL7-academy-module .QL7-ad-stage-rail { position:relative; z-index:2; display:flex; align-items:center; gap:8px; height:18px; margin:0 5px 7px; }
        .QL7-academy-module .QL7-ad-stage-rail span { height:1px; flex:1; }
        .QL7-academy-module .QL7-ad-stage-rail span:first-child { background:linear-gradient(90deg,transparent,rgba(83,236,255,.55)); }
        .QL7-academy-module .QL7-ad-stage-rail span:last-child { background:linear-gradient(90deg,rgba(255,210,95,.55),transparent); }
        .QL7-academy-module .QL7-ad-stage-rail i { width:8px; height:8px; border:1px solid #53ecff; transform:rotate(45deg); }
        .QL7-academy-module .QL7-ad-stage-code { position:absolute; top:9px; right:17px; z-index:3; color:rgba(255,224,142,.72); font:800 .48rem/1 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:.12em; }
        .QL7-academy-module .QL7-ad-cold { min-height:338px; border-radius:20px; border:1px solid rgba(83,236,255,.08); background:#020911; }

        .QL7-academy-module .QL7-pagination { position:relative; margin:10px 0 26px; padding:11px 14px 12px; overflow:hidden; border:1px solid rgba(83,236,255,.3); border-radius:20px 7px 20px 7px; background:linear-gradient(135deg,rgba(5,22,34,.98),rgba(3,10,18,.995) 60%,rgba(28,20,6,.34)); box-shadow:inset 0 0 0 1px rgba(255,210,95,.08); }
        .QL7-academy-module .QL7-pagination-toprail { display:flex; align-items:center; gap:8px; margin-bottom:9px; }
        .QL7-academy-module .QL7-pagination-toprail span { height:1px; flex:1; }
        .QL7-academy-module .QL7-pagination-toprail span:first-child { background:linear-gradient(90deg,transparent,#53ecff); }
        .QL7-academy-module .QL7-pagination-toprail span:last-child { background:linear-gradient(90deg,#ffd25f,transparent); }
        .QL7-academy-module .QL7-pagination-toprail i { width:7px; height:7px; border:1px solid #ffd25f; transform:rotate(45deg); }
        .QL7-academy-module .QL7-pagination-controls { display:flex; align-items:center; justify-content:center; gap:8px; }
        .QL7-academy-module .QL7-pagination-controls button { width:46px; height:40px; display:grid; place-items:center; padding:0; border:1px solid rgba(83,236,255,.5); border-radius:13px 4px 13px 4px; background:linear-gradient(145deg,rgba(8,31,45,.96),rgba(4,14,23,.99)); color:#c7f9ff; font:850 1.02rem/1 system-ui; cursor:pointer; box-shadow:inset 0 0 0 1px rgba(255,255,255,.025); }
        .QL7-academy-module .QL7-pagination-controls button:nth-child(4), .QL7-academy-module .QL7-pagination-controls button:nth-child(5) { border-color:rgba(255,210,95,.48); color:#ffe59d; }
        .QL7-academy-module .QL7-pagination-controls button:disabled { opacity:.24; cursor:default; }
        .QL7-academy-module .QL7-pagination-index { min-width:102px; height:44px; display:flex; align-items:center; justify-content:center; gap:7px; border:1px solid rgba(255,210,95,.48); border-radius:15px 5px 15px 5px; background:linear-gradient(145deg,rgba(8,31,43,.96),rgba(26,20,6,.66)); }
        .QL7-academy-module .QL7-pagination-index strong { color:#8ef5ff; font:900 .9rem/1 ui-monospace,SFMono-Regular,Menlo,monospace; }
        .QL7-academy-module .QL7-pagination-index span { color:#597986; font-size:.72rem; }
        .QL7-academy-module .QL7-pagination-index em { color:#ffe08a; font:850 .66rem/1 ui-monospace,SFMono-Regular,Menlo,monospace; font-style:normal; }
        .QL7-academy-module .QL7-pagination-foot { display:flex; align-items:center; justify-content:center; gap:12px; margin-top:10px; min-height:14px; }
        .QL7-academy-module .QL7-pagination-foot i { width:72px; max-width:18vw; height:1px; opacity:.72; }
        .QL7-academy-module .QL7-pagination-foot i:first-child { background:linear-gradient(90deg,transparent,rgba(83,236,255,.72),rgba(255,210,95,.48)); }
        .QL7-academy-module .QL7-pagination-foot i:last-child { background:linear-gradient(90deg,rgba(255,210,95,.48),rgba(83,236,255,.72),transparent); }
        .QL7-academy-module .QL7-pagination-foot span { color:#dffaff; font:900 .52rem/1 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:.28em; text-indent:.28em; text-shadow:0 0 9px rgba(83,236,255,.28),0 0 13px rgba(255,210,95,.12); }

        @keyframes QL7AcademySvgSunGlint {
          0%,58% { opacity:0; transform:translate3d(0,0,0) skewX(-17deg); }
          62% { opacity:.24; }
          68% { opacity:.96; }
          76% { opacity:.5; }
          82%,100% { opacity:0; transform:translate3d(760%,0,0) skewX(-17deg); }
        }

        @keyframes QL7TitleRailPulse {
          0%,100% { transform:scale(.78); opacity:.58; }
          50% { transform:scale(1); opacity:1; }
        }

        @media (max-width:760px) {
          .QL7-academy-module { padding:8px !important; border-radius:24px !important; }
          .QL7-academy-module .QL7-title-badge { padding:16px 10px 18px; }
          .QL7-academy-module .QL7-title-primary { font-size:clamp(.94rem,4.7vw,1.22rem); letter-spacing:.15em; }
          .QL7-academy-module .QL7-title-secondary { font-size:clamp(.38rem,1.72vw,.72rem); letter-spacing:-.01em; line-height:1; }
          .QL7-academy-module .QL7-title-rail { width:88%; margin:8px auto 7px; }
          .QL7-academy-module .QL7-knowledge-card { grid-template-columns:minmax(0,1fr); grid-template-areas:"art" "copy"; gap:10px; min-height:0; padding:12px 12px 14px; border-radius:21px 10px 21px 10px; }
          .QL7-academy-module .QL7-card-copy { padding:0 2px 0; }
          .QL7-academy-module .QL7-card-meta span { display:none; }
          .QL7-academy-module .QL7-card-meta i { margin-left:0; }
          .QL7-academy-module .QL7-card-question { font-size:clamp(.98rem,4.45vw,1.2rem); }
          .QL7-academy-module .QL7-card-answer { font-size:clamp(.8rem,3.35vw,.92rem); line-height:1.42; }
          .QL7-academy-module .QL7-card-art { width:100%; height:clamp(126px,34vw,154px); max-width:none; border-left:0; border-bottom:1px solid rgba(83,236,255,.12); border-radius:17px 8px 17px 8px; }
          .QL7-academy-module .QL7-exam-stage { padding:8px; border-radius:24px 9px 24px 9px; }
          .QL7-academy-module .QL7-exam-stage .QL7-exam { padding:12px !important; }
          .QL7-academy-module .QL7-ad-stage { padding:8px; min-height:330px; border-radius:22px 8px 22px 8px; }
          .QL7-academy-module .QL7-ad-cold { min-height:292px; }
          .QL7-academy-module .QL7-pagination-controls { gap:5px; }
          .QL7-academy-module .QL7-pagination-controls button { width:40px; height:40px; }
          .QL7-academy-module .QL7-pagination-index { min-width:82px; height:40px; }
        }
        @media (max-width:440px) {
          .QL7-academy-module .QL7-banner-wrap,
          .QL7-academy-module .QL7-banner-img { min-height:132px; max-height:210px; }
          .QL7-academy-module .QL7-title-primary { font-size:clamp(.84rem,4.5vw,1rem); }
          .QL7-academy-module .QL7-title-secondary { font-size:clamp(.34rem,1.58vw,.56rem); letter-spacing:-.018em; }
          .QL7-academy-module .QL7-knowledge-card { grid-template-columns:minmax(0,1fr); grid-template-areas:"art" "copy"; gap:9px; padding:11px 10px 13px; }
          .QL7-academy-module .QL7-card-meta { gap:5px; }
          .QL7-academy-module .QL7-card-meta i { display:none; }
          .QL7-academy-module .QL7-card-question { font-size:clamp(.92rem,4.15vw,1.06rem); }
          .QL7-academy-module .QL7-card-answer { font-size:clamp(.75rem,3.08vw,.84rem); }
          .QL7-academy-module .QL7-card-art { width:100%; height:124px; max-width:none; }
          .QL7-academy-module .QL7-cyber-divider { width:98%; }
          .QL7-academy-module .QL7-exam-stage-kicker { font-size:.52rem; letter-spacing:.12em; }
          .QL7-academy-module .QL7-pagination-foot { gap:9px; margin-top:8px; }
          .QL7-academy-module .QL7-pagination-foot i { width:48px; max-width:24vw; }
          .QL7-academy-module .QL7-pagination-foot span { font-size:.46rem; }
        }
        @media (prefers-reduced-motion:reduce) {
          .QL7-academy-module .QL7-art-glint { animation:none !important; }
        }
      `}</style>
    </section>
  )
}

function AcademyPaginator({ children }) {
  const all = Children.toArray(children)
  const pages = useMemo(
    () => all.filter((child) => isValidElement(child) && child.type === QASection),
    [all]
  )
  const [page, setPage] = useState(0)
  const [transition, setTransition] = useState(null)
  const swipeRef = useRef(null)
  const swipeStartRef = useRef(null)
  const transitionRef = useRef(null)
  const transitionTimerRef = useRef(0)
  const transitionSequenceRef = useRef(0)
  const pageCount = pages.length
  const safePage = pageCount ? Math.min(Math.max(page, 0), pageCount - 1) : 0

  const finishTransition = useCallback((transitionId) => {
    const current = transitionRef.current
    if (!current || current.id !== transitionId) return
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current)
    transitionTimerRef.current = 0
    transitionRef.current = null
    setPage(current.to)
    setTransition(null)
  }, [])

  useEffect(() => () => {
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current)
  }, [])

  const goTo = useCallback((target) => {
    if (!pageCount || transitionRef.current) return
    const next = Math.min(Math.max(Number(target) || 0, 0), pageCount - 1)
    if (next === safePage) return

    const focused = typeof document !== 'undefined' ? document.activeElement : null
    if (focused && swipeRef.current?.contains(focused) && typeof focused.blur === 'function') focused.blur()

    const reducedMotion = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setPage(next)
      return
    }

    const nextTransition = {
      id: ++transitionSequenceRef.current,
      from: safePage,
      to: next,
      direction: next > safePage ? 'forward' : 'backward',
    }
    transitionRef.current = nextTransition
    setTransition(nextTransition)
    transitionTimerRef.current = window.setTimeout(
      () => finishTransition(nextTransition.id),
      620
    )
  }, [finishTransition, pageCount, safePage])

  const onPointerDown = useCallback((event) => {
    if (transitionRef.current) return
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return
    const target = event.target
    if (target && target.closest && target.closest('button,a,input,textarea,select,video,iframe,[role="button"],[data-academy-swipe-ignore="1"]')) return
    swipeStartRef.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
  }, [])

  const onPointerUp = useCallback((event) => {
    const start = swipeStartRef.current
    swipeStartRef.current = null
    if (!start || start.id !== event.pointerId) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < 86) return
    if (Math.abs(dx) < Math.abs(dy) * 1.6) return
    if (Math.abs(dy) > 64) return
    goTo(dx < 0 ? safePage + 1 : safePage - 1)
  }, [goTo, safePage])

  const onPointerCancel = useCallback(() => {
    swipeStartRef.current = null
  }, [])

  if (!pageCount) return <>{children}</>

  const visiblePages = (transition ? [transition.from, transition.to] : [safePage])
    .filter((index, position, list) => index >= 0 && index < pageCount && list.indexOf(index) === position)

  return (
    <div
      ref={swipeRef}
      className="QL7-academy-pager-surface"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div className="QL7-academy-pager-track" data-direction={transition?.direction || 'idle'}>
        {visiblePages.map((pageIndex) => {
          const phase = transition
            ? pageIndex === transition.from
              ? 'outgoing'
              : pageIndex === transition.to
                ? 'incoming'
                : 'parked'
            : pageIndex === safePage
              ? 'active'
              : 'parked'
          return (
            <div
              key={`academy-page-${pageIndex}`}
              className="QL7-academy-page-stage"
              data-phase={phase}
              aria-hidden={phase === 'parked' || phase === 'outgoing' ? 'true' : undefined}
              onAnimationEnd={phase === 'incoming' ? (event) => {
                if (event.target === event.currentTarget && transition) finishTransition(transition.id)
              } : undefined}
            >
              {cloneElement(pages[pageIndex], {
                pagination: { page: pageIndex, pageCount, onNavigate: goTo },
              })}
            </div>
          )
        })}
      </div>
      <style jsx>{`
        .QL7-academy-pager-surface {
          position:relative;
          min-width:0;
          touch-action:pan-y;
          overscroll-behavior-x:contain;
        }
        .QL7-academy-pager-track {
          position:relative;
          display:grid;
          grid-template-columns:minmax(0,1fr);
          min-width:0;
          isolation:isolate;
        }
        .QL7-academy-pager-track[data-direction='forward'],
        .QL7-academy-pager-track[data-direction='backward'] {
          overflow:hidden;
          overflow:clip;
        }
        .QL7-academy-page-stage {
          grid-area:1 / 1;
          min-width:0;
          width:100%;
        }
        .QL7-academy-page-stage[data-phase='parked'] { display:none; }
        .QL7-academy-page-stage[data-phase='incoming'],
        .QL7-academy-page-stage[data-phase='outgoing'] {
          pointer-events:none;
          backface-visibility:hidden;
          will-change:transform,opacity;
          animation-duration:520ms;
          animation-timing-function:cubic-bezier(.22,1,.36,1);
          animation-fill-mode:both;
        }
        .QL7-academy-pager-track[data-direction='forward'] .QL7-academy-page-stage[data-phase='outgoing'] {
          animation-name:QL7AcademyPageOutForward;
        }
        .QL7-academy-pager-track[data-direction='forward'] .QL7-academy-page-stage[data-phase='incoming'] {
          animation-name:QL7AcademyPageInForward;
        }
        .QL7-academy-pager-track[data-direction='backward'] .QL7-academy-page-stage[data-phase='outgoing'] {
          animation-name:QL7AcademyPageOutBackward;
        }
        .QL7-academy-pager-track[data-direction='backward'] .QL7-academy-page-stage[data-phase='incoming'] {
          animation-name:QL7AcademyPageInBackward;
        }
        @keyframes QL7AcademyPageOutForward {
          from { opacity:1; transform:translate3d(0,0,0); }
          to { opacity:.82; transform:translate3d(-100%,0,0); }
        }
        @keyframes QL7AcademyPageInForward {
          from { opacity:.82; transform:translate3d(100%,0,0); }
          to { opacity:1; transform:translate3d(0,0,0); }
        }
        @keyframes QL7AcademyPageOutBackward {
          from { opacity:1; transform:translate3d(0,0,0); }
          to { opacity:.82; transform:translate3d(100%,0,0); }
        }
        @keyframes QL7AcademyPageInBackward {
          from { opacity:.82; transform:translate3d(-100%,0,0); }
          to { opacity:1; transform:translate3d(0,0,0); }
        }
        @media (prefers-reduced-motion:reduce) {
          .QL7-academy-page-stage { animation:none !important; }
        }
      `}</style>
    </div>
  )
}


function AcademyContent() {
  const { t } = useI18n()
  const marqueeRef = useRef(null)

  useEffect(() => {
    if (marqueeRef.current) {
      marqueeRef.current.innerHTML += marqueeRef.current.innerHTML
    }
  }, [])

  const defiKeys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (i + 1).toString().padStart(3, '0')
        return `qa_defi_${n}`
      }),
    []
  )

  const defiKeys2 = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (i + 51).toString().padStart(3, '0')
        return `qa_defi_${n}`
      }),
    []
  )
 

  const chainKeys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (i + 101).toString().padStart(3, '0')
        return `qa_chain_${n}`
      }),
    []
  ) 

  const web3SecKeys = useMemo(
    () => [
      // qa_web3_201–230 (30 пар)
      ...Array.from({ length: 30 }, (_, i) => {
        const n = (i + 201).toString().padStart(3, '0')
        return `qa_web3_${n}`
      }),
      // qa_sec_301–320 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (i + 301).toString().padStart(3, '0')
        return `qa_sec_${n}`
      }),
    ],
    []
  )

  const secTradeKeys = useMemo(
    () => [
      // qa_sec_321–350 (30 пар)
      ...Array.from({ length: 30 }, (_, i) => {
        const n = (i + 321).toString().padStart(3, '0')
        return `qa_sec_${n}`
      }),
      // qa_trade_401–420 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (i + 401).toString().padStart(3, '0')
        return `qa_trade_${n}`
      }),
    ],
    []
  )

  const tradeNftKeys = useMemo(
    () => [
      // qa_trade_421–450 (30 пар)
      ...Array.from({ length: 30 }, (_, i) => {
        const n = (i + 421).toString().padStart(3, '0')
        return `qa_trade_${n}`
      }),
      // qa_nft_501–520 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (i + 501).toString().padStart(3, '0')
        return `qa_nft_${n}`
      }),
    ],
    []
  )

  const nftRegAiKeys = useMemo(
    () => [
      // qa_nft_521–530 (10 пар)
      ...Array.from({ length: 10 }, (_, i) => {
        const n = (i + 521).toString().padStart(3, '0')
        return `qa_nft_${n}`
      }),
      // qa_reg_601–620 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (i + 601).toString().padStart(3, '0')
        return `qa_reg_${n}`
      }),
      // qa_ai_701–720 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (i + 701).toString().padStart(3, '0')
        return `qa_ai_${n}`
      }),
    ],
    []
  )

  const daoMetaKeys = useMemo(
    () => [
      // qa_dao_801–820 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (i + 801).toString().padStart(3, '0')
        return `qa_dao_${n}`
      }),
      // qa_meta_901–930 (30 пар)
     ...Array.from({ length: 30 }, (_, i) => {
        const n = (i + 901).toString().padStart(3, '0')
        return `qa_meta_${n}`
      }),
    ],
    []
  )


  const metaTailKeys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (i + 931).toString().padStart(3, '0')
        return `qa_meta_${n}`
      }),
    []
  )


  const metaGamefiKeys = useMemo(
    () => [
      // qa_meta_981–1000 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (i + 981).toString().padStart(3, '0')
        return `qa_meta_${n}`
      }),
      // qa_gamefi_1001–1030 (30 пар)
      ...Array.from({ length: 30 }, (_, i) => {
        const n = (i + 1001).toString().padStart(4, '0')
        return `qa_gamefi_${n}`
      }),
    ],
    []
  )


  const gamefiSocialfiKeys = useMemo(
    () => [
      // qa_gamefi_1031–1050 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (i + 1031).toString().padStart(4, '0')
        return `qa_gamefi_${n}`
      }),
      // qa_socialfi_1051–1080 (30 пар)
      ...Array.from({ length: 30 }, (_, i) => {
        const n = (i + 1051).toString().padStart(4, '0')
        return `qa_socialfi_${n}`
      }),
    ],
   []
  ) 

  const socialfiDevKeys = useMemo(
    () => [
      // qa_socialfi_1081–1100 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (i + 1081).toString().padStart(4, '0')
        return `qa_socialfi_${n}`
      }),
      // qa_dev_1101–1130 (30 пар)
      ...Array.from({ length: 30 }, (_, i) => {
        const n = (i + 1101).toString().padStart(4, '0')
        return `qa_dev_${n}`
      }),
    ],
    []
  )  

  const devDataKeys = useMemo(
    () => [
      // qa_dev_1131–1150 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
       const n = (i + 1131).toString().padStart(4, '0')
        return `qa_dev_${n}`
      }),
      // qa_data_1151–1180 (30 пар)
      ...Array.from({ length: 30 }, (_, i) => {
        const n = (i + 1151).toString().padStart(4, '0')
        return `qa_data_${n}`
      }),
    ],
    []
  )

  const dataAiKeys = useMemo(
    () => [
      // qa_data_1181–1200 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (i + 1181).toString().padStart(4, '0')
        return `qa_data_${n}`
      }),
      // qa_ai_1201–1230 (30 пар)
      ...Array.from({ length: 30 }, (_, i) => {
        const n = (i + 1201).toString().padStart(4, '0')
        return `qa_ai_${n}`
      }),
    ],
    []
  )

  const aiDeepKeys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (i + 1231).toString().padStart(4, '0')
        return `qa_ai_${n}`
      }),
    []
  )

  const aiNextKeys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (i + 1281).toString().padStart(4, '0')
        return `qa_ai_${n}`
      }),
    []
  )

  const aiMetaKeys = useMemo(
    () => [
      // qa_ai_1331–1340 (10 пар)
      ...Array.from({ length: 10 }, (_, i) => {
        const n = (i + 1331).toString().padStart(4, '0')
        return `qa_ai_${n}`
      }),
      // qa_meta_1341–1380 (40 пар)
      ...Array.from({ length: 40 }, (_, i) => {
        const n = (i + 1341).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    ],
    []
  )

  const metaMix18Keys = useMemo(
    () => [
      // qa_meta_1381–1400 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (1381 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
      // qa_gamefi_1401–1410 (10 пар)
      ...Array.from({ length: 10 }, (_, i) => {
        const n = (1401 + i).toString().padStart(4, '0')
        return `qa_gamefi_${n}`
      }),
      // qa_socialfi_1411–1416 (6 пар)
      ...Array.from({ length: 6 }, (_, i) => {
        const n = (1411 + i).toString().padStart(4, '0')
        return `qa_socialfi_${n}`
      }),
      // qa_ops_1417–1420 (4 пар)
      ...Array.from({ length: 4 }, (_, i) => {
        const n = (1417 + i).toString().padStart(4, '0')
        return `qa_ops_${n}`
      }),
      // qa_data_1421–1425 (5 пар)
      ...Array.from({ length: 5 }, (_, i) => {
        const n = (1421 + i).toString().padStart(4, '0')
        return `qa_data_${n}`
      }),
      // qa_meta_1426–1430 (5 пар)
      ...Array.from({ length: 5 }, (_, i) => {
        const n = (1426 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    ],
    []
  )

  const metaAiReg19Keys = useMemo(
    () => [
      // qa_meta_1431–1460 (30 пар)
      ...Array.from({ length: 30 }, (_, i) => {
        const n = (1431 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
      // qa_ai_1461–1470 (10 пар)
      ...Array.from({ length: 10 }, (_, i) => {
        const n = (1461 + i).toString().padStart(4, '0')
        return `qa_ai_${n}`
      }),
      // qa_reg_1471–1480 (10 пар)
      ...Array.from({ length: 10 }, (_, i) => {
        const n = (1471 + i).toString().padStart(4, '0')
        return `qa_reg_${n}`
      }),
    ],
    []
  )

  const rwaGamefiMix20Keys = useMemo(
    () => [
      // qa_rwa_1481–1490 (10 пар)
      ...Array.from({ length: 10 }, (_, i) => {
        const n = (1481 + i).toString().padStart(4, '0')
        return `qa_rwa_${n}`
      }),
      // qa_gamefi_1491–1496 (6 пар)
      ...Array.from({ length: 6 }, (_, i) => {
        const n = (1491 + i).toString().padStart(4, '0')
        return `qa_gamefi_${n}`
      }),
      // qa_socialfi_1497–1500 (4 пар)
      ...Array.from({ length: 4 }, (_, i) => {
        const n = (1497 + i).toString().padStart(4, '0')
        return `qa_socialfi_${n}`
      }),
      // qa_ops_1501–1505 (5 пар)
      ...Array.from({ length: 5 }, (_, i) => {
        const n = (1501 + i).toString().padStart(4, '0')
        return `qa_ops_${n}`
      }),
      // qa_data_1506–1510 (5 пар)
      ...Array.from({ length: 5 }, (_, i) => {
        const n = (1506 + i).toString().padStart(4, '0')
        return `qa_data_${n}`
      }),
      // qa_ethics_1511–1515 (5 пар)
      ...Array.from({ length: 5 }, (_, i) => {
        const n = (1511 + i).toString().padStart(4, '0')
        return `qa_ethics_${n}`
      }),
      // qa_future_1516–1520 (5 пар)
      ...Array.from({ length: 5 }, (_, i) => {
        const n = (1516 + i).toString().padStart(4, '0')
        return `qa_future_${n}`
      }),
      // qa_meta_1521–1530 (10 пар)
      ...Array.from({ length: 10 }, (_, i) => {
        const n = (1521 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    ],
    []
  )

  const meta21Keys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (1531 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    []
  )

  const meta22Keys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (1581 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    []
  )

  const meta23Keys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
       const n = (1631 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    []
  )

  const meta24Keys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (1681 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    []
  )

  const meta25Keys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (1731 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    []
  )

  const meta26Keys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (1781 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    []
  )

  const meta27Keys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (1831 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
   []
  )

  const meta28Keys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (1881 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    []
  )

  const meta29Keys = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => {
        const n = (1931 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    []
  )

  return (
     <div className="page-content container QL7-academy-route" data-ql7-visual-scope="route">
      <AcademyPaginator>
      <QASection
        blockId={1}
        imageSrc="/academy/defi_block_01.png"
        imageAlt="QL7 Academy — DeFi Module"
        titleKey="qa_ru_title_main"
        qaKeys={defiKeys}
      />
      <QASection
        blockId={2}
        imageSrc="/academy/defi_block_02.png" // положи баннер 2 в /public/academy
        imageAlt="QL7 Academy — DeFi Module 2"        
        qaKeys={defiKeys2}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={3}
       imageSrc="/academy/chain_block_03.png" // баннер для цепочек в /public/academy
        imageAlt="QL7 Academy — Chain Module"      
        qaKeys={chainKeys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={4}
        imageSrc="/academy/web3_sec_block_04.png" // баннер для Web3/Security в /public/academy
        imageAlt="QL7 Academy — Web3 & Security Module"       
        qaKeys={web3SecKeys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={5}
        imageSrc="/academy/sec_trade_block_05.png" // баннер для Security/Trading в /public/academy
        imageAlt="QL7 Academy — Security & Trading Module"
        qaKeys={secTradeKeys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={6}
        imageSrc="/academy/trade_nft_block_06.png" // баннер для Trading/NFT
        imageAlt="QL7 Academy — Trading & NFT Module"
        qaKeys={tradeNftKeys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={7}
        imageSrc="/academy/nft_reg_ai_block_07.png" // баннер для NFT/Reg/AI
        imageAlt="QL7 Academy — NFT, Regulation & AI Module"
        qaKeys={nftRegAiKeys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={8}
        imageSrc="/academy/dao_meta_block_08.png"
        imageAlt="QL7 Academy — DAO & Metaverse Module"
        qaKeys={daoMetaKeys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={9}
        imageSrc="/academy/meta_block_09.png" // баннер для финального Meta-блока
        imageAlt="QL7 Academy — Metaverse Advanced Module"
        qaKeys={metaTailKeys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={10}
        imageSrc="/academy/meta_gamefi_block_10.png" // баннер для Meta/GameFi
        imageAlt="QL7 Academy — Meta & GameFi Module"
        qaKeys={metaGamefiKeys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={11}
        imageSrc="/academy/gamefi_socialfi_block_11.png" // баннер для GameFi/SocialFi
        imageAlt="QL7 Academy — GameFi & SocialFi Module"
        qaKeys={gamefiSocialfiKeys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={12}
        imageSrc="/academy/socialfi_dev_block_12.png" // баннер для SocialFi/Dev
        imageAlt="QL7 Academy — SocialFi & Dev Module"
        qaKeys={socialfiDevKeys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={13}
        imageSrc="/academy/dev_data_block_13.png" // баннер для Dev/Data
        imageAlt="QL7 Academy — Dev & Data Module"
        qaKeys={devDataKeys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={14}
        imageSrc="/academy/data_ai_block_14.png" // баннер для Data/AI
        imageAlt="QL7 Academy — Data & AI Module"
        qaKeys={dataAiKeys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={15}
        imageSrc="/academy/ai_block_15.png" // баннер для продвинутого AI-модуля
        imageAlt="QL7 Academy — Advanced AI Module"
        qaKeys={aiDeepKeys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={16}
        imageSrc="/academy/ai_block_16.png" // баннер для следующего AI-модуля
        imageAlt="QL7 Academy — AI Module II"
        qaKeys={aiNextKeys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={17}
        imageSrc="/academy/ai_meta_block_17.png" // баннер для AI+Metaverse финального блока
        imageAlt="QL7 Academy — AI & Metaverse Module"
        qaKeys={aiMetaKeys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={18}
        imageSrc="/academy/meta_mix_block_18.png"
        imageAlt="QL7 Academy — Meta/GameFi/SocialFi/Ops/Data Mix Module"
        qaKeys={metaMix18Keys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={19}
        imageSrc="/academy/meta_ai_reg_block_19.png"
        imageAlt="QL7 Academy — Meta, AI & Regulations Module"
        qaKeys={metaAiReg19Keys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={20}
        imageSrc="/academy/rwa_gamefi_mix_block_20.png"
        imageAlt="QL7 Academy — RWA, GameFi, SocialFi, Ops, Data, Ethics, Future & Meta Module"
        qaKeys={rwaGamefiMix20Keys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={21}
        imageSrc="/academy/meta_block_21.png"
        imageAlt="QL7 Academy — Metaverse Advanced Module"
        qaKeys={meta21Keys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={22}
        imageSrc="/academy/meta_block_22.png"
        imageAlt="QL7 Academy — Metaverse Expert Module"
        qaKeys={meta22Keys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={23}
       imageSrc="/academy/meta_block_23.png"
        imageAlt="QL7 Academy — Metaverse Ultra Module"
        qaKeys={meta23Keys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={24}
        imageSrc="/academy/meta_block_24.png"
        imageAlt="QL7 Academy — Metaverse Infinity Module"
        qaKeys={meta24Keys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={25}
        imageSrc="/academy/meta_block_25.png"
        imageAlt="QL7 Academy — Metaverse Legend Module"
        qaKeys={meta25Keys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={26}
        imageSrc="/academy/meta_block_26.png"
        imageAlt="QL7 Academy — Metaverse Oracle Module"
        qaKeys={meta26Keys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={27}
        imageSrc="/academy/meta_block_27.png"
        imageAlt="QL7 Academy — Metaverse Infinity Module"
        qaKeys={meta27Keys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={28}
        imageSrc="/academy/meta_block_28.png"
        imageAlt="QL7 Academy — Metaverse Deep Space Module"
        qaKeys={meta28Keys}
        titleKey="qa_ru_title_main"
      />
      <QASection
        blockId={29}
        imageSrc="/academy/meta_block_29.png"
        imageAlt="QL7 Academy — Metaverse Final Frontier Module"
       qaKeys={meta29Keys}
       titleKey="qa_ru_title_main"
      />
      </AcademyPaginator>
      <style jsx global>{`
        .QL7-academy-route .QL7-exam {
          margin: 0 !important;
          padding: 18px !important;
          border: 1px solid rgba(255, 212, 93, .52) !important;
          border-radius: 22px 6px 22px 6px !important;
          background: linear-gradient(145deg, rgba(24, 18, 5, .62), rgba(3, 15, 25, .99) 44%, rgba(4, 29, 36, .86)) !important;
          box-shadow: inset 0 0 0 1px rgba(69, 232, 255, .16), 0 14px 34px rgba(0,0,0,.28) !important;
          overflow: hidden !important;
        }
        .QL7-academy-route .QL7-exam::before,
        .QL7-academy-route .QL7-exam::after {
          content: '';
          position: absolute;
          pointer-events: none;
        }
        .QL7-academy-route .QL7-exam::before { left: 14px; right: 14px; top: 10px; height: 1px; background: linear-gradient(90deg, transparent, #ffd45d 28%, #45e8ff 72%, transparent); opacity: .68; }
        .QL7-academy-route .QL7-exam::after { right: 10px; top: 28px; width: 26px; height: 26px; border-top: 1px solid rgba(69,232,255,.5); border-right: 1px solid rgba(255,212,93,.45); }
        .QL7-academy-route .QL7-exam-header { padding: 8px 4px 10px !important; border-bottom: 1px solid rgba(69,232,255,.12); }
        .QL7-academy-route .QL7-exam-title { color: #f5fbff !important; letter-spacing: .11em !important; font-weight: 900 !important; text-shadow: none !important; }
        .QL7-academy-route .QL7-exam-reward { padding: 7px 9px !important; border: 1px solid rgba(255,212,93,.24); border-radius: 12px 3px 12px 3px; background: rgba(21,16,4,.35); }
        .QL7-academy-route .QL7-exam-reward-value { background: linear-gradient(135deg,#ffe98d,#dcae36) !important; box-shadow: inset 0 0 0 1px rgba(255,255,255,.24) !important; animation: none !important; }
        .QL7-academy-route .QL7-question-card { padding: 14px !important; border: 1px solid rgba(69,232,255,.28) !important; border-radius: 18px 5px 18px 5px !important; background: linear-gradient(145deg, rgba(5,25,37,.95), rgba(3,11,20,.99)) !important; box-shadow: inset 0 0 0 1px rgba(255,212,93,.06) !important; }
        .QL7-academy-route .QL7-question-text { border-radius: 14px 4px 14px 4px !important; border: 1px solid rgba(69,232,255,.32) !important; background: rgba(4,18,29,.88) !important; text-align: left !important; color: #edf9ff !important; }
        .QL7-academy-route .QL7-answers-grid { gap: 8px !important; }
        .QL7-academy-route .QL7-answer { min-height: 48px; border-radius: 13px 3px 13px 3px !important; border: 1px solid rgba(69,232,255,.24) !important; background: linear-gradient(135deg, rgba(7,24,35,.98), rgba(3,12,20,.98)) !important; box-shadow: inset 0 0 0 1px rgba(255,255,255,.02) !important; }
        .QL7-academy-route .QL7-answer:hover:not(:disabled) { border-color: rgba(255,212,93,.48) !important; transform: none !important; box-shadow: inset 0 0 0 1px rgba(255,212,93,.08) !important; }
        .QL7-academy-route .QL7-answer-letter { border-radius: 8px 2px 8px 2px !important; background: #07151f !important; color: #92f4ff !important; border: 1px solid rgba(69,232,255,.42); box-shadow: none !important; }
        .QL7-academy-route .QL7-answer.correct { border-color: rgba(73,225,139,.78) !important; background: rgba(9,60,38,.52) !important; }
        .QL7-academy-route .QL7-answer.wrong { border-color: rgba(255,100,115,.7) !important; background: rgba(70,16,24,.48) !important; }
        .QL7-academy-route .QL7-exam-auth-hint { border-radius: 12px 3px 12px 3px !important; background: rgba(35,25,7,.38) !important; border-color: rgba(255,212,93,.4) !important; }
        .QL7-academy-route .QL7-exam-completed { border: 1px solid rgba(73,225,139,.38); border-radius: 16px 4px 16px 4px; background: rgba(8,43,30,.34); }
        .QL7-academy-route .QL7-exam .QL7-divider-pulse { animation: none !important; box-shadow: none !important; background: #45e8ff !important; }
        .QL7-academy-route .QL7-ad-stage > section[data-ads-slot] { margin: 0 !important; padding: 7px !important; border: 1px solid rgba(255,212,93,.18) !important; border-radius: 18px 5px 18px 5px !important; background: #020a12 !important; box-shadow: inset 0 0 0 1px rgba(69,232,255,.08) !important; overflow: hidden !important; }
        .QL7-academy-route .QL7-ad-stage [data-site-ad-card="1"] { border-radius: 15px !important; overflow: hidden !important; }
        .QL7-academy-route .QL7-ad-stage img,
        .QL7-academy-route .QL7-ad-stage video,
        .QL7-academy-route .QL7-ad-stage iframe,
        .QL7-academy-route .QL7-ad-stage svg,
        .QL7-academy-route .QL7-ad-stage canvas { max-width: 100% !important; }
        @media (max-width: 720px) {
          .QL7-academy-route .QL7-exam { padding: 12px !important; border-radius: 18px 5px 18px 5px !important; }
          .QL7-academy-route .QL7-answers-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Маркиза: использует глобальные стили из layout/home */}
      <section className="marquee-wrap no-gutters" aria-hidden="true" data-ql7-visual-scope="panel">
        <div className="marquee" ref={marqueeRef}>
          <span>{t('marquee')}</span>
          <span>{t('marquee')}</span>
          <span>{t('marquee')}</span>
          <span>{t('marquee')}</span>
        </div>
      </section>


      {/* Иконки снизу: те же, что на главной */}
      <div className="ql7-icons-row ql7-footer-social-layout" data-ql7-visual-scope="panel">
        <Link
          href="/privacy"
          className="ql7-icon-link ql7-footer-policy-link"
          aria-label="Privacy / Политика"
          style={{ '--size': '130px' }}
        >
          <Image
            className="ql7-click-icon"
            src="/click/policy.png"
            alt="Privacy"
            width={130}
            height={130}
            draggable={false}
          />
        </Link>

       <SiteSocialLinksRow className="ql7-social-links-row--footer" />

        <Link
          href="/forum?ql7SupportOpen=1&inbox=messages&dmUser=ql7-support"
          className="ql7-icon-link ql7-footer-support-link"
          data-ql7-support-entry="1"
          aria-label="Support / Поддержка"
          style={{ '--size': '130px' }}
        >
          <Image
            className="ql7-click-icon"
            src="/click/support.png"
            alt="Support"
            width={130}
            height={130}
            draggable={false}
          />
        </Link>
      </div>
    </div>
  )
}

export default function AcademyPage() {
  return <AcademyContent />
}
