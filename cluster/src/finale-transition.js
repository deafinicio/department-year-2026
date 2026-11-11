// Project a constant-size viewport onto the old panel, clipping any excess.
// The map renderer only lays out once; all intermediate frames are composited.
export function finaleProjection(from,to){
  if(!from||from.width<1||from.height<1||to.width<1||to.height<1)return null;
  const left=Math.max(0,from.left-to.left),top=Math.max(0,from.top-to.top);
  const right=Math.min(to.width,from.right-to.left),bottom=Math.min(to.height,from.bottom-to.top);
  if(right<=left||bottom<=top)return null;
  const scale=Math.max(from.width/to.width,from.height/to.height);
  const x=from.left+from.width/2-(to.left+to.width/2);
  const y=from.top+from.height/2-(to.top+to.height/2);
  return {
    clipPath:`inset(${top}px ${to.width-right}px ${to.height-bottom}px ${left}px)`,
    transform:`translate3d(${x}px,${y}px,0) scale(${scale})`,
  };
}
