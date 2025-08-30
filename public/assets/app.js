export function toast(msg, type='ok'){
  const el = document.createElement('div');
  el.className = `fixed bottom-4 right-4 z-[100] rounded-lg px-4 py-2 text-white shadow-lg ${type==='err'?'bg-rose-600':'bg-emerald-600'}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(()=> el.remove(), 4200);
}

export function money(v){
  if(v==null||isNaN(v)) v=0;
  return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
}

export function debounce(fn, ms=300){
  let t;
  return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }
}

// Mini API-wrapper para nossas funções serverless (sempre envia token quando houver)
export const API = {
  async get(path, qs={}, token){
    const u = new URL(`/api/${path}`, location.origin);
    Object.entries(qs||{}).forEach(([k,v])=> (v!=null&&v!=='') && u.searchParams.set(k, v));
    const r = await fetch(u, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if(!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async post(path, body, token){
    const r = await fetch(`/api/${path}`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}) },
      body: JSON.stringify(body||{})
    });
    if(!r.ok){
      const raw = await r.text();
      throw new Error(raw||'Erro de servidor');
    }
    return r.json();
  },
};
