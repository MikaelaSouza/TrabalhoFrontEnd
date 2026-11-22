/* Dados mockados */
const UNITS=[
 {id:'rec',name:'Recife – Boa Viagem',addr:'Av. Boa Viagem, 1200',hrs:'11h às 23h'},
 {id:'ssa',name:'Salvador – Pelourinho',addr:'Rua Gregório de Matos, 45',hrs:'11h às 00h'},
 {id:'for',name:'Fortaleza – Meireles',addr:'Av. Beira Mar, 3000',hrs:'10h às 23h'}];
const ITEMS=[
 {id:1,n:'Baião de dois',d:'Arroz, feijão-de-corda, queijo coalho e manteiga de garrafa.',p:32,c:'Pratos',u:['rec','ssa','for']},
 {id:2,n:'Carne de sol com macaxeira',d:'Carne de sol na brasa com macaxeira cozida e vinagrete.',p:44,c:'Pratos',u:['rec','for']},
 {id:3,n:'Moqueca baiana',d:'Peixe, dendê, leite de coco e pirão.',p:58,c:'Pratos',u:['ssa']},
 {id:4,n:'Peixada cearense',d:'Peixe cozido com legumes, pirão e arroz.',p:62,c:'Pratos',u:['for']},
 {id:5,n:'Acarajé',d:'Bolinho de feijão-fradinho com vatapá e camarão.',p:18,c:'Lanches',u:['ssa']},
 {id:6,n:'Tapioca de queijo coalho',d:'Goma fresca recheada na hora.',p:14,c:'Lanches',u:['rec','ssa','for']},
 {id:7,n:'Cuscuz com charque',d:'Cuscuz de milho, charque desfiado e ovo.',p:28,c:'Lanches',u:['rec','for']},
 {id:8,n:'Suco de cajá',d:'Polpa natural, 400 ml.',p:9,c:'Bebidas',u:['rec','ssa','for']},
 {id:9,n:'Cajuína gelada',d:'Bebida de caju clarificada, 300 ml.',p:8,c:'Bebidas',u:['for','rec']},
 {id:10,n:'Bolo de rolo',d:'Massa fina enrolada com goiabada.',p:14,c:'Sobremesas',u:['rec']},
 {id:11,n:'Cocada de forno',d:'Coco fresco e leite condensado.',p:8,c:'Sobremesas',u:['ssa','for']}];
const COUPONS={RAIZES10:{t:'pct',v:.1,d:'10% de desconto no pedido'},NORDESTE5:{t:'fix',v:5,d:'R$ 5 off em pedidos a partir de R$ 40',min:40}};
const TIERS=[{n:'Semente',min:0},{n:'Mandacaru',min:200},{n:'Sol do Sertão',min:500}];
const STAGES=['Recebido','Em preparo','Pronto','Entregue'];
const POINT_COST=100,POINT_VALUE=10;

/* Estado (localStorage só para não perder a demo ao recarregar) */
let S={ch:'web',unit:null,user:null,users:[],cart:{},orders:[],pts:0,hist:[],coupon:null,usePts:false,delivery:'retirada',pay:'pix',fail:false,consent:null,cat:'Todos'};
try{Object.assign(S,JSON.parse(localStorage.getItem('rn')||'{}'))}catch(e){}
{const q=new URLSearchParams(location.search).get('canal');if(['web','app','totem'].includes(q))S.ch=q}
const CH={web:'Web',app:'App',totem:'Totem'};
const persist=()=>{try{localStorage.setItem('rn',JSON.stringify(S))}catch(e){}};
let _sv;const save=()=>{clearTimeout(_sv);_sv=setTimeout(persist,300)};/* grava em lote, sem travar a interface */
addEventListener('pagehide',persist);
const $=s=>document.querySelector(s);
const brl=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unit=()=>UNITS.find(u=>u.id===S.unit);
const ITEM=new Map(ITEMS.map(i=>[i.id,i]));/* índices criados uma vez: busca O(1) mesmo com cardápio grande */
const MENU=new Map(UNITS.map(u=>[u.id,ITEMS.filter(i=>i.u.includes(u.id))]));
const cartLines=()=>Object.entries(S.cart).map(([id,q])=>({...ITEM.get(+id),q})).filter(l=>l.n);
const qtyCtl=i=>S.cart[i.id]?`<div class="qty"><button data-act="dec" data-id="${i.id}" aria-label="Remover um ${esc(i.n)}">−</button><b>${S.cart[i.id]}</b><button data-act="inc" data-id="${i.id}" aria-label="Adicionar um ${esc(i.n)}">+</button></div>`:`<button class="btn sm" data-act="inc" data-id="${i.id}">Adicionar</button>`;
/* atualização pontual: mexe só no controle do prato e na bolinha do carrinho, sem redesenhar a página */
function patch(id,a){if(route()!=='cardapio')return false;const el=document.querySelector('[data-qs="'+id+'"]');if(!el)return false;
 el.innerHTML=qtyCtl(ITEM.get(+id));(el.querySelector('[data-act="'+a+'"]')||el.querySelector('[data-act]')).focus();
 const n=Object.values(S.cart).reduce((x,y)=>x+y,0),t=document.querySelector('#nav a[href="#carrinho"]');t.querySelector('.badge')?.remove();if(n)t.insertAdjacentHTML('beforeend','<span class="badge">'+n+'</span>');save();return true}
