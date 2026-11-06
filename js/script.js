// Demostración local: no envía datos a servidores ni guarda información sensible.
const lista = [];
const contenedor = document.getElementById('lista');
function pintarLista() {
  if (!contenedor) return;
  contenedor.replaceChildren();
  if (!lista.length) {
    const li = document.createElement('li'); li.textContent = 'Aún no has agregado productos.'; contenedor.append(li); return;
  }
  for (const nombre of lista) { const li = document.createElement('li'); li.textContent = nombre; contenedor.append(li); }
}
document.querySelectorAll('[data-product]').forEach(boton => {
  boton.addEventListener('click', () => { lista.push(boton.dataset.product); pintarLista(); });
});
document.getElementById('limpiar')?.addEventListener('click', () => { lista.length = 0; pintarLista(); });
