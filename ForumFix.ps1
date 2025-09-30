diff --git a/app/forum/Forum.jsx b/app/forum/Forum.jsx
--- a/app/forum/Forum.jsx
+++ b/app/forum/Forum.jsx
@@
-const safeHtml = s => String(s || '')
-  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
-  .replace(/(https?:\/\/[^\s<]+)(?=\s|$)/g,'<a target="_blank" rel="noreferrer" href="$1">$1</a>')
-  .replace(/\n/g,'<br/>')
+const safeHtml = s => String(s || '')
+  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
+  .replace(/(https?:\/\/[^\s<]+)(?=\s|$)/g,'<a target="_blank" rel="noreferrer noopener" href="$1">$1</a>')
+  .replace(/\n/g,'<br/>')
@@
-function setAdminToken(token){
-  if(typeof window!=='undefined') localStorage.setItem('forum_admin_token', token);
-}
-function getAdminToken(){
-  if(typeof window==='undefined') return '';
-  return localStorage.getItem('forum_admin_token') || '';
-}
+function setAdminToken(token){
+  if(typeof window!=='undefined'){
+    try{ window.__FORUM_ADMIN_TOKEN__ = String(token||''); localStorage.removeItem('forum_admin_token'); }catch{ window.__FORUM_ADMIN_TOKEN__ = String(token||''); }
+  }
+}
+function getAdminToken(){
+  if(typeof window==='undefined') return '';
+  try{ return window.__FORUM_ADMIN_TOKEN__ || localStorage.getItem('forum_admin_token') || ''; }catch{ return window.__FORUM_ADMIN_TOKEN__ || ''; }
+}
@@
-      if (data?.ok && typeof setAdminToken === 'function') setAdminToken(pass);
+      if (data?.ok && typeof setAdminToken === 'function') setAdminToken(data?.token || pass);
       return data;
@@
 export default function Forum(){
   const { t } = useI18n()
   const toast = useToast()
+  const rl = useMemo(rateLimiter, [])
@@
-//  const refresh = async () => {
-//    const r = await api.snapshot()
-//    if (r?.ok && r.full) {
-//      persist(dedupeAll({
-//        topics: r.topics || [],
-//        posts:  r.posts  || [],
-//        bans:   r.bans   || [],
-//        admins: r.admins || [],
-//        rev:    r.rev    || null,
-//      }))
-//    }
-//  }
+const refresh = useCallback(async ()=>{
+  try{
+    const r = await api.snapshot();
+    if(r?.ok){
+      // если в коде есть __silentMerge – используем его для «тихого» докатывания
+      persist(prev => (typeof __silentMerge === 'function') ? __silentMerge(prev, r) : ({ ...prev, ...r }));
+    }
+  }catch{}
+}, [persist])
@@
-const createTopic = async (title, description, first) => {
+const createTopic = async (title, description, first) => {
+  if (!rl.allowAction()) { toast.warn(t('forum_too_fast')||'Слишком часто'); return; }
@@
-    const realTopicId = createTopicResp?.applied?.find(x=>x.op==='create_topic')?.topic?.id
-    if (!realTopicId) { await refresh(); return }
+    const realTopicId = createTopicResp?.applied?.find(x=>x.op==='create_topic')?.topic?.id
+    if (!realTopicId) { if (typeof refresh==='function') await refresh(); return }
@@
-const createPost = async () => {
+const createPost = async () => {
+  if (!rl.allowAction()) { toast.warn(t('forum_too_fast')||'Слишком часто'); return; }
@@
-    await refresh()
+    if (typeof refresh==='function') await refresh()
@@
-const reactMut = useCallback(async (post, kind) => {
+const reactMut = useCallback(async (post, kind) => {
+  if (!rl.allowAction()) { toast?.warn && toast.warn(t('forum_too_fast')||'Слишком часто'); return; }
   // kind: 'like' | 'dislike'
@@
-    const r = await api.mutate({ ops }, uid);
-    // если хочешь мгновенно дотянуть серверные значения — дерни твой рефреш/снапшот:
-    if (r && r.applied && typeof refresh === 'function') await refresh();
+    const r = await api.mutate({ ops }, uid);
+    if (r && r.applied && typeof refresh === 'function') await refresh();
   } catch (e) {
     console.warn('react mutate failed', e);
   }
-}, [auth, persist]);
+}, [auth, persist]);