const totals=()=>{const sub=cartLines().reduce((a,l)=>a+l.p*l.q,0);let off=0;const c=COUPONS[S.coupon];
 if(c&&sub>=(c.min||0))off+=c.t==='pct'?sub*c.v:c.v;
 const pts=S.usePts&&S.pts>=POINT_COST?POINT_VALUE:0;
 const total=Math.max(0,sub-off-pts);return{sub,off,pts,total,earn:Math.floor(total)}};
const tier=()=>[...TIERS].reverse().find(t=>S.pts>=t.min);
const toast=m=>{const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),2200)};
const route=()=>(location.hash||'#inicio').slice(1);

/* Fotos na mesma pasta do index.html. Se faltar alguma, aparece o emoji. */
const PIC={1:['baiao-de-dois.jpg','🍚'],2:['carne-sol-macaxeira.jpg','🥩'],3:['moqueca.png','🍲'],4:['peixada-cearense.jpg','🐟'],5:['acaraje.jpg','🧆'],6:['tapioca-queijo-coalho.jpg','🫓'],7:['cuscuz-charque-queijo.jpg','🌽'],8:['','🥤'],9:['cajuina.jpg','🧃'],10:['bolo-de-rolo.jpg','🍰'],11:['cocada-forno.jpg','🥥']};
const HUE={Pratos:22,Lanches:42,Bebidas:150,Sobremesas:330};
const pic=i=>{const[p,e]=PIC[i.id]||['',''];return `<div class="ph" style="--h:${HUE[i.c]||30}" role="img" aria-label="${esc(i.n)}"><span aria-hidden="true">${e}</span>${p?`<img src="${p}" alt="" loading="lazy" decoding="async" width="400" height="250" onerror="this.remove()">`:''}</div>`};

/* Views */
function viewInicio(){
 return `<section class="hero"><h1>Sabor do Nordeste, do seu jeito.</h1><p>Escolha a unidade mais perto de você, veja o cardápio dela e peça em poucos toques.</p>
 <h2>Sua unidade</h2><div class="chips" role="group" aria-label="Unidades">${UNITS.map(u=>`<button class="chip" aria-pressed="${S.unit===u.id}" data-act="unit" data-id="${u.id}">${u.name}</button>`).join('')}</div>
 ${S.unit?`<p class="mute">${unit().addr} · Aberto das ${unit().hrs}</p><a class="btn sun" href="#cardapio">Ver cardápio</a>`:'<p class="mute">Selecione uma unidade para ver o cardápio.</p>'}</section>
 <h2>Promoções e campanhas</h2><div class="grid c2">
 ${Object.entries(COUPONS).map(([k,c])=>`<div class="card promo"><h3>${c.d}</h3><p class="mute">Use o cupom <code>${k}</code> no carrinho.</p><button class="btn sm ghost" data-act="coupon" data-id="${k}">Aplicar cupom</button></div>`).join('')}
 <div class="card promo"><h3>Programa Raízes</h3><p class="mute">Ganhe 1 ponto por real gasto. A cada ${POINT_COST} pontos, ${brl(POINT_VALUE)} de desconto.</p><a class="btn sm ghost" href="#fidelidade">Ver meus pontos</a></div></div>`}

