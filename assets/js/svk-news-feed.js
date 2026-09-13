/* Redaktionelle Meldungen aus dem freigegebenen GitHub-Repository. */
(async () => {
  const listing = document.querySelector('.news-grid-v1');
  const home = document.getElementById('svk-latest-news');
  const article = document.getElementById('svk-article');
  if (!listing && !home && !article) return;
  const url = 'https://raw.githubusercontent.com/Jg139725/spvgg-kaufbeuren-neu/main/data/editor-news.json?t=' + Date.now();
  let items;
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('News nicht erreichbar');
    items = await response.json();
    if (!Array.isArray(items)) throw new Error('Ungültige Meldungen');
  } catch (error) {
    if (article) article.textContent = 'Diese Meldung ist derzeit nicht verfügbar.';
    return;
  }
  const path = location.pathname.includes('/news/') ? '../' : '';
  const details = item => path + 'news/meldung.html?id=' + encodeURIComponent(item.id);
  const date = value => new Date(value + 'T12:00:00Z').toLocaleDateString('de-DE', {day:'2-digit',month:'2-digit',year:'numeric'});
  const node = (tag, className, value) => {
    const el = document.createElement(tag);if(className)el.className=className;
    if(value)el.textContent=value;return el;
  };
  if (listing) {
    for (const item of [...items].reverse()) {
      const card=node('article','news-card-v1');card.dataset.category=item.category.toLowerCase();
      card.dataset.search=(item.title+' '+item.summary+' '+item.body).toLowerCase();
      if(item.image){const link=node('a','news-card-image');link.href=details(item);const img=node('img');img.src=item.image;img.alt=item.title;img.loading='lazy';link.append(img,node('span','',item.category));card.append(link)}
      const body=node('div','news-card-content');const time=node('time','',date(item.date));time.dateTime=item.date;
      const h=node('h3');const title=node('a','',item.title);title.href=details(item);h.append(title);
      const summary=node('p','',item.summary);const read=node('a','news-read-more','Weiterlesen →');read.href=details(item);
      body.append(time,h,summary,read);card.append(body);listing.prepend(card);
    }
    document.dispatchEvent(new Event('svk:news-updated'));
  }
  if(home){
    for(const item of items.slice(0,3)){
      const card=node('article','news-card');const link=node('a','',item.title);link.href=details(item);
      if(item.image){const imageLink=node('a','news-card__image');imageLink.href=details(item);const img=node('img');img.src=item.image;img.alt=item.title;img.loading='lazy';imageLink.append(img,node('span','category',item.category));card.append(imageLink)}
      const body=node('div','news-card__body');
      const time=node('time','',date(item.date));time.dateTime=item.date;
      body.append(time,node('h3','',item.title),node('p','',item.summary),link);card.append(body);home.append(card);
    }
    if(!items.length){const p=node('p','','Neue Vereinsmeldungen erscheinen hier. Bis dahin findest du Aktuelles auf der bisherigen Vereinsseite.');const a=node('a','','Zu den aktuellen Vereinsmeldungen →');a.href='https://www.spvgg-kaufbeuren.de/';home.append(p,a)}
  }
  if(article){
    const id=new URLSearchParams(location.search).get('id');const item=items.find(x=>x.id===id);
    if(!item){article.textContent='Diese Meldung wurde entfernt oder ist nicht verfügbar.';return}
    document.title=item.title+' | SpVgg Kaufbeuren';
    const back=node('a','','← Alle Meldungen');back.href=path+'news.html';
    const title=node('h1','',item.title);const meta=node('p','',item.category+' · '+date(item.date));
    article.append(back,title,meta);
    if(item.image){const img=node('img');img.src=item.image;img.alt=item.title;img.style.cssText='max-width:100%;max-height:620px;object-fit:contain;border-radius:16px';article.append(img)}
    for(const para of item.body.split(/\n\s*\n/)){if(para.trim())article.append(node('p','',para.trim()))}
  }
})();
