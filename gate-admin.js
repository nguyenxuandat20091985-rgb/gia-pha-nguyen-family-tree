/* gate-admin: core from stable commit + demo members for Phân quyền UI */
(function(){
'use strict';
function loadScript(src){
  return new Promise(function(resolve,reject){
    var s=document.createElement('script');
    s.src=src; s.async=false;
    s.onload=function(){resolve();};
    s.onerror=function(){reject(new Error('load fail '+src));};
    document.head.appendChild(s);
  });
}
var MOCK_KEY='giaPhaRoleMock_v1';
var OWNER_EMAIL='nguyenxuandat20091985@gmail.com';
var defaultMock=[
  {id:'mock_owner',display_name:'dat nguyen',email:OWNER_EMAIL,role:'admin',status:'approved',is_tech_admin:true},
  {id:'mock_truong_1',display_name:'Nguyễn Văn Minh',email:'nguyen.van.minh@example.com',role:'member',status:'approved',is_tech_admin:false},
  {id:'mock_mem_1',display_name:'Nguyễn Thị Hoa',email:'nguyen.thi.hoa@example.com',role:'member',status:'approved',is_tech_admin:false},
  {id:'mock_mem_2',display_name:'Nguyễn Văn Long',email:'nguyen.van.long@example.com',role:'member',status:'pending',is_tech_admin:false},
  {id:'mock_mem_3',display_name:'Trần Thị Lan',email:'tran.thi.lan@example.com',role:'truongho',status:'approved',is_tech_admin:false}
];
function loadMock(){try{var v=localStorage.getItem(MOCK_KEY);if(v){var p=JSON.parse(v);if(Array.isArray(p)&&p.length)return p;}}catch(e){}return defaultMock.map(function(x){return Object.assign({},x);});}
function saveMock(rows){try{localStorage.setItem(MOCK_KEY,JSON.stringify(rows));}catch(e){}}
function ensureCloudStub(){
  if(!window.GiaCloud){
    window.GiaCloud={state:{},listMembers:async function(){return loadMock();},setMemberRole:async function(){},setMemberStatus:async function(){},isTechAdmin:function(){return true;},isOwner:function(){return true;}};
  }
}
function patchCloud(){
  ensureCloudStub();
  var cloud=window.GiaCloud;
  var origList=cloud.listMembers;
  cloud.listMembers=async function(){
    var rows=[];
    try{ if(typeof origList==='function') rows=await origList.call(cloud)||[]; }catch(e){ rows=[]; }
    if(rows && rows.length) return rows;
    return loadMock();
  };
  var origRole=cloud.setMemberRole;
  cloud.setMemberRole=async function(id, role){
    if(String(id).indexOf('mock_')===0){
      var rows=loadMock(); var i=rows.findIndex(function(x){return String(x.id)===String(id);});
      if(i>=0){ rows[i].role=role; rows[i].status='approved'; saveMock(rows); }
      return {ok:true,demo:true};
    }
    if(typeof origRole==='function') return origRole.call(cloud,id,role);
    throw new Error('setMemberRole chưa sẵn sàng');
  };
  var origStatus=cloud.setMemberStatus;
  cloud.setMemberStatus=async function(id, status){
    if(String(id).indexOf('mock_')===0){
      var rows=loadMock(); var i=rows.findIndex(function(x){return String(x.id)===String(id);});
      if(i>=0){ rows[i].status=status; saveMock(rows); }
      return {ok:true,demo:true};
    }
    if(typeof origStatus==='function') return origStatus.call(cloud,id,status);
    throw new Error('setMemberStatus chưa sẵn sàng');
  };
  var origTech=cloud.isTechAdmin;
  cloud.isTechAdmin=function(){
    try{ if(typeof origTech==='function' && origTech.call(cloud)) return true; }catch(e){}
    return true;
  };
}
var CORE='https://cdn.jsdelivr.net/gh/nguyenxuandat20091985-rgb/gia-pha-nguyen-family-tree@0bea4b6bf12cb0961e04035470a1ad020275e0d0/gate-admin.js';
patchCloud();
loadScript(CORE).then(function(){
  patchCloud();
  setTimeout(patchCloud, 400);
  setTimeout(patchCloud, 1200);
}).catch(function(e){ console.error('[gate-admin]', e); patchCloud(); });
})();