function viewCardapio(){
 if(!S.unit)return `<div class="card"><h2>Escolha uma unidade</h2><p class="mute">O cardápio muda conforme a unidade.</p><a class="btn" href="#inicio">Escolher unidade</a></div>`;
 const list=MENU.get(S.unit),cats=['Todos',...new Set(list.map(i=>i.c))];
 const shown=list.filter(i=>S.cat==='Todos'||i.c===S.cat);
 return `<h2>Cardápio · ${unit().name}</h2><div class="chips">${cats.map(c=>`<button class="chip" aria-pressed="${S.cat===c}" data-act="cat" data-id="${c}">${c}</button>`).join('')}</div>
 <div class="grid c2 menu">${shown.map(i=>`<article class="card">${pic(i)}<div class="row"><h3>${i.n}</h3><span class="price">${brl(i.p)}</span></div><p class="mute">${i.d}</p>
 <div class="row"><span class="mute">${i.c}</span><span data-qs="${i.id}">${qtyCtl(i)}</span></div></article>`).join('')}</div>`}

function viewCarrinho(){
 const L=cartLines();
 if(!L.length)return `<div class="card"><h2>Seu carrinho está vazio</h2><p class="mute">Adicione pratos do cardápio para fazer o pedido.</p><a class="btn" href="#cardapio">Ver cardápio</a></div>`;
 const T=totals();
 return `<h2>Carrinho · ${unit()?unit().name:''}</h2><div class="card">${L.map(l=>`<div class="row" style="margin:.4rem 0"><span>${l.n}<br><span class="mute">${brl(l.p)}</span></span><div class="qty"><button data-act="dec" data-id="${l.id}" aria-label="Remover um">−</button><b>${l.q}</b><button data-act="inc" data-id="${l.id}" aria-label="Adicionar um">+</button></div></div>`).join('')}</div>
 <div class="card"><label class="f" for="cp">Cupom</label><div class="row"><input type="text" id="cp" value="${esc(S.coupon||'')}" placeholder="RAIZES10"><button class="btn sm" data-act="applycp">Aplicar</button></div>
 <label class="f hide-totem" for="dl">Como receber</label><select class="hide-totem" id="dl" data-sel="delivery"><option value="retirada" ${S.delivery==='retirada'?'selected':''}>Retirar na unidade</option><option value="entrega" ${S.delivery==='entrega'?'selected':''}>Entrega</option></select>
 <label class="f" for="py">Pagamento</label><select id="py" data-sel="pay"><option value="pix" ${S.pay==='pix'?'selected':''}>Pix</option><option value="cartao" ${S.pay==='cartao'?'selected':''}>Cartão de crédito</option></select>
 <label class="ck"><input type="checkbox" data-chk="usePts" ${S.usePts?'checked':''} ${S.pts<POINT_COST?'disabled':''}> Usar ${POINT_COST} pontos (${brl(POINT_VALUE)} de desconto). Saldo: ${S.pts}</label></div>
 <div class="card"><div class="row"><span>Subtotal</span><span>${brl(T.sub)}</span></div>${T.off?`<div class="row"><span>Cupom</span><span>− ${brl(T.off)}</span></div>`:''}${T.pts?`<div class="row"><span>Pontos</span><span>− ${brl(T.pts)}</span></div>`:''}
 <div class="row"><b>Total</b><span class="price">${brl(T.total)}</span></div><p class="mute">${S.user?`Você ganha ${T.earn} pontos neste pedido.`:'Entre na sua conta para ganhar pontos.'}</p>${S.ch==='totem'&&!S.user?'<button class="btn sm ghost" data-act="auth">Identificar-me</button>':''}
 <button class="btn sun" style="width:100%" data-act="pay">${S.user||S.ch==='totem'?'Pagar '+brl(T.total):'Entrar para finalizar'}</button></div>`}

function viewPedidos(){
 if(!S.user&&S.ch!=='totem')return `<div class="card"><h2>Entre para ver seus pedidos</h2><button class="btn" data-act="auth">Entrar ou cadastrar</button></div>`;
 const mine=S.orders.filter(o=>o.u===(S.user?S.user.email:'convidado'));
 if(!mine.length)return `<div class="card"><h2>Nenhum pedido ainda</h2><p class="mute">Seus pedidos aparecem aqui com o status em tempo real.</p><a class="btn" href="#cardapio">Fazer pedido</a></div>`;
 return `<h2>Meus pedidos</h2>${mine.map(o=>{const st=stage(o);return `<article class="card"><div class="row"><h3>Pedido #${o.id}</h3><span class="price">${brl(o.total)}</span></div>
 <p class="mute">${CH[o.ch||'web']} · ${o.unit} · ${o.type==='entrega'?'Entrega':'Retirada'} · ${o.pay==='pix'?'Pix':'Cartão'} aprovado${o.tx?' ('+o.tx+')':''}</p><p>${o.items.map(i=>`${i.q}× ${esc(i.n)}`).join(', ')}</p>
 <div class="steps" aria-hidden="true">${STAGES.map((s,i)=>`<span class="${i<=st?'on':''}"></span>`).join('')}</div><b>${STAGES[st]}</b></article>`}).join('')}`}
