/**
 * Microsoft Clarity — grabaciones de sesión y mapas de calor.
 *
 * Va como <script> en línea dentro del <head>, igual que el contenedor de GTM
 * que está justo arriba, y no con `next/script`: el repo no usa next/script en
 * ningún archivo y AGENTS.md avisa de que esta versión de Next cambió esa API.
 *
 * 🔴 El id del proyecto está escrito aquí a propósito, no en una variable de
 * entorno. En Tours Huasteca la variable de Railway se pegó con una comilla de
 * más (`y4zee16v6k"`): el script quedaba con un error de sintaxis, Clarity no
 * arrancaba en ningún navegador y no se grabó ni una sesión durante dos días
 * sin que nada avisara (el sitio iba normal y GA4 seguía midiendo). El id es
 * público de todas formas: viaja en el HTML de cada página, igual que el
 * GTM-N98DFD9V de app/layout.tsx.
 */
const CLARITY_ID = 'yu775klmdt';

/**
 * Quién NO se graba. Se decide en el navegador, antes de cargar nada.
 *
 * 🔴 En Tours, las 27 grabaciones de la primera semana eran del propio equipo:
 * desarrollo en localhost y horas de panel /admin. Un embudo que mide al
 * equipo en vez de a los huéspedes es justo lo contrario de para qué sirve.
 *
 *  - localhost / 127.0.0.1 / *.local → nunca. Para probar en local a
 *    propósito: `localStorage.pe_clarity_debug = '1'` y recargar.
 *  - /admin → nunca, y además marca el navegador como interno: quien abre el
 *    panel es del hotel, y sus paseos por el sitio público (revisar precios,
 *    copiar ligas para WhatsApp) tampoco son los de un huésped. Para volver a
 *    medirse desde ese navegador: borrar `pe_interno` o entrar en incógnito.
 */
const SNIPPET = `
(function(){
  try {
    var depurar = false;
    try { depurar = localStorage.getItem('pe_clarity_debug') === '1'; } catch (e) {}

    var h = location.hostname;
    if (!depurar && (h === 'localhost' || h === '127.0.0.1' || h.slice(-6) === '.local')) return;

    if (location.pathname.indexOf('/admin') === 0) {
      try { localStorage.setItem('pe_interno', '1'); } catch (e) {}
      return;
    }
    try { if (localStorage.getItem('pe_interno') === '1') return; } catch (e) {}

    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window,document,"clarity","script","${CLARITY_ID}");
  } catch (e) {
    // Medir nunca puede tumbar la página.
  }
})();
`;

export default function ClarityScript() {
  return <script dangerouslySetInnerHTML={{ __html: SNIPPET }} />;
}
