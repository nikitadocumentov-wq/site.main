(function(){
  'use strict';
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch=window.matchMedia('(hover:none),(pointer:coarse)').matches;

  /* iOS Safari иногда требует первое касание для активации :hover и только второе засчитывает как клик — этот пустой обработчик отключает такое поведение */
  if(touch){document.body.addEventListener('touchstart',function(){},{passive:true});}

  /* переключатель языка (RU/EN/KA) через Google Translate */
  (function(){
    var STORAGE_KEY='documenti_lang';
    function getSavedLang(){
      try{ return localStorage.getItem(STORAGE_KEY) || 'ru'; }catch(e){ return 'ru'; }
    }
    function saveLang(lang){
      try{ localStorage.setItem(STORAGE_KEY, lang); }catch(e){}
    }
    function findCombo(){ return document.querySelector('select.goog-te-combo'); }
    function applyLang(lang, attemptsLeft){
      if(attemptsLeft===undefined)attemptsLeft=40;
      if(lang==='ru'){
        // сброс на оригинал: чистим куку Google Translate во всех возможных вариантах домена —
        // сам виджет мог поставить её с доменом ".hostname", а не без домена
        var host=location.hostname;
        var expire='; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        document.cookie='googtrans='+expire;
        document.cookie='googtrans='+expire+'; domain='+host;
        document.cookie='googtrans='+expire+'; domain=.'+host;
        location.reload();
        return;
      }
      var combo=findCombo();
      if(combo){
        combo.value=lang;
        combo.dispatchEvent(new Event('change',{bubbles:true}));
        setActive(lang);
      }else if(attemptsLeft>0){
        // виджет Google Translate подгружается асинхронно — пробуем ещё раз через паузу
        setTimeout(function(){ applyLang(lang, attemptsLeft-1); }, 250);
      }
    }
    function setActive(lang){
      document.querySelectorAll('.lang-btn').forEach(function(btn){
        btn.classList.toggle('active', btn.dataset.lang===lang);
      });
    }
    document.querySelectorAll('.lang-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        saveLang(btn.dataset.lang);
        applyLang(btn.dataset.lang);
      });
    });
    setActive(getSavedLang());
    // при заходе на страницу — если раньше выбрали EN/KA, применяем автоматически
    var saved=getSavedLang();
    if(saved!=='ru'){ applyLang(saved); }
  })();

  var navs=document.querySelectorAll('.nav'), bars=document.querySelectorAll('.progress');
  function onScroll(){
    navs.forEach(function(nav){nav.classList.toggle('scrolled',scrollY>20);});
    var h=document.documentElement;
    var pct=(h.scrollTop/(h.scrollHeight-h.clientHeight||1)*100)+'%';
    bars.forEach(function(bar){bar.style.width=pct;});
  }
  onScroll(); addEventListener('scroll',onScroll,{passive:true});

  /* «назад» возвращает на предыдущую страницу с сохранением позиции прокрутки */
  [].forEach.call(document.querySelectorAll('.back-link'),function(a){
    a.addEventListener('click',function(e){
      if(history.length>1 && document.referrer && document.referrer.indexOf(location.origin)===0){
        e.preventDefault(); history.back();
      }
    });
  });

  /* кнопка ВЫГОДА → секция пакетов (работает и на сайте, и в предпросмотре) */
  [].forEach.call(document.querySelectorAll('.vygoda-fab'),function(f){
    f.addEventListener('click',function(e){
      var el=document.getElementById('pakety');
      if(el && el.offsetParent!==null){ e.preventDefault(); el.scrollIntoView({behavior:'smooth',block:'start'}); return; }
      if(document.querySelector('.vpage')){ /* режим предпросмотра (один файл) */
        e.preventDefault(); location.hash='p-index';
        setTimeout(function(){var t=document.getElementById('pakety'); if(t)t.scrollIntoView({behavior:'smooth',block:'start'});},90);
      }
    });
  });

  document.querySelectorAll('.burger').forEach(function(burger){
    var vp=burger.closest('.vpage');
    var mm=vp?vp.querySelector('.m-menu'):null;
    if(!mm)return;
    function closeM(){burger.classList.remove('x');mm.classList.remove('open');document.body.style.overflow='';}
    burger.addEventListener('click',function(){
      burger.classList.toggle('x');mm.classList.toggle('open');
      document.body.style.overflow=mm.classList.contains('open')?'hidden':'';
    });
    mm.querySelectorAll('a').forEach(function(a){a.addEventListener('click',closeM);});
  });

  var revs=document.querySelectorAll('.reveal');
  if(reduce){revs.forEach(function(e){e.classList.add('in');});}
  else{
    var io=new IntersectionObserver(function(es){
      es.forEach(function(en){
        if(en.isIntersecting){
          en.target.style.setProperty('--d',(+(en.target.dataset.i||0))*90);
          en.target.classList.add('in');io.unobserve(en.target);
        }
      });
    },{threshold:.12,rootMargin:'0px 0px -50px 0px'});
    revs.forEach(function(e){io.observe(e);});
    /* защита: если перевод страницы или что-то ещё помешает сработать анимации —
       принудительно показываем все ещё скрытые блоки через несколько секунд,
       чтобы контент никогда не оставался невидимым навсегда */
    setTimeout(function(){
      document.querySelectorAll('.reveal:not(.in)').forEach(function(e){e.classList.add('in');});
    },4000);
  }

  /* statement word reveal */
  var stEl=document.getElementById('statement-text');
  if(stEl){
    var words='Мы превращаем сложные процедуры Домов юстиции в [понятный] [процесс]. От первой консультации — до документов [у] [вас] [на] [руках].';
    stEl.innerHTML=words.split(' ').map(function(w){
      var acc=w[0]==='[';
      return '<span class="'+(acc?'acc':'')+'">'+w.replace(/[\[\]]/g,'')+'</span>';
    }).join(' ');
    var stWords=stEl.querySelectorAll('span');
    var litStatement=function(){
      stWords=stEl.querySelectorAll('span'); /* переспрашиваем на случай, если перевод страницы заменил узлы */
      var r=stEl.getBoundingClientRect(), vh=innerHeight;
      var p=(vh*0.82-r.top)/(vh*0.55);
      p=Math.max(0,Math.min(1,p));
      var n=Math.round(p*stWords.length);
      stWords.forEach(function(s,i){s.classList.toggle('lit',i<n);});
    };
    if(reduce){stWords.forEach(function(s){s.classList.add('lit');});}
    else{
      litStatement();
      addEventListener('scroll',litStatement,{passive:true});
      /* Google Translate может переписать содержимое этого блока после перевода —
         на любое такое изменение пересчитываем анимацию заново, чтобы она не залипала */
      var stObs=new MutationObserver(function(){ litStatement(); });
      stObs.observe(stEl,{childList:true,subtree:true,characterData:true});
    }
  }

  /* clients counter — растёт каждый день на случайные 3–15 */
  (function(){
    var el=document.getElementById('clientsCount');
    if(!el)return;
    function fmt(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');}
    var base=19187, baseDate=Date.UTC(2026,4,17);
    var t=new Date(), todayUTC=Date.UTC(t.getFullYear(),t.getMonth(),t.getDate());
    var days=Math.floor((todayUTC-baseDate)/86400000); if(days<0)days=0;
    var total=base;
    for(var d=1;d<=days;d++){
      var x=Math.sin(d*99991)*10000; x=x-Math.floor(x);
      total+=3+Math.floor(x*13);
    }
    if(reduce){el.textContent=fmt(total);return;}
    var cc=new IntersectionObserver(function(es){
      es.forEach(function(en){
        if(en.isIntersecting){
          var t0=null;
          (function tick(ts){if(!t0)t0=ts;var p=Math.min(1,(ts-t0)/1700);
            el.textContent=fmt(Math.round(total*(1-Math.pow(1-p,3))));
            if(p<1)requestAnimationFrame(tick);})(performance.now());
          cc.unobserve(en.target);
        }
      });
    },{threshold:.5});
    cc.observe(el);
  })();

  /* count-up */
  function up(el){
    var num=parseInt(el.dataset.count,10),sfx=el.dataset.suffix||'';
    if(isNaN(num))return;
    if(reduce){el.textContent=num+sfx;return;}
    var t0=null;
    function tick(ts){if(!t0)t0=ts;var p=Math.min(1,(ts-t0)/1300);
      el.textContent=Math.round(num*(1-Math.pow(1-p,3)))+sfx;if(p<1)requestAnimationFrame(tick);}
    requestAnimationFrame(tick);
  }
  var cio=new IntersectionObserver(function(es){
    es.forEach(function(en){if(en.isIntersecting){up(en.target);cio.unobserve(en.target);}});
  },{threshold:.6});
  document.querySelectorAll('[data-count]').forEach(function(e){cio.observe(e);});

  /* vnzh sticky counter */
  var items=document.querySelectorAll('.vnzh-item');
  var goldEl=document.querySelector('.vnzh-gold');
  var curEl=document.getElementById('vnzh-cur'), barEl=document.getElementById('vnzh-bar'),
      nameEl=document.getElementById('vnzh-name');
  function vnzhSet(idx){
    items.forEach(function(x){x.classList.remove('active');});
    if(goldEl)goldEl.classList.remove('active');
    var el=items[idx-1]; if(!el)return;
    el.classList.add('active');
    if(curEl){curEl.textContent=('0'+idx).slice(-2);curEl.classList.remove('gold');}
    if(barEl)barEl.style.width=(idx/items.length*100)+'%';
    if(nameEl){var h=el.querySelector('h3');if(h)nameEl.textContent=h.textContent;}
  }
  function vnzhSetGold(){
    items.forEach(function(x){x.classList.remove('active');});
    if(goldEl)goldEl.classList.add('active');
    if(curEl){curEl.textContent='00';curEl.classList.add('gold');}
    if(barEl)barEl.style.width='0%';
    if(nameEl && goldEl){var h=goldEl.querySelector('h3');if(h)nameEl.textContent=h.textContent;}
  }
  function vnzhUpdate(){
    if(!items.length||!items[0].offsetParent)return;
    var ref=220;
    if(goldEl && goldEl.getBoundingClientRect().top<=ref && items[0].getBoundingClientRect().top>ref){
      vnzhSetGold();
      return;
    }
    var active=1;
    for(var i=0;i<items.length;i++){
      if(items[i].getBoundingClientRect().top<=ref) active=i+1;
      else break;
    }
    vnzhSet(active);
  }
  if(items.length){
    vnzhSet(1);
    vnzhUpdate();
    window.addEventListener('scroll',vnzhUpdate,{passive:true});
  }

  /* process steps */
  var pio=new IntersectionObserver(function(es){
    es.forEach(function(en){if(en.isIntersecting)en.target.classList.add('lit');});
  },{threshold:.5});
  document.querySelectorAll('.step').forEach(function(e){pio.observe(e);});

  /* bento spotlight */
  if(!touch){
    document.querySelectorAll('.bcard').forEach(function(c){
      c.addEventListener('mousemove',function(e){
        var r=c.getBoundingClientRect();
        c.style.setProperty('--mx',(e.clientX-r.left)+'px');
        c.style.setProperty('--my',(e.clientY-r.top)+'px');
      });
    });
  }

  /* magnetic */
  if(!touch && !reduce){
    document.querySelectorAll('[data-magnet]').forEach(function(b){
      b.addEventListener('mousemove',function(e){
        var r=b.getBoundingClientRect();
        b.style.transform='translate('+((e.clientX-r.left-r.width/2)*.25)+'px,'+((e.clientY-r.top-r.height/2)*.35)+'px)';
      });
      b.addEventListener('mouseleave',function(){b.style.transform='';});
    });
  }

  /* orbs parallax */
  if(!touch && !reduce){
    var orbs=document.querySelectorAll('.orb');
    addEventListener('mousemove',function(e){
      var x=(e.clientX/innerWidth-.5), y=(e.clientY/innerHeight-.5);
      orbs.forEach(function(o,i){
        var m=(i+1)*14;
        o.style.marginLeft=(x*m)+'px';o.style.marginTop=(y*m)+'px';
      });
    });
  }

  /* ===== формы заявки (основная + мини) ===== */

  /* живые отзывы из Telegram (reviews.json) */
  (function(){
    var container = document.querySelector('.rv-masonry');
    if(!container) return;
    fetch('https://reviews.documenti.ge/reviews.json')
      .then(function(r){ return r.ok ? r.json() : []; })
      .then(function(items){
        items.forEach(function(item){
          var fig = document.createElement('figure');
          fig.className = 'review reveal rv-reveal';
          var initial = (item.author||'К').charAt(0).toUpperCase();

          if(item.type === 'text'){
            fig.innerHTML =
              '<blockquote>'+item.text.replace(/</g,'&lt;')+'</blockquote>'+
              '<figcaption class="rv-foot"><span class="rv-ava">'+initial+'</span>'+
              '<span><div class="rv-name">'+item.author+'</div><div class="rv-topic">Текстовый отзыв</div></span></figcaption>';
          } else if(item.type === 'audio'){
            var bars = ''; var barCount = 24;
            for(var i=0;i<barCount;i++){ bars += '<i style="height:'+(30+Math.round(Math.random()*70))+'%"></i>'; }
            fig.innerHTML =
              '<div class="rv-audio"><button type="button" class="rv-play" aria-label="Воспроизвести"><i class="pchar">▶</i></button>'+
              '<div style="flex:1"><div class="rv-wave">'+bars+'</div><div class="rv-time">0:00</div></div></div>'+
              '<figcaption class="rv-foot"><span class="rv-ava">'+initial+'</span>'+
              '<span><div class="rv-name">'+item.author+'</div><div class="rv-topic">Голосовой отзыв</div></span></figcaption>';
            var audio = new Audio(item.url);
            var playBtn = fig.querySelector('.rv-play');
            var waveEls = fig.querySelectorAll('.rv-wave i');
            var timeEl = fig.querySelector('.rv-time');
            function fmt(s){ s=Math.floor(s||0); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
            playBtn.addEventListener('click', function(){
              if(audio.paused){ audio.play(); playBtn.innerHTML='<i class="pchar">❚❚</i>'; }
              else { audio.pause(); playBtn.innerHTML='<i class="pchar">▶</i>'; }
            });
            audio.addEventListener('timeupdate', function(){
              var pct = audio.duration ? audio.currentTime/audio.duration : 0;
              var onCount = Math.round(pct*waveEls.length);
              waveEls.forEach(function(el,i){ el.classList.toggle('on', i<onCount); });
              timeEl.textContent = fmt(audio.currentTime)+' / '+fmt(audio.duration);
            });
            audio.addEventListener('ended', function(){ playBtn.innerHTML='<i class="pchar">▶</i>'; });
          } else if(item.type === 'video'){
            fig.innerHTML =
              '<div class="rv-video-wrap"><video preload="metadata" src="'+item.url+'"></video>'+
              '<button type="button" class="rv-video-play" aria-label="Воспроизвести видео"><i class="pchar">▶</i></button>'+
              '<span class="rv-video-dur"></span></div>'+
              '<figcaption class="rv-foot"><span class="rv-ava">'+initial+'</span>'+
              '<span><div class="rv-name">'+item.author+'</div><div class="rv-topic">Видео-отзыв</div></span></figcaption>';
            var vid = fig.querySelector('video');
            var vBtn = fig.querySelector('.rv-video-play');
            var vDur = fig.querySelector('.rv-video-dur');
            vid.addEventListener('loadedmetadata', function(){
              var s=Math.floor(vid.duration||0);
              vDur.textContent = Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
            });
            vBtn.addEventListener('click', function(){ vid.play(); vid.setAttribute('controls',''); vBtn.classList.add('hidden'); });
            vid.addEventListener('pause', function(){ if(vid.currentTime>0 && vid.currentTime<vid.duration) return; });
          }

          container.prepend(fig);
        });
      })
      .catch(function(){ /* если не удалось — просто остаются статичные отзывы */ });
  })();

  /* формы заявки (основная + мини) ===== */
  function toast(msg){
    var vp=document.querySelector('.vpage:not([hidden])');
    var t=vp?vp.querySelector('#toast'):document.getElementById('toast');
    if(!t)return;
    t.textContent=msg;t.classList.add('show');
    clearTimeout(t._t);t._t=setTimeout(function(){t.classList.remove('show');},4200);
  }
  function copyText(text){
    return new Promise(function(res){
      function fb(){
        var ta=document.createElement('textarea');
        ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
        document.body.appendChild(ta);ta.focus();ta.select();
        try{document.execCommand('copy');}catch(e){}
        document.body.removeChild(ta);res();
      }
      if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(res,fb);
      }else fb();
    });
  }
  var CITY_OPTIONS=['Тбилиси','Батуми','Кутаиси','Удалённо','Другой город Грузии'];
  var SERVICE_GROUPS=[
    ['ВНЖ и статус',['ВНЖ по ИП/ООО без оборота','ВНЖ по ИП / ООО','ВНЖ по недвижимости','ВНЖ по воссоединению семьи','ВНЖ по учёбе','ВНЖ по трудоустройству','ВНЖ для IT-специалиста','ВНЖ по инвестициям','Визы для легализации (D1/D3/D5/D6/C5)','Продление ВНЖ','ПМЖ Грузии','Гражданство Грузии','Статус соотечественника','Прописка (ВНЖ/ПМЖ)']],
    ['Бизнес и финансы',['Регистрация ИП — лично','Регистрация ИП — удалённо','Регистрация ООО — лично','Регистрация ООО — удалённо','Закрытие ИП','Закрытие ООО','ПТД — разрешение на работу','Переводчик на интервью ПТД','Банковский счёт','Настройка налогового кабинета','Бухгалтерия ИП','Бухгалтерия ООО','Регистрация ВЭД','Virtual Zone','Составление договоров']],
    ['Недвижимость',['Оценка недвижимости','Сделки с недвижимостью']],
    ['Документы и услуги',['Регистрация брака','Развод','Медицинская страховка','Переводы и нотариус','Диагностика юриста','Диагностика бухгалтера','Виза за рубеж (ЕС/США/UK/Япония/Канада)']],
    ['Партнёры',['Аренда жилья (партнёр)','Инвестиции в недвижимость (партнёр)','Стать партнёром','Стать креатором']]
  ];
  function buildServiceOptions(selectedVal){
    var html='<option value="">Выбрать услугу</option>';
    SERVICE_GROUPS.forEach(function(g){
      html+='<optgroup label="'+g[0]+'">';
      g[1].forEach(function(s){html+='<option'+(s===selectedVal?' selected':'')+'>'+s+'</option>';});
      html+='</optgroup>';
    });
    html+='<option>Другое / пока не знаю</option>';
    return html;
  }
  var PAGE_SERVICE_MAP={
    'p-vnzh-bez-oborota':'ВНЖ по ИП/ООО без оборота','p-vnzh-ip':'ВНЖ по ИП / ООО','p-vnzh-nedvizhimost':'ВНЖ по недвижимости',
    'p-vnzh-semya':'ВНЖ по воссоединению семьи','p-vnzh-ucheba':'ВНЖ по учёбе','p-vnzh-rabota':'ВНЖ по трудоустройству',
    'p-vnzh-it':'ВНЖ для IT-специалиста','p-vnzh-investicii':'ВНЖ по инвестициям','p-usluga-vizy-legalizaciya':'Визы для легализации (D1/D3/D5/D6/C5)',
    'p-usluga-prodlenie-vnzh':'Продление ВНЖ','p-usluga-pmzh':'ПМЖ Грузии','p-usluga-grazhdanstvo':'Гражданство Грузии',
    'p-usluga-sootechestvennik':'Статус соотечественника','p-usluga-propiska':'Прописка (ВНЖ/ПМЖ)',
    'p-usluga-ip':'Регистрация ИП — лично','p-usluga-ip-udalenno':'Регистрация ИП — удалённо',
    'p-usluga-ooo':'Регистрация ООО — лично','p-usluga-ooo-udalenno':'Регистрация ООО — удалённо',
    'p-usluga-zakrytie-ip':'Закрытие ИП','p-usluga-zakrytie-ooo':'Закрытие ООО',
    'p-usluga-ptd':'ПТД — разрешение на работу','p-usluga-perevodchik-ptd':'Переводчик на интервью ПТД',
    'p-usluga-schet':'Банковский счёт','p-usluga-schet-biznes':'Банковский счёт','p-usluga-schet-docs':'Банковский счёт','p-usluga-schet-udalenno':'Банковский счёт',
    'p-usluga-nalog-kabinet':'Настройка налогового кабинета','p-usluga-buhgalteriya':'Бухгалтерия ИП','p-usluga-buhgalteriya-ooo':'Бухгалтерия ООО',
    'p-usluga-ved':'Регистрация ВЭД','p-usluga-virtualnaya-zona':'Virtual Zone','p-usluga-dogovory':'Составление договоров',
    'p-usluga-ocenka-nedvizhimosti':'Оценка недвижимости','p-usluga-sdelki-nedvizhimost':'Сделки с недвижимостью',
    'p-usluga-brak':'Регистрация брака','p-usluga-razvod':'Развод','p-usluga-strahovka':'Медицинская страховка',
    'p-usluga-perevody':'Переводы и нотариус','p-usluga-konsultaciya':'Диагностика юриста','p-usluga-diagnostika-buhgalter':'Диагностика бухгалтера',
    'p-usluga-viza-es':'Виза за рубеж (ЕС/США/UK/Япония/Канада)','p-usluga-viza-usa':'Виза за рубеж (ЕС/США/UK/Япония/Канада)',
    'p-usluga-viza-uk':'Виза за рубеж (ЕС/США/UK/Япония/Канада)','p-usluga-viza-japan':'Виза за рубеж (ЕС/США/UK/Япония/Канада)','p-usluga-viza-canada':'Виза за рубеж (ЕС/США/UK/Япония/Канада)'
  };
  function enhanceForm(form){
    if(form.dataset.enhanced)return; form.dataset.enhanced='1';
    if(form.classList.contains('partner-form')){
      var contactElP=form.querySelector('.f-contact');
      if(contactElP && !form.querySelector('.f-ctype')){
        var wrapP=document.createElement('span');
        wrapP.style.cssText='display:inline-flex;align-items:stretch;gap:6px;width:100%;';
        var selP=document.createElement('select');
        selP.className='f-ctype';
        selP.style.cssText='width:60px !important;flex:0 0 60px;text-align:center;padding:10px 26px 10px 10px;background-position:right 8px center;background-size:13px';
        selP.innerHTML='<option value="+">+</option><option value="@">@</option>';
        contactElP.parentNode.insertBefore(wrapP,contactElP);
        wrapP.appendChild(selP);
        wrapP.appendChild(contactElP);
        contactElP.placeholder='995555123456';
        contactElP.style.cssText='width:auto !important;flex:1 1 auto;min-width:0;';
        selP.addEventListener('change',function(){
          contactElP.placeholder=(selP.value==='+')?'995555123456':'username';
          var f=contactElP.closest('.field'); if(f)f.classList.remove('err');
        });
      }
      return;
    }
    var vp=form.closest('.vpage');
    var pageId=vp?vp.id:'';
    var defaultSvc=PAGE_SERVICE_MAP[pageId]||'';
    var svcEl=form.querySelector('.f-service');
    if(svcEl){
      var keepVal=svcEl.value||defaultSvc;
      svcEl.innerHTML=buildServiceOptions(keepVal);
    }else{
      var nameElForSvc=form.querySelector('.f-name');
      var consentElForSvc=form.querySelector('.f-consent');
      if(nameElForSvc && consentElForSvc){
        var svcField=document.createElement('label');
        svcField.className='field';
        var svcLbl=document.createElement('span');
        svcLbl.className='fl';
        svcLbl.innerHTML='Услуга <span>(необязательно)</span>';
        var svcSelect=document.createElement('select');
        svcSelect.className='f-service';
        svcSelect.innerHTML=buildServiceOptions(defaultSvc);
        svcField.appendChild(svcLbl);
        svcField.appendChild(svcSelect);
        var consentLabel=consentElForSvc.closest('.consent')||consentElForSvc;
        consentLabel.parentNode.insertBefore(svcField,consentLabel);
      }
    }
    var msgConsentEl=form.querySelector('.f-consent');
    if(!form.querySelector('.f-msg') && msgConsentEl){
      var msgField=document.createElement('label');
      msgField.className='field';
      var msgLbl=document.createElement('span');
      msgLbl.className='fl';
      msgLbl.innerHTML='Комментарий по вашему кейсу <span>(по желанию)</span>';
      var msgInput=document.createElement('input');
      msgInput.type='text';
      msgInput.className='f-msg';
      msgInput.placeholder='Например: нужен ВНЖ, не знаю с чего начать';
      msgField.appendChild(msgLbl);
      msgField.appendChild(msgInput);
      var msgConsentLabel=msgConsentEl.closest('.consent')||msgConsentEl;
      msgConsentLabel.parentNode.insertBefore(msgField,msgConsentLabel);
    }
    var contactEl=form.querySelector('.f-contact');
    if(contactEl && !form.querySelector('.f-ctype')){
      var wrap=document.createElement('span');
      wrap.style.cssText='display:inline-flex;align-items:stretch;gap:6px;width:100%;';
      var sel=document.createElement('select');
      sel.className='f-ctype';
      sel.setAttribute('aria-label','Тип контакта');
      sel.style.cssText='width:60px !important;flex:0 0 60px;text-align:center;padding:10px 26px 10px 10px;background-position:right 8px center;background-size:13px';
      sel.innerHTML='<option value="+">+</option><option value="@">@</option>';
      contactEl.parentNode.insertBefore(wrap,contactEl);
      wrap.appendChild(sel);
      wrap.appendChild(contactEl);
      contactEl.style.cssText='width:auto !important;flex:1 1 auto;min-width:0;';
      contactEl.placeholder='995555123456';
      sel.addEventListener('change',function(){
        contactEl.placeholder=(sel.value==='+')?'995555123456':'username';
        var f=contactEl.closest('.field'); if(f)f.classList.remove('err');
      });
    }
    var nameEl=form.querySelector('.f-name');
    if(nameEl && !form.querySelector('.f-city')){
      var nameField=nameEl.closest('.field')||nameEl;
      var cityField=document.createElement('label');
      cityField.className='field';
      var citySel=document.createElement('select');
      citySel.className='f-city';
      var cityPlaceholder=document.createElement('option');
      cityPlaceholder.value='';cityPlaceholder.textContent='Выберите город';
      citySel.appendChild(cityPlaceholder);
      CITY_OPTIONS.forEach(function(c){var o=document.createElement('option');o.value=c;o.textContent=c;citySel.appendChild(o);});
      citySel.value='';
      cityField.appendChild(citySel);
      nameField.parentNode.insertBefore(cityField,nameField.nextSibling);
    }
  }
  function pageTitle(form){
    var vp=form.closest('.vpage');
    if(!vp||vp.id==='p-index')return 'Главная';
    var h1=vp.querySelector('h1');
    return h1?h1.textContent.trim():'Главная';
  }
  function setupForm(form){
    enhanceForm(form);
    var nameEl=form.querySelector('.f-name'),
        cityEl=form.querySelector('.f-city'),
        contactEl=form.querySelector('.f-contact'),
        ctypeEl=form.querySelector('.f-ctype'),
        serviceEl=form.querySelector('.f-service'),
        msgEl=form.querySelector('.f-msg'),
        errEl=form.querySelector('.f-err'),
        consentEl=form.querySelector('.f-consent'),
        waBtn=form.querySelector('.f-wa'),
        tgBtn=form.querySelector('.f-tg');
    function val(el){return el?(el.value||'').trim():'';}
    function buildMsg(){
      var name=val(nameEl)||'клиент';
      var city=val(cityEl);
      var page=pageTitle(form);
      var t='Здравствуйте! Меня зовут '+name+(city?(', проживаю в городе '+city):'')+'.';
      t+='\nОставляю заявку со страницы «'+page+'» на сайте documenti.ge';
      var s=val(serviceEl);
      t+=s?(' — нужна помощь с услугой «'+s+'».'):'.';
      var m=val(msgEl); if(m)t+='\nМой кейс: '+m;
      if(form.classList.contains('partner-form')){
        var checkinEl=form.querySelector('.f-checkin'), checkoutEl=form.querySelector('.f-checkout'), guestsEl=form.querySelector('.f-guests');
        if(checkinEl||checkoutEl)t+='\nДаты проживания: '+(val(checkinEl)||'не указано')+' — '+(val(checkoutEl)||'не указано');
        if(guestsEl)t+='\nКол-во проживающих: '+(val(guestsEl)||'не указано');
        var budgetEl=form.querySelector('.f-budget'), formatEl=form.querySelector('.f-format'), vnzhEl=form.querySelector('.f-vnzh');
        if(budgetEl)t+='\nБюджет: '+(val(budgetEl)||'не указан');
        if(formatEl)t+='\nФормат: '+(val(formatEl)||'не указан');
        if(vnzhEl)t+='\nИнтересует ВНЖ: '+(val(vnzhEl)||'не указано');
        var sferaEl=form.querySelector('.f-sfera');
        if(sferaEl)t+='\nСфера деятельности: '+(val(sferaEl)||'не указана');
        var platformEl=form.querySelector('.f-platform'), profileEl=form.querySelector('.f-profile');
        if(platformEl)t+='\nПлатформа: '+(val(platformEl)||'не указана');
        if(profileEl)t+='\nСсылка на профиль: '+(val(profileEl)||'не указана');
      }
      var ctype=ctypeEl?ctypeEl.value:'+';
      var contact=val(contactEl);
      var prefixed=(ctype==='@')?(contact&&contact.charAt(0)!=='@'?('@'+contact):contact):(contact&&contact.charAt(0)!=='+'?('+'+contact):contact);
      t+='\nКонтакт для связи: '+prefixed+'.';
      return t;
    }
    function validateContact(){
      var ctype=ctypeEl?ctypeEl.value:'+';
      var v=val(contactEl);
      var f=contactEl?contactEl.closest('.field'):null;
      if(ctype==='+'){
        if(!/^[0-9]{7,15}$/.test(v)){
          if(f)f.classList.add('err');
          if(errEl)errEl.textContent='Введите номер телефона цифрами, без пробелов';
          return false;
        }
      }else{
        if(!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(v)){
          if(f)f.classList.add('err');
          if(errEl)errEl.textContent='Введите корректный Telegram-юзернейм';
          return false;
        }
      }
      if(f)f.classList.remove('err');
      return true;
    }
    function validate(){
      var ok=true;
      var f=nameEl?nameEl.closest('.field'):null;
      if(nameEl){
        if(!nameEl.value.trim()){if(f)f.classList.add('err');ok=false;}else if(f)f.classList.remove('err');
      }
      if(!validateContact())ok=false;
      var consentLab=consentEl?consentEl.closest('.consent'):null;
      if(consentEl && !consentEl.checked){
        if(consentLab)consentLab.classList.add('err');
        if(errEl)errEl.textContent='Подтвердите согласие на обработку персональных данных.';
        return false;
      }
      if(consentLab)consentLab.classList.remove('err');
      if(ok && errEl)errEl.textContent='';
      else if(!ok && errEl && !errEl.textContent)errEl.textContent='Заполните, пожалуйста, имя и контакт.';
      return ok;
    }
    [nameEl,contactEl].forEach(function(el){
      if(el)el.addEventListener('input',function(){
        var f=el.closest('.field'); if(f)f.classList.remove('err');
      });
    });
    if(consentEl)consentEl.addEventListener('change',function(){
      var lab=consentEl.closest('.consent');
      if(lab && consentEl.checked)lab.classList.remove('err');
    });
    function submitLeadTable(){
      if(!form.classList.contains('partner-form'))return;
      var typeMap={'arenda':'arenda','investicii':'investicii','stat-partnerom':'partner','stat-kreatorom':'kreator'};
      var leadType=typeMap[form.dataset.partner];
      if(!leadType)return;
      var payload={type:leadType,name:val(nameEl),contact:val(contactEl)};
      var d1=form.querySelector('.f-checkin'),d2=form.querySelector('.f-checkout'),g=form.querySelector('.f-guests');
      if(d1)payload['Заезд']=val(d1);
      if(d2)payload['Выселение']=val(d2);
      if(g)payload['Гостей']=val(g);
      var bu=form.querySelector('.f-budget'),fo=form.querySelector('.f-format'),vn=form.querySelector('.f-vnzh');
      if(bu)payload['Бюджет']=val(bu);
      if(fo)payload['Формат']=val(fo);
      if(vn)payload['ВНЖ']=val(vn);
      var sf=form.querySelector('.f-sfera'); if(sf)payload['Сфера']=val(sf);
      var pl=form.querySelector('.f-platform'),pr=form.querySelector('.f-profile');
      if(pl)payload['Платформа']=val(pl);
      if(pr)payload['Профиль']=val(pr);
      var mm=form.querySelector('.f-msg'); if(mm)payload['Комментарий']=val(mm);
      fetch('https://script.google.com/macros/s/AKfycbw_bYectE6-J3D7kuDKLemqqEBxlCndg-T_kdhl3hwPsoB74w_TtcLo7MeYFSuqpA3Raw/exec',{
        method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)
      }).catch(function(){});
    }
    if(waBtn)waBtn.addEventListener('click',function(){
      if(!validate())return;
      window.open('https://wa.me/995591339448?text='+encodeURIComponent(buildMsg()),'_blank');
      toast('Открываем WhatsApp с вашей заявкой…');
      submitLeadTable();
      if(window.gtag)gtag('event','contact_click',{method:'whatsapp',form_type:form.className});
    });
    if(tgBtn)tgBtn.addEventListener('click',function(){
      if(!validate())return;
      window.open('https://t.me/documenti_ge?text='+encodeURIComponent(buildMsg()),'_blank');
      toast('Открываем Telegram с вашей заявкой…');
      submitLeadTable();
      if(window.gtag)gtag('event','contact_click',{method:'telegram',form_type:form.className});
    });
  }
  document.querySelectorAll('.lead-form,.mini-form').forEach(setupForm);

  /* карусель популярных услуг — подсветка описания при наведении */
  var uwDesc=document.getElementById('uwDesc');
  var uwDefaultText=uwDesc?uwDesc.textContent:'';
  document.querySelectorAll('.uw-item').forEach(function(item){
    item.addEventListener('mouseenter',function(){
      if(uwDesc)uwDesc.textContent=item.dataset.desc||uwDefaultText;
    });
    item.addEventListener('mouseleave',function(){
      if(uwDesc)uwDesc.textContent=uwDefaultText;
    });
    item.addEventListener('focus',function(){
      if(uwDesc)uwDesc.textContent=item.dataset.desc||uwDefaultText;
    });
  });

  /* "Оставить заявку" — scroll to the form on the CURRENT page (ids repeat per page, so native anchor jump would always land on the very first one in the document) */
  document.querySelectorAll('a[href="#zayavka"]').forEach(function(a){
    a.addEventListener('click',function(e){
      e.preventDefault();
      var vp=a.closest('.vpage');
      var target=vp?(vp.querySelector('#zayavka')||vp.querySelector('.lead-form')||vp.querySelector('.mini-form')):document.getElementById('zayavka');
      if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });

  /* ===== форма отзыва ===== */
  document.querySelectorAll('.review-form').forEach(function(form){
    var stars=form.querySelector('.rf-stars'), rating=5;
    if(stars){
      var sEls=stars.querySelectorAll('span');
      var paint=function(n){sEls.forEach(function(s,i){s.classList.toggle('on',i<n);});};
      paint(rating);
      sEls.forEach(function(s,i){
        s.addEventListener('click',function(){rating=i+1;stars.dataset.val=rating;paint(rating);});
        s.addEventListener('mouseenter',function(){paint(i+1);});
      });
      stars.addEventListener('mouseleave',function(){paint(rating);});
    }
    var nameEl=form.querySelector('.rf-name'),
        svcEl=form.querySelector('.rf-service'),
        textEl=form.querySelector('.rf-text'),
        errEl=form.querySelector('.rf-err'),
        sendEl=form.querySelector('.rf-send');
    function v(el){return el?(el.value||'').trim():'';}
    [nameEl,textEl].forEach(function(el){
      if(el)el.addEventListener('input',function(){
        var f=el.closest('.field'); if(f)f.classList.remove('err');
      });
    });
    if(sendEl)sendEl.addEventListener('click',function(){
      var ok=true;
      [nameEl,textEl].forEach(function(el){
        if(!el)return; var f=el.closest('.field');
        if(!el.value.trim()){if(f)f.classList.add('err');ok=false;}else if(f)f.classList.remove('err');
      });
      if(!ok){if(errEl)errEl.textContent='Заполните, пожалуйста, имя и текст отзыва.';return;}
      if(errEl)errEl.textContent='';
      sendEl.disabled=true;
      fetch('https://reviews.documenti.ge/api/review',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name:v(nameEl),service:v(svcEl),rating:rating,text:v(textEl)})
      }).then(function(r){return r.json();}).then(function(res){
        sendEl.disabled=false;
        if(res && res.ok){
          toast('Спасибо! Отзыв принят, с вами было приятно иметь дело!');
          form.reset();
          if(window.gtag)gtag('event','review_submit');
        }else{
          if(errEl)errEl.textContent='Не получилось отправить, попробуйте ещё раз.';
        }
      }).catch(function(){
        sendEl.disabled=false;
        if(errEl)errEl.textContent='Не получилось отправить — проверьте связь и попробуйте ещё раз.';
      });
    });
  });
})();