const stage=o=>Math.min(3,Math.floor((Date.now()-o.t)/8000));

function viewFidelidade(){
 if(!S.user)return `<div class="card"><h2>Programa Raízes</h2><p class="mute">Entre para acumular pontos a cada pedido.</p><button class="btn" data-act="auth">Entrar ou cadastrar</button></div>`;
 const t=tier(),nx=TIERS.find(x=>x.min>S.pts),pct=nx?Math.round(100*(S.pts-t.min)/(nx.min-t.min)):100;
 return `<h2>Programa Raízes</h2><div class="card"><p class="mute">Seu nível</p><h1>${t.n}</h1><p><b>${S.pts}</b> pontos · vale ${brl(Math.floor(S.pts/POINT_COST)*POINT_VALUE)} em descontos</p>
 <div class="bar2" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div style="width:${pct}%"></div></div>
 <p class="mute">${nx?`Faltam ${nx.min-S.pts} pontos para ${nx.n}.`:'Você está no nível máximo.'}</p></div>
 <div class="card"><h3>Como funciona</h3><p class="mute">1 ponto por real gasto. ${POINT_COST} pontos viram ${brl(POINT_VALUE)} de desconto no carrinho.</p></div>
 <h3>Histórico</h3>${S.hist.filter(h=>h.u===S.user.email).map(h=>`<div class="card row"><span>${esc(h.t)}</span><b>${h.p>0?'+':''}${h.p} pts</b></div>`).join('')||'<p class="mute">Seus pontos aparecem aqui após o primeiro pedido.</p>'}`}

function viewPrivacidade(){
 const m=S.user&&S.user.mkt;
 return `<h2>Privacidade e LGPD</h2><div class="card"><p>Coletamos nome, e-mail e histórico de pedidos apenas para criar sua conta, processar pedidos e operar o programa de fidelidade (Lei 13.709/2018). Nesta demonstração os dados ficam só no seu navegador.</p>
 <p class="mute">Controlador: Rede Raízes do Nordeste. Contato do encarregado (DPO): privacidade@raizesdonordeste.example</p></div>
 <div class="card"><h3>Seus direitos</h3>${S.user?`<label class="ck"><input type="checkbox" data-chk="mkt" ${m?'checked':''}> Receber promoções e campanhas (consentimento opcional, revogável a qualquer momento)</label>
 <div class="chips"><button class="btn sm ghost" data-act="export">Baixar meus dados</button><button class="btn sm" style="background:var(--pink)" data-act="del">Excluir minha conta</button></div>`:'<p class="mute">Entre na conta para exportar, corrigir ou excluir seus dados.</p>'}
 <button class="btn sm ghost" data-act="cookies">Rever consentimento de cookies</button></div>`}


/* Render */
const TABS=[['inicio','🏠','Início'],['cardapio','🍽️','Cardápio'],['carrinho','🛒','Carrinho'],['pedidos','📦','Pedidos'],['fidelidade','⭐','Pontos'],['privacidade','🔒','LGPD']];
function render(){
 const r=route(),V={inicio:viewInicio,cardapio:viewCardapio,carrinho:viewCarrinho,pedidos:viewPedidos,fidelidade:viewFidelidade,privacidade:viewPrivacidade}[r]||viewInicio;
 const n=Object.values(S.cart).reduce((a,b)=>a+b,0);
 document.body.dataset.ch=S.ch;$('#ch').value=S.ch;
 $('#nav').innerHTML=TABS.map(([k,i,l])=>`<a href="#${k}" ${r===k?'aria-current="page"':''}><i>${i}</i>${l}${k==='carrinho'&&n?`<span class="badge">${n}</span>`:''}</a>`).join('');
 $('#acc').textContent=S.user?'Sair ('+S.user.name.split(' ')[0]+')':'Entrar';
 $('#app').innerHTML=V();
 $('#aux').innerHTML=S.consent===null?`<div class="lgpd" role="dialog" aria-label="Cookies"><p style="margin:0 0 .6rem">Usamos armazenamento local para lembrar sua unidade e carrinho. Cookies de marketing só com seu consentimento. <a href="#privacidade">Saiba mais</a></p><button class="btn sm sun" data-act="ck" data-id="1">Aceitar tudo</button> <button class="btn sm ghost" style="color:#fff;border-color:#fff6" data-act="ck" data-id="0">Só o essencial</button></div>`:'';
 save();
}
addEventListener('hashchange',()=>{render();scrollTo(0,0)});


