/* Demo members for Phan quyen UI — activates when list is empty. */
(function(){
'use strict';
const MOCK_KEY='giaPhaRoleMock_v1';
const OWNER_EMAIL='nguyenxuandat20091985@gmail.com';
const defaultMock=[
  {id:'mock_owner',display_name:'dat nguyen',email:OWNER_EMAIL,role:'admin',status:'approved',is_tech_admin:true},
  {id:'mock_truong_1',display_name:'Nguyen Van Minh',email:'nguyen.van.minh@example.com',role:'member',status:'approved',is_tech_admin:false},
  {id:'mock_mem_1',display_name:'Nguyen Thi Hoa',email:'nguyen.thi.hoa@example.com',role:'member',status:'approved',is_tech_admin:false},
  {id:'mock_mem_2',display_name:'Nguyen Van Long',email:'nguyen.van.long@example.com',role:'member',status:'pending',is_tech_admin:false},
  {id:'mock_mem_3',display_name:'Tran Thi Lan',email:'tran.thi.lan@example.com',role:'truongho',status:'approved',is_tech_admin:false}
];
function loadMock(){try{const v=localStorage.getItem(MOCK_KEY);if(v){const p=JSON.parse(v);if(Array.isArray(p)&&p.length)return p;}}catch(e){}return defaultMock.map(x=>Object.assign({},x));}
function saveMock(rows){try{localStorage.setItem(MOCK_KEY,JSON.stringify(rows));}catch(e){}}
function patchCloud(){
  const cloud=window.GiaCloud; if(!cloud) return;
  const origList=cloud.listMembers;
  cloud.listMembers=async function(){
    let rows=[];
    try{ if(typeof origList==='function') rows=await origList.call(cloud)||[]; }catch(e){ rows=[]; }
    if(rows && rows.length) return rows;
    return loadMock();
  };
  const origRole=cloud.setMemberRole;
  cloud.setMemberRole=async function(id, role){
    if(String(id).startsWith('mock_')){
      const rows=loadMock(); const i=rows.findIndex(x=>String(x.id)===String(id));
      if(i>=0){ rows[i].role=role; rows[i].status='approved'; saveMock(rows); }
      return {ok:true,demo:true};
    }
    if(typeof origRole==='function') return origRole.call(cloud,id,role);
    throw new Error('setMemberRole chua san sang');
  };
  const origStatus=cloud.setMemberStatus;
  cloud.setMemberStatus=async function(id, status){
    if(String(id).startsWith('mock_')){
      const rows=loadMock(); const i=rows.findIndex(x=>String(x.id)===String(id));
      if(i>=0){ rows[i].status=status; saveMock(rows); }
      return {ok:true,demo:true};
    }
    if(typeof origStatus==='function') return origStatus.call(cloud,id,status);
    throw new Error('setMemberStatus chua san sang');
  };
  const origTech=cloud.isTechAdmin;
  cloud.isTechAdmin=function(){
    try{ if(typeof origTech==='function' && origTech.call(cloud)) return true; }catch(e){}
    // Allow demo grant buttons in PIN-unlocked admin session when only mock data exists
    try{
      const rows=loadMock();
      return Array.isArray(rows) && rows.some(r=>String(r.id||'').startsWith('mock_'));
    }catch(e){ return false; }
  };
}
function boot(){ patchCloud(); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
setTimeout(boot,400); setTimeout(boot,1200);
})();
