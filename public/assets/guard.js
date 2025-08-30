// Exige login e prepara sessão + botão sair.
import { requireAuth, getUser, supabase } from './auth.js';

await requireAuth();
const { data: { session } } = await supabase.auth.getSession();
window.SESSION = session;

window.addEventListener('DOMContentLoaded', async () => {
  const user = await getUser();
  const span = document.querySelector('#user-email');
  if (span && user) span.textContent = user.email;
});

async function doLogout(e) {
  e?.preventDefault?.();
  try { await supabase.auth.signOut(); } catch {}
  try { sessionStorage.clear(); } catch {}
  location.replace('/login.html');
}

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('#btn-logout,[data-logout]');
  if (el) doLogout(ev);
});