/* Autenticação (simulada) */
function authDlg(mode='login',msg=''){
 const d=$('#dlg'),reg=mode==='reg';
 d.innerHTML=`<form method="dialog" id="af"><h2>${reg?'Criar conta':'Entrar'}</h2>${msg?`<p class="err" role="alert">${msg}</p>`:''}
 ${reg?'<label class="f" for="nm">Nome</label><input type="text" id="nm" required autocomplete="name">':''}
 <label class="f" for="em">E-mail</label><input type="email" id="em" required autocomplete="email">
 <label class="f" for="pw">Senha (mín. 6 caracteres)</label><input type="password" id="pw" required minlength="6" autocomplete="${reg?'new-password':'current-password'}">
 ${reg?`<label class="ck"><input type="checkbox" id="c1" required> Li e aceito o tratamento dos meus dados para criar a conta e processar pedidos (<a href="#privacidade" onclick="$('#dlg').close()">LGPD</a>). Obrigatório.</label><label class="ck"><input type="checkbox" id="c2"> Quero receber promoções e campanhas. Opcional.</label>`:''}
 <div class="row" style="margin-top:.8rem"><button type="button" class="btn ghost" data-act="${reg?'login':'reg'}">${reg?'Já tenho conta':'Criar conta'}</button><button class="btn sun" type="submit">${reg?'Cadastrar':'Entrar'}</button></div>
 <p class="mute">Demonstração: a senha não é armazenada nem validada.</p></form>`;
 d.querySelector('form').onsubmit=e=>{e.preventDefault();
  const em=$('#em').value.trim().toLowerCase();
  if(reg){if(S.users.find(u=>u.email===em))return authDlg('reg','Este e-mail já tem cadastro. Use Entrar.');
   const u={name:$('#nm').value.trim(),email:em,mkt:$('#c2').checked,at:new Date().toISOString()};S.users.push(u);S.user=u;}
  else{const u=S.users.find(u=>u.email===em);if(!u)return authDlg('login','E-mail não encontrado. Crie uma conta.');S.user=u;}
  d.close();toast('Olá, '+S.user.name.split(' ')[0]+'!');render();};
 if(!d.open)d.showModal();
}

/* Sistema de pagamento: integração externa simulada
   Fluxo: pedido criado -> requisição enviada ao gateway -> aguardando autorização -> resposta (webhook).
   Nenhuma cobrança real; nada de cartão é guardado. */
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const pd=h=>{const d=$('#dlg');d.innerHTML=h;if(!d.open)d.showModal()};
const STEPS=['Pedido criado','Enviado ao gateway','Aguardando autorização','Resposta recebida'];
const stepper=(n,fin)=>`<ol class="pst">${STEPS.map((t,i)=>{const c=fin&&i===3?(fin==='ok'?'ok':'bad'):i<n?'ok':i===n&&!fin?'cur':'';return `<li class="${c}">${t}</li>`}).join('')}</ol>`;
const jd=(t,o)=>`<details><summary>${t}</summary><pre class="js">${esc(JSON.stringify(o,null,2))}</pre></details>`;
let PAY=null,PT=null;
const Gateway={respond(P,card,force){return new Promise(res=>setTimeout(()=>{
 const n=card.replace(/\D/g,''),base={transaction_id:'TX'+Math.random().toString(36).slice(2,10).toUpperCase(),order_ref:P.ref,amount:P.payload.amount,currency:'BRL',method:P.payload.method,processed_at:new Date().toISOString()};
 let o;
 if(force==='expired')o={status:'expired',code:'EXP',message:'O prazo para pagar o Pix terminou.'};
 else if(n.endsWith('0002'))o={status:'declined',code:'51',message:'Saldo insuficiente. Tente outro cartão ou outra forma de pagamento.'};
 else if(n.endsWith('0119'))o={status:'error',code:'91',message:'O emissor não respondeu. Tente novamente em instantes.'};
 else o={status:'approved',code:'00',message:'Transação autorizada',authorization:String(Math.random()*1e6|0).padStart(6,'0')};
 res({...base,...o})},force?900:1800))}};

