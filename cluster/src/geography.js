import boundaries from './ukraine-boundaries.json' with {type:'json'};

export const project=(lon,lat)=>[(lon-31.3)*1.72,(49.15-lat)*2.65];
export const oblasts=[
  {name:'Chernihiv Oblast',center:project(31.289,51.498)},
  {name:'Sumy Oblast',center:project(34.798,50.907)},
  {name:'Kharkiv Oblast',center:project(36.233,49.993)},
];
export const mapBounds=[[-16.05,15.66],[-.36,1.38],[-8.82,13.42]];
export const isOblast=i=>i>=0&&i<oblasts.length;
export const mapAreas=boundaries.map(([name,polygons])=>({
  name,polygons,index:oblasts.findIndex(o=>o.name===name),
  path:polygons.flatMap(p=>p.map(r=>'M'+r.map(([x,z])=>x+','+z).join('L')+'Z')).join(' '),
}));
export const mapOverviewBox='-16.5 -9.25 32.65 23.15';
export const clusterBounds=[[-2.7,12.1],[-.36,1.38],[-8.82,1.4]];
export const mapBox=i=>{
  if(i===3)return '-3 -9.15 15.4 11';
  if(!isOblast(i))return mapOverviewBox;
  const [x,z]=oblasts[i].center;
  return `${x-5.2} ${z-3.05} 10.4 7.5`;
};
export function routePath(a,b){
  const [x,z]=oblasts[a].center,[u,v]=oblasts[b].center;
  return `M${x},${z}Q${(x+u)/2},${(z+v)/2-1.1} ${u},${v}`;
}
