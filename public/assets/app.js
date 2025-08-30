export const API = {
  async get(path, params={}, token=null){
    const url = new URL(`/api/${path}`, location.origin);
    Object.entries(params).forEach(([k,v])=> v!=null && url.searchParams.set(k, v));
    const r = await fetch(url, { headers: token? {Authorization:`Bearer ${token}`} : {} });
    if(!r.ok) throw new Error(await r.text()); return r.json();
  },
  async post(path, body={}, token=null){
    const r = await fetch(`/api/${path}`, {
      method:'POST',
      headers:{'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{})},
      body: JSON.stringify(body)
    });
    if(!r.ok) throw new Error(await r.text()); return r.json();
  }
};
export function toast(msg, type='ok'){ const el=document.createElement('div'); el.className=`fixed bottom-4 right-4 px-4 py-2 rounded-xl text-white ${type==='ok'?'bg-emerald-600':'bg-rose-600'} shadow-lg`; el.textContent=msg; document.body.appendChild(el); setTimeout(()=>el.remove(),2500); }
export const money = n => (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export const debounce=(fn,ms=250)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }};