function qr(seed){let h=0;for(const c of seed)h=(h*31+c.charCodeAt(0))>>>0;const N=25,K=[[0,0],[N-7,0],[0,N-7]];
 const fp=(a,b)=>a<0||b<0||a>6||b>6?false:(a==0||a==6||b==0||b==6||(a>1&&a<5&&b>1&&b<5));let r='';
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){let inF=false,on=false;
  for(const[ox,oy]of K){const a=x-ox,b=y-oy;if(a>=-1&&a<=7&&b>=-1&&b<=7){inF=true;on=fp(a,b)}}
  if(!inF){h=(h*1664525+1013904223)>>>0;on=(h>>>16)&1}
  if(on)r+=`<rect x="${x}" y="${y}" width="1" height="1"/>`}
 return `<svg viewBox="-1 -1 27 27" width="190" height="190" role="img" aria-label="QR Code Pix (ilustrativo)"><rect x="-1" y="-1" width="27" height="27" fill="#fff"/><g fill="#000">${r}</g></svg>`}

function startPay(){
 const T=totals(),ref='RN-'+String(Date.now()).slice(-6);
 PAY={ref,T,tok:Date.now(),payload:{merchant_id:'raizes-nordeste-demo',order_ref:ref,amount:Math.round(T.total*100),currency:'BRL',method:S.pay,channel:S.ch,unit:S.unit,idempotency_key:(crypto.randomUUID?crypto.randomUUID():ref),callback_url:'/webhooks/pagamento (simulado)'}};
 if(T.total<=0)return finish({status:'approved',transaction_id:'SEM-COBRANCA',order_ref:ref,amount:0,message:'Pedido coberto por cupom/pontos',authorization:'—'});
 S.pay==='pix'?pixStep():cardForm();
}
function cardForm(msg=''){
 pd(`<form id="cf" novalidate><h2>Cartão de crédito</h2><p class="mute">Valor: <b>${brl(PAY.T.total)}</b>. Os dados vão direto ao gateway e não são guardados por este site.</p>${msg?`<p class="err" role="alert">${msg}</p>`:''}
 <label class="f" for="cn">Número do cartão</label><input type="text" id="cn" inputmode="numeric" autocomplete="cc-number" placeholder="4111 1111 1111 1111">
 <label class="f" for="cm">Nome impresso</label><input type="text" id="cm" autocomplete="cc-name">
 <div class="row"><div style="flex:1"><label class="f" for="cv">Validade</label><input type="text" id="cv" placeholder="MM/AA" inputmode="numeric" autocomplete="cc-exp" maxlength="5"></div><div style="flex:1"><label class="f" for="cc">CVV</label><input type="text" id="cc" inputmode="numeric" autocomplete="cc-csc" maxlength="4"></div></div>
 <details><summary>Cartões de teste</summary><p class="mute">4111 1111 1111 1111 → aprova<br>4000 0000 0000 0002 → recusa (saldo)<br>4000 0000 0000 0119 → erro do gateway<br>Validade futura e CVV com 3 dígitos.</p></details>
 <div class="row" style="margin-top:.8rem"><button type="button" class="btn ghost" data-act="close">Cancelar</button><button class="btn sun">Pagar ${brl(PAY.T.total)}</button></div></form>`);
 $('#cn').oninput=e=>e.target.value=e.target.value.replace(/\D/g,'').slice(0,16).replace(/(\d{4})(?=\d)/g,'$1 ');
 $('#cv').oninput=e=>{let v=e.target.value.replace(/\D/g,'').slice(0,4);e.target.value=v.length>2?v.slice(0,2)+'/'+v.slice(2):v};
 $('#cf').onsubmit=e=>{e.preventDefault();
  const n=$('#cn').value.replace(/\D/g,''),m=$('#cv').value.match(/^(0[1-9]|1[0-2])\/(\d\d)$/),cv=$('#cc').value;
  const luhn=[...n].reverse().reduce((a,c,i)=>{c=+c;if(i%2){c*=2;if(c>9)c-=9}return a+c},0)%10===0;
  const exp=m&&new Date(2000+ +m[2],+m[1],0,23,59)>=new Date();
  if(n.length<13||!luhn)return cardForm('Número de cartão inválido.');
  if(!$('#cm').value.trim())return cardForm('Informe o nome impresso no cartão.');
  if(!exp)return cardForm('Validade inválida ou vencida.');
  if(!/^\d{3,4}$/.test(cv))return cardForm('CVV inválido.');
  sendCharge(n)}
}
async function sendCharge(card){
 const tok=PAY.tok,P=PAY,payload={...P.payload,card:{brand:'visa',last4:card.slice(-4),token:'tok_'+Math.random().toString(36).slice(2,10)}};
 pd(`<h2>Enviando pagamento</h2><p class="mute">Solicitação enviada ao gateway de pagamento (simulado).</p>${stepper(1)}${jd('Requisição enviada',payload)}`);
 await wait(1000);if(PAY?.tok!==tok)return;
 pd(`<h2>Aguardando autorização</h2><p class="mute">O gateway está consultando o emissor do cartão…</p>${stepper(2)}${jd('Requisição enviada',payload)}`);
 const r=await Gateway.respond(P,card);if(PAY?.tok!==tok)return;finish(r)
}
async function pixStep(){
 const tok=PAY.tok,P=PAY;
 pd(`<h2>Gerando cobrança Pix</h2><p class="mute">Solicitação enviada ao gateway de pagamento (simulado).</p>${stepper(1)}${jd('Requisição enviada',P.payload)}`);
 await wait(1100);if(PAY?.tok!==tok)return;
 const code='00020126580014br.gov.bcb.pix0136'+P.payload.idempotency_key+'520400005303986540'+P.payload.amount+'5802BR5920RAIZES DO NORDESTE6009SAO PAULO6304DEMO';
 let left=300;
 pd(`<h2>Pague com Pix</h2>${stepper(2)}<div style="text-align:center">${qr(P.ref)}<p class="mute">QR Code ilustrativo · expira em <b id="pt">05:00</b></p></div>
 <label class="f" for="pc">Pix copia e cola</label><div class="row"><input type="text" id="pc" readonly value="${code}"><button class="btn sm" data-act="copy">Copiar</button></div>
 <p class="mute">Valor ${brl(P.T.total)}. Pague no app do seu banco: esta tela atualiza quando o gateway confirmar.</p>
 <div class="row"><button class="btn ghost sm" data-act="close">Cancelar</button><button class="btn sun sm" data-act="pixpaid">Simular pagamento no banco</button></div>
 <button class="btn ghost sm" style="margin-top:.5rem" data-act="pixexp">Simular expiração</button>${jd('Requisição enviada',P.payload)}`);
 clearInterval(PT);PT=setInterval(()=>{left--;const t=$('#pt');if(t)t.textContent=String(left/60|0).padStart(2,'0')+':'+String(left%60).padStart(2,'0');if(left<=0)pixResult('expired')},1000);
}
async function pixResult(force){
 const tok=PAY?.tok,P=PAY;if(!P)return;clearInterval(PT);
 pd(`<h2>Confirmando com o gateway</h2><p class="mute">Aguardando o retorno (webhook simulado)…</p>${stepper(2)}`);
 const r=await Gateway.respond(P,'',force==='expired'?'expired':'ok');if(PAY?.tok!==tok)return;finish(r)
}
function finish(r){
 const T=PAY.T,j=jd('Resposta do gateway (webhook simulado)',r);clearInterval(PT);
 if(r.status==='approved'){
  const id=String(Date.now()).slice(-5),it=cartLines().map(l=>({n:l.n,q:l.q}));
  S.orders.unshift({id,u:S.user?S.user.email:'convidado',ch:S.ch,unit:unit().name,items:it,total:T.total,type:S.ch==='totem'?'retirada':S.delivery,pay:S.pay,tx:r.transaction_id,t:Date.now()});
  if(S.user&&T.pts){S.pts-=POINT_COST;S.hist.unshift({u:S.user.email,t:'Resgate no pedido #'+id,p:-POINT_COST})}
  if(S.user){S.pts+=T.earn;S.hist.unshift({u:S.user.email,t:'Pedido #'+id,p:T.earn})}
  S.cart={};S.coupon=null;S.usePts=false;
  pd(`<h2 style="color:var(--green)">Pagamento aprovado ✓</h2>${stepper(3,'ok')}
  <div class="card"><div class="row"><span>Pedido</span><b>#${id}</b></div><div class="row"><span>Valor</span><b>${brl(T.total)}</b></div><div class="row"><span>Forma</span><b>${S.pay==='pix'?'Pix':'Cartão de crédito'}</b></div><div class="row"><span>Transação</span><b>${r.transaction_id}</b></div><div class="row"><span>Autorização</span><b>${r.authorization}</b></div></div>
  <p>${S.user?`Você ganhou <b>${T.earn} pontos</b>.`:'Identifique-se no próximo pedido para ganhar pontos.'}</p>${j}<a class="btn sun" href="#pedidos" data-act="close">Acompanhar pedido</a>`);
  PAY=null;render();
 }else{
  const ti={declined:'Pagamento recusado',error:'Falha de comunicação com o gateway',expired:'Pix expirado'}[r.status];
  pd(`<h2 class="err">${ti}</h2>${stepper(3,'bad')}<p>${r.message}</p><p class="mute">Nenhuma cobrança foi feita e seu carrinho foi mantido.</p>${j}
  <div class="row"><button class="btn ghost" data-act="close">Trocar forma de pagamento</button><button class="btn sun" data-act="pay">Tentar novamente</button></div>`);
 }
}