/* отзывы — показать все по кнопке (видно ~10, остальное по клику) */
(function(){
  var grid=document.querySelector('.rv-all');
  if(!grid)return;
  var cards=grid.querySelectorAll('.review');
  var LIMIT=10;
  if(cards.length<=LIMIT)return;
  for(var i=LIMIT;i<cards.length;i++)cards[i].classList.add('rv-collapsed');
  var wrap=document.createElement('div');
  wrap.className='svc-more';
  var btn=document.createElement('button');
  btn.type='button';
  btn.className='btn btn-grad';
  btn.textContent='Показать все отзывы ('+cards.length+')';
  wrap.appendChild(btn);
  grid.parentNode.insertBefore(wrap,grid.nextSibling);
  btn.addEventListener('click',function(){
    for(var i=0;i<cards.length;i++)cards[i].classList.remove('rv-collapsed');
    wrap.parentNode.removeChild(wrap);
  });
})();

/* статьи — сортировка списка */
(function(){
  var bar=document.querySelector('.sort-bar');
  var grid=document.querySelector('.art-grid');
  if(!bar||!grid)return;
  var cards=[].slice.call(grid.querySelectorAll('.art-card'));
  function sortCards(mode){
    var arr=cards.slice();
    if(mode==='new') arr.sort(function(a,b){return b.dataset.date.localeCompare(a.dataset.date);});
    else if(mode==='old') arr.sort(function(a,b){return a.dataset.date.localeCompare(b.dataset.date);});
    else arr.sort(function(a,b){
      var f=(b.dataset.fire|0)-(a.dataset.fire|0);
      return f||b.dataset.date.localeCompare(a.dataset.date);
    });
    arr.forEach(function(c){grid.appendChild(c);});
  }
  bar.addEventListener('click',function(e){
    var btn=e.target.closest('.sort-btn');
    if(!btn)return;
    bar.querySelectorAll('.sort-btn').forEach(function(x){x.classList.remove('active');});
    btn.classList.add('active');
    sortCards(btn.dataset.sort);
  });
})();

(function(){
  var navlinks=document.querySelectorAll('.nav-links a, .m-menu a');
  var path=location.pathname.replace(/\/index\.html$/,'/');
  var file=path==='/'?'':path.replace(/^\//,'');
  var section=file;
  if(file.indexOf('statya-')===0)section='stati.html';
  else if(file.indexOf('usluga-')===0)section='uslugi.html';
  else if(file.indexOf('vnzh')===0)section='vnzh.html';
  else if(file.indexOf('partner')===0)section='partnery.html';
  navlinks.forEach(function(a){
    var href=(a.getAttribute('href')||'').replace(/^\//,'');
    var isActive=(href===''&&section==='')||(href!==''&&href===section);
    a.classList.toggle('active',isActive);
  });
})();