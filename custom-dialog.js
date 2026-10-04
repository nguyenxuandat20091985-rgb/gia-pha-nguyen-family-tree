/* custom-dialog v1 – hộp thoại giao diện riêng cho Gia Phả Họ Nguyễn */
(function(){
  'use strict';
  let active=null;
  const esc=s=>{const d=document.createElement('div');d.textContent=s==null?'':String(s);return d.innerHTML;};
  function close(result){
    if(!active)return;
    const a=active;active=null;
    a.overlay.classList.add('hidden');
    setTimeout(()=>a.overlay.remove(),180);
    a.resolve(result);
  }
  function open(opts){
    return new Promise(resolve=>{
      const overlay=document.createElement('div');
      overlay.className='custom-dialog-overlay';
      overlay.innerHTML=
        '<div class="custom-dialog" role="dialog" aria-modal="true" aria-labelledby="customDialogTitle">'+
          '<div class="custom-dialog-brand">🌿</div>'+
          '<h2 id="customDialogTitle" class="custom-dialog-title">'+esc(opts.title||'Gia Phả Họ Nguyễn')+'</h2>'+
          (opts.message?'<p class="custom-dialog-message">'+esc(opts.message)+'</p>':'')+
          (opts.input?'<div class="custom-dialog-field"><label>'+esc(opts.inputLabel||'Nội dung')+'</label><input id="customDialogInput" type="'+(opts.inputType||'text')+'" value="'+esc(opts.value||'')+'" placeholder="'+esc(opts.placeholder||'')+'" autocomplete="off"/></div>':'')+
          '<div class="custom-dialog-actions">'+
            '<button type="button" class="btn btn-secondary custom-dialog-cancel">Huỷ</button>'+
            '<button type="button" class="btn btn-primary custom-dialog-ok">'+esc(opts.okText||'Đồng ý')+'</button>'+
          '</div>'+
        '</div>';
      document.body.appendChild(overlay);
      const input=overlay.querySelector('#customDialogInput');
      const cancel=overlay.querySelector('.custom-dialog-cancel');
      const ok=overlay.querySelector('.custom-dialog-ok');
      active={overlay,resolve};
      function done(value){close(value);}
      cancel.addEventListener('click',()=>done(opts.kind==='alert'?true:false));
      ok.addEventListener('click',()=>done(opts.input?(input?.value??''):true));
      overlay.addEventListener('click',e=>{if(e.target===overlay && opts.allowBackdrop!==false)done(opts.kind==='alert'?true:false);});
      overlay.addEventListener('keydown',e=>{
        if(e.key==='Escape'){e.preventDefault();done(opts.kind==='alert'?true:false);}
        if(e.key==='Enter' && opts.input && e.target===input){e.preventDefault();done(input.value);}
      });
      requestAnimationFrame(()=>{
        if(input){input.focus();input.select();}
        else ok.focus();
      });
    });
  }
  function form(fields,title='Gia Phả Họ Nguyễn',message=''){
    return new Promise(resolve=>{
      const existing=document.getElementById('giaDialogRoot'); if(existing) existing.remove();
      const overlay=document.createElement('div'); overlay.id='giaDialogRoot'; overlay.className='custom-dialog-overlay';
      const controls=fields.map((f,i)=>{
        const type=f.type||'text', id='customDialogField_'+i;
        if(type==='select') return '<div class="custom-dialog-field"><label for="'+id+'">'+esc(f.label)+'</label><select id="'+id+'">'+(f.options||[]).map(o=>'<option value="'+esc(o.value)+'"'+(String(o.value)===String(f.value??'')?' selected':'')+'>'+esc(o.label)+'</option>').join('')+'</select></div>';
        return '<div class="custom-dialog-field"><label for="'+id+'">'+esc(f.label)+'</label>'+(type==='textarea'?'<textarea id="'+id+'" rows="'+(f.rows||4)+'" placeholder="'+esc(f.placeholder||'')+'">'+esc(f.value||'')+'</textarea>':'<input id="'+id+'" type="'+esc(type)+'" value="'+esc(f.value||'')+'" placeholder="'+esc(f.placeholder||'')+'" autocomplete="off"/>')+'</div>';
      }).join('');
      overlay.innerHTML='<div class="custom-dialog" role="dialog" aria-modal="true"><div class="custom-dialog-brand">🌿</div><h2 class="custom-dialog-title">'+esc(title)+'</h2>'+(message?'<p class="custom-dialog-message">'+esc(message)+'</p>':'')+'<form class="custom-dialog-form"><div class="custom-dialog-fields">'+controls+'</div><div class="custom-dialog-actions"><button type="button" class="btn btn-secondary custom-dialog-cancel">Huỷ</button><button type="submit" class="btn btn-primary custom-dialog-ok">Gửi</button></div></form></div>';
      document.body.appendChild(overlay);
      const formEl=overlay.querySelector('.custom-dialog-form'), cancel=overlay.querySelector('.custom-dialog-cancel');
      let settled=false;
      const finish=value=>{if(settled)return;settled=true;document.body.classList.remove('custom-dialog-open');overlay.classList.add('hidden');setTimeout(()=>overlay.remove(),180);resolve(value);};
      active={overlay,resolve:finish}; document.body.classList.add('custom-dialog-open');
      cancel.addEventListener('click',()=>finish(null));
      formEl.addEventListener('submit',e=>{e.preventDefault();e.stopPropagation();const out={};fields.forEach((f,i)=>{out[f.key]=overlay.querySelector('#customDialogField_'+i)?.value??'';});finish(out);});
      overlay.addEventListener('click',e=>{if(e.target===overlay)finish(null);});
      overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();finish(null);}});
      setTimeout(()=>overlay.querySelector('input,textarea,select')?.focus(),30);
    });
  }

  window.GiaDialog={
    alert:(message,title='Gia Phả Họ Nguyễn')=>open({kind:'alert',message,title,okText:'Đồng ý'}),
    confirm:(message,title='Gia Phả Họ Nguyễn')=>open({kind:'confirm',message,title,okText:'Đồng ý'}),
    prompt:(message,value='',title='Gia Phả Họ Nguyễn',inputLabel='Nhập thông tin')=>open({kind:'prompt',message,value,title,input:true,inputLabel,okText:'Đồng ý'}),
    form
  };
})();