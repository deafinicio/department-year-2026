import {ages,locations,male,female} from './kharkiv-stats.js';

const fmt=n=>n.toLocaleString('uk-UA');
function BreakdownTable({label,items}){
  return <table aria-label={label}>
    <thead><tr><th scope="col">{label}</th><th scope="col">Чол.</th><th scope="col">Жін.</th><th scope="col">Усього</th></tr></thead>
    <tbody>{items.map(r=><tr key={r.label}><th scope="row">{r.label}</th><td>{fmt(r.male)}</td><td>{fmt(r.female)}</td><td>{fmt(r.total)}</td></tr>)}</tbody>
  </table>;
}
export default function KharkivBreakdown(){
  return <details className="stats-breakdown">
    <summary>Деталізація за віком, статтю та локацією</summary>
    <p>За статтю: {fmt(male)} чол. та {fmt(female)} жін.</p>
    <div className="breakdown-tables">
      <BreakdownTable label="Вік, роки" items={ages}/>
      <BreakdownTable label="Локація" items={locations}/>
    </div>
  </details>;
}
