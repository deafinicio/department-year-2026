// node tools/social-preview.mjs > /tmp/cluster-social.svg
// Render the vector at 1200×630 and export JPEG for link cards.
import {mapAreas,oblasts,routePath} from '../src/geography.js';
import {regions} from '../src/content.js';

const colors=regions.map(r=>r.color);
const routes=[0,1].map(i=>`<path d="${routePath(i,i+1)}" fill="none" stroke="${colors[i+1]}" stroke-width=".14" stroke-dasharray=".23 .20" opacity=".85"/>`).join('');
const shape=mapAreas.map(a=>`<path d="${a.path}" fill="${a.index<0?'url(#land)':colors[a.index]}" fill-opacity="${a.index<0?1:.42}" fill-rule="evenodd" stroke="${a.index<0?'#648eac':colors[a.index]}" stroke-width="${a.index<0?.043:.078}"/>`).join('');
const pins=oblasts.map(({center:[x,y]},i)=>`<circle cx="${x}" cy="${y}" r=".49" fill="${colors[i]}" opacity=".18"/><circle cx="${x}" cy="${y}" r=".27" fill="#0a1421" stroke="${colors[i]}" stroke-width=".083"/><circle cx="${x}" cy="${y}" r=".104" fill="${colors[i]}"/>`).join('');
console.log(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>
  <radialGradient id="bg" cx=".80" cy=".39" r=".82"><stop stop-color="#193a56"/><stop offset=".64" stop-color="#0c192d"/><stop offset="1" stop-color="#08101f"/></radialGradient>
  <linearGradient id="land" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#355b78"/><stop offset="1" stop-color="#182c45"/></linearGradient>
  <linearGradient id="rule"><stop stop-color="#8cdef3"/><stop offset=".55" stop-color="#eac183"/><stop offset="1" stop-color="#b4e6b8"/></linearGradient>
  <pattern id="grid" width="29" height="29" patternUnits="userSpaceOnUse"><path d="M0 29V0H29" fill="none" stroke="#9bc6ec" stroke-width="1" opacity=".09"/></pattern>
</defs>
<path d="M0 0H1200V630H0Z" fill="url(#bg)"/>
<path d="M0 0H1200V630H0Z" fill="url(#grid)"/>
<rect x="27" y="27" width="1146" height="576" rx="20" fill="none" stroke="#88aeca" stroke-opacity=".31"/>
<g font-family="DejaVu Sans,sans-serif">
<g transform="translate(66 61)">
<rect width="40" height="40" rx="10" fill="#163149" stroke="#6ca9c7" stroke-opacity=".6"/>
<path d="m9 18 11-6 11 6-11 6-11-6zm0 6 11 6 11-6" fill="none" stroke="#a5dcf3" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<text x="120" y="77" fill="#b9d9ee" font-size="13" font-weight="bold" letter-spacing="1.5">УКРАЇНСЬКИЙ ЧЕРВОНИЙ ХРЕСТ</text>
<text x="120" y="97" fill="#91aec5" font-size="12" letter-spacing="1.5">ЗВІТНІСТЬ КООРДИНАТОРІВ</text>
<rect x="1038" y="61" width="96" height="38" rx="10" fill="#17314a" stroke="#8cdef3" stroke-opacity=".4"/>
<text x="1086" y="86" text-anchor="middle" fill="#a9e7f7" font-size="17" font-weight="bold" letter-spacing="2">2026</text>

<g transform="translate(846 278) scale(17.1)">
<g transform="translate(0 .25)" opacity=".48" fill="#040b14" stroke="#11243a" stroke-width=".11">${mapAreas.map(a=>`<path d="${a.path}" fill-rule="evenodd"/>`).join('')}</g>
${shape}${routes}${pins}
</g>
<text x="66" y="208" fill="#9fd9ef" font-size="15" font-weight="bold" letter-spacing="2.1">ПІДСУМКИ ДІЯЛЬНОСТІ · 2026</text>
<text x="63" y="284" fill="#f3f8fd" font-size="52" font-weight="bold" letter-spacing="-1.6">Північно-східний</text>
<text x="63" y="354" fill="#f3f8fd" font-size="68" font-weight="bold" letter-spacing="-2.3">кластер</text>
<path d="M66 388H206" stroke="url(#rule)" stroke-width="3" stroke-linecap="round"/>
<text x="66" y="428" fill="#bfd0e0" font-size="20">Інформування про мінну небезпеку</text>
<text x="66" y="458" fill="#91adc4" font-size="16">Результати трьох областей</text>
<path d="M66 515H1134" stroke="#5f829c" stroke-opacity=".49"/>
${regions.map((r,i)=>`<circle cx="${74+i*249}" cy="551" r="5" fill="${r.color}"/><text x="${89+i*249}" y="558" fill="#dbe8f3" font-size="17" font-weight="bold">${r.short}</text>`).join('')}
<text x="1134" y="557" text-anchor="end" fill="#92adc4" font-size="11">Межі: geoBoundaries · © OpenStreetMap</text>
</g></svg>`);
