function terms(s=''){return new Set(String(s).toLocaleLowerCase().normalize('NFKC').split(/[^\p{L}\p{N}]+/u).filter(Boolean))}
export function scoreQl7Sparse(query='',doc=''){const q=terms(query),d=terms(doc);if(!q.size)return 0;let hit=0;for(const t of q)if(d.has(t))hit++;return hit/q.size}
