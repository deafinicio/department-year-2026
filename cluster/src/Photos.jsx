import {useRef} from 'react';
import {ArrowLeft,ArrowRight,Maximize2,X} from 'lucide-react';

export function PhotoGallery({photos,selected,onSelect,onOpen}){
  const item=photos[selected];
  return <section className="photo-gallery" aria-label="Фото та ілюстрації до слайда">
    <button className="photo-preview" onClick={()=>onOpen(selected)} aria-label={'Збільшити: '+item.title}>
      <img src={item.url} alt={item.title} decoding="async"/>
      <span><Maximize2 size={14}/></span>
    </button>
    <div className="photo-caption"><div><strong>{item.title}</strong><small>{item.caption}</small></div>
      {photos.length>1&&<nav aria-label="Кадри слайда" className="photo-controls">
        <button aria-label="Попереднє зображення" onClick={()=>onSelect((selected+photos.length-1)%photos.length)}><ArrowLeft size={14}/></button>
        <span>{selected+1}/{photos.length}</span>
        <button aria-label="Наступне зображення" onClick={()=>onSelect((selected+1)%photos.length)}><ArrowRight size={14}/></button>
      </nav>}
    </div>
  </section>;
}

export function PhotoDialog({dialogRef,photos,selected,onStep,onDismiss}){
  const item=photos[selected];
  const pointerStarted=useRef(false);
  return <dialog className="photo-dialog" ref={dialogRef} aria-label="Перегляд зображення"
    onCancel={e=>{e.preventDefault();onDismiss();}}
    onPointerDown={e=>{pointerStarted.current=e.target===e.currentTarget;}}
    onClick={e=>{if(e.target===e.currentTarget&&pointerStarted.current)onDismiss();}}>
    {item&&<div className="photo-dialog-content">
      <div className="photo-dialog-bar"><div><strong>{item.title}</strong><small>{item.caption}</small></div>
        <button aria-label="Закрити зображення" onClick={onDismiss} autoFocus><X size={22}/></button>
      </div>
      <img src={item.url} alt={item.title} decoding="async"/>
      <div className="photo-dialog-nav">
        <button aria-label={selected?'Попередній кадр':'Повернутися до слайда'} onClick={()=>onStep(-1)}><ArrowLeft size={19}/></button>
        <span aria-live="polite">{selected+1} / {photos.length}</span>
        <button aria-label={selected+1<photos.length?'Наступний кадр':'Наступний слайд'} onClick={()=>onStep(1)}><ArrowRight size={19}/></button>
      </div>
    </div>}
  </dialog>;
}
