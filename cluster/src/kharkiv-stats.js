// Наданий знімок таблиці «Статистика бенефіціарів з розбивкою за віком», січень–жовтень 2026.
// У кожній віковій групі порядок: чоловіча, жіноча стать.
export const ageBands=['3–5','6–10','11–17','18–35','36–59','60+'];
export const kharkivLocations=[
  ['Харків',[[17,22],[123,138],[242,306],[300,560],[384,635],[108,173]]],
  ['Берестин',[[0,0],[65,77],[513,496],[88,155],[185,330],[12,93]]],
  ['Лозова',[[0,0],[22,43],[229,444],[205,441],[98,384],[16,81]]],
  ['Ізюм',[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]],
];
const sum=xs=>xs.reduce((a,b)=>a+b,0);
export const locations=kharkivLocations.map(([label,groups])=>({label,male:sum(groups.map(([m])=>m)),female:sum(groups.map(([,f])=>f)),total:sum(groups.flat())}));
export const ages=ageBands.map((label,i)=>{
  const male=sum(kharkivLocations.map(([,g])=>g[i][0])),female=sum(kharkivLocations.map(([,g])=>g[i][1]));
  return {label,male,female,total:male+female};
});
export const male=sum(locations.map(r=>r.male));
export const female=sum(locations.map(r=>r.female));
export const total=male+female;
export const audience=[{label:'Діти',count:sum(ages.slice(0,3).map(a=>a.total))},{label:'Дорослі',count:sum(ages.slice(3).map(a=>a.total))}]
  .map(a=>({...a,percent:Number((a.count/total*100).toFixed(1))}));
