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
  window.GiaDialog={
    alert:(message,title='Gia Phả Họ Nguyễn')=>open({kind:'alert',message,title,okText:'Đồng ý'}),
    confirm:(message,title='Gia Phả Họ Nguyễn')=>open({kind:'confirm',message,title,okText:'Đồng ý'}),
    prompt:(message,value='',title='Gia Phả Họ Nguyễn',inputLabel='Nhập thông tin')=>open({kind:'prompt',message,value,title,input:true,inputLabel,okText:'Đồng ý'})
  };
})();