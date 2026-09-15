import {QL7_SUPPORT_PUBLIC_FIGURE_PRIVATE_FACT_TYPES} from './factSchema.js'
export const QL7_SUPPORT_PUBLIC_FIGURE_PRIVACY_BOUNDARY_VERSION='5.3.0'
export function assertQl7PublicFigureFactPublic(factType=''){const id=String(factType||'').trim();if(QL7_SUPPORT_PUBLIC_FIGURE_PRIVATE_FACT_TYPES.has(id)){const error=new Error(`public_figure_private_fact_forbidden:${id}`);error.code='public_figure_private_fact_forbidden';throw error}return true}