/* Eventos */
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,id=b.dataset.id;
 if(a==='unit'){if(S.unit!==id&&Object.keys(S.cart).length){S.cart={};toast('Carrinho limpo: cada unidade tem seu cardápio')}S.unit=id;S.cat='Todos'}
 else if(a==='cat')S.cat=id;
 else if(a==='inc'){S.cart[id]=(S.cart[id]||0)+1;if(patch(id,a))return}
 else if(a==='dec'){if(--S.cart[id]<=0)delete S.cart[id];if(patch(id,a))return}
 else if(a==='coupon'){S.coupon=id;toast('Cupom '+id+' aplicado')}
 else if(a==='applycp'){const v=$('#cp').value.trim().toUpperCase();if(!v)S.coupon=null;else if(COUPONS[v]){S.coupon=v;toast('Cupom aplicado')}else toast('Cupom inválido')}
 else if(a==='auth'||a==='login'){authDlg('login');return}
 else if(a==='reg'){authDlg('reg');return}
 else if(a==='pay'){if(!S.user&&S.ch!=='totem'){authDlg('login');return}startPay();return}
 else if(a==='close'){$('#dlg').close()}
 else if(a==='copy'){const i=$('#pc');i.select();try{navigator.clipboard.writeText(i.value)}catch(x){}toast('Código Pix copiado');return}
 else if(a==='pixpaid'){pixResult('ok');return}
 else if(a==='pixexp'){pixResult('expired');return}
 else if(a==='ck')S.consent=id==='1';
 else if(a==='cookies')S.consent=null;
 else if(a==='export'){const blob=new Blob([JSON.stringify({usuario:S.user,pedidos:S.orders.filter(o=>o.u===S.user.email),pontos:S.pts,historico:S.hist.filter(h=>h.u===S.user.email)},null,2)],{type:'application/json'});const l=document.createElement('a');l.href=URL.createObjectURL(blob);l.download='meus-dados-raizes.json';l.click()}
 else if(a==='del'){if(confirm('Excluir sua conta e todos os seus dados? Esta ação não pode ser desfeita.')){const em=S.user.email;S.users=S.users.filter(u=>u.email!==em);S.orders=S.orders.filter(o=>o.u!==em);S.hist=S.hist.filter(h=>h.u!==em);S.user=null;S.pts=0;toast('Conta excluída');location.hash='#inicio'}}
 render();
});
document.addEventListener('change',e=>{
 const t=e.target;
 if(t.dataset.sel){S[t.dataset.sel]=t.value;render()}
 else if(t.dataset.chk==='mkt'){S.user.mkt=t.checked;toast(t.checked?'Consentimento registrado':'Consentimento revogado');save()}
 else if(t.dataset.chk){S[t.dataset.chk]=t.checked;render()}
});
$('#dlg').addEventListener('close',()=>{clearInterval(PT);PAY=null});
$('#acc').onclick=()=>{if(S.user){S.user=null;S.pts=0;toast('Você saiu');render()}else authDlg('login')};

/* pontos pertencem à conta: recalcula ao entrar */
const _render=render;render=function(){if(S.user){S.pts=S.hist.filter(h=>h.u===S.user.email).reduce((a,h)=>a+h.p,0)}_render()};
setInterval(()=>{if(route()==='pedidos'&&!$('#dlg').open&&!document.hidden)render()},4000);/* pausa com a aba oculta */
if('serviceWorker'in navigator&&/^https?:/.test(location.protocol))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));/* cache offline (PWA) */
/* Totem: reinicia a sessão após 60 s sem toque (protege dados do cliente anterior) */
let idle;const bump=()=>{clearTimeout(idle);if(S.ch==='totem')idle=setTimeout(()=>{S.cart={};S.user=null;S.pts=0;S.coupon=null;S.usePts=false;S.orders=S.orders.filter(o=>o.u!=='convidado');if($('#dlg').open)$('#dlg').close();location.hash='#inicio';toast('Sessão reiniciada por inatividade');render()},60000)};
['click','touchstart','keydown'].forEach(ev=>addEventListener(ev,bump));
$('#ch').onchange=e=>{S.ch=e.target.value;bump();render()};
bump();render();
