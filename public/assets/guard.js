import { supabase, requireAuth, getUser } from "./auth.js";

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const session = await requireAuth();
    window.SESSION = session;
  } catch { return; }

  const user = await getUser();
  const span = document.querySelector('#user-email');
  if(span) span.textContent = user?.email || '';

  const btn = document.querySelector('#btn-logout');
  if(btn){
    btn.addEventListener('click', async ()=>{
      await supabase.auth.signOut();
      location.href = '/login.html';
    });
  }
});
