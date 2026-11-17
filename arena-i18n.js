/* Only the round UI is translated; the lobby and its galleries stay in Russian. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ArenaI18n=factory()})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 const messages={
  ru:{
   showMultipliers:'Показывать множители',lootPlain:'ДОБЫЧА',comboPlain:'КОМБО',target:'ЦЕЛЬ',pause:'Пауза',paused:'Раунд приостановлен',effects:'Эффекты',on:'ВКЛ',off:'ВЫКЛ',resume:'Продолжить',leave:'Завершить без сохранения добычи',
   returnMenu:'Вернуться в меню',died:'ВЫ ПОГИБЛИ',again:'Играть ещё',home:'В меню',
   deathInfo:'Добыча осталась на арене. Время: {time} · Убрано: {kills}. Баланс: {balance}',
   controls:'Мышь / палец — поворот · Space — ускорение · Esc — пауза · Q — забрать при {multiplier}',
   cashoutHint:'Забрать: Q или зелёная граница',exitNeed:'Для выхода нужно {multiplier}',exitOpen:'Выход открыт',targetValue:'Цель {amount}',
   lootProgress:'Прогресс суммы',leaderboard:'Лидерборд',minimap:'Миникарта',map:'КАРТА',arena:'Игровая арена со змейками',sound:'Переключить звук',length:'ДЛИНА',kills:'УБРАНО',
   loot:'ДОБЫЧА ×{multiplier}',combo:'КОМБО ×{count}',cutOff:'ПОДРЕЗАЛ!',anotherRival:'ЕЩЁ ОДИН СОПЕРНИК',collectLoot:'СОБИРАЙ ДОБЫЧУ',
   exitBanner:'ВЫХОД ОТКРЫТ',boundaryHint:'ДОБЕРИСЬ ДО ЗЕЛЁНОЙ ГРАНИЦЫ',newStage:'НОВЫЙ УРОВЕНЬ ДОБЫЧИ'
  },
  cs:{
   showMultipliers:'Zobrazit násobiče',lootPlain:'KOŘIST',comboPlain:'KOMBO',target:'CÍL',pause:'Pauza',paused:'Hra je pozastavena',effects:'Efekty',on:'ZAP',off:'VYP',resume:'Pokračovat',leave:'Ukončit bez vyzvednutí kořisti',
   returnMenu:'Zpět do menu',died:'KONEC HRY',again:'Hrát znovu',home:'Do menu',
   deathInfo:'Kořist zůstala v aréně. Čas: {time} · Vyřazení: {kills}. Zůstatek: {balance}',
   controls:'Myš / dotyk — zatáčení · Space — zrychlení · Esc — pauza · Q — vyzvednutí při {multiplier}',
   cashoutHint:'Vyzvednout: Q nebo zelená hranice',exitNeed:'Pro odchod potřebuješ {multiplier}',exitOpen:'Odchod je otevřen',targetValue:'Cíl {amount}',
   lootProgress:'Postup ke kořisti',leaderboard:'Žebříček',minimap:'Minimapa',map:'MAPA',arena:'Herní aréna s hady',sound:'Přepnout zvuk',length:'DÉLKA',kills:'VYŘAZENÍ',
   loot:'KOŘIST ×{multiplier}',combo:'KOMBO ×{count}',cutOff:'MÁŠ HO!',anotherRival:'DALŠÍ SOUPEŘ',collectLoot:'SBÍREJ KOŘIST',
   exitBanner:'ODCHOD OTEVŘEN',boundaryHint:'DOJEĎ K ZELENÉ HRANICI',newStage:'NOVÁ ÚROVEŇ KOŘISTI'
  },
  sr:{
   showMultipliers:'Prikaži množitelje',lootPlain:'PLEN',comboPlain:'KOMBO',target:'CILJ',pause:'Pauza',paused:'Igra je pauzirana',effects:'Efekti',on:'UKLJ',off:'ISKLJ',resume:'Nastavi',leave:'Završi bez preuzimanja plena',
   returnMenu:'Vrati se u meni',died:'KRAJ IGRE',again:'Igraj ponovo',home:'U meni',
   deathInfo:'Plen je ostao u areni. Vreme: {time} · Eliminacije: {kills}. Stanje: {balance}',
   controls:'Miš / dodir — skretanje · Space — ubrzanje · Esc — pauza · Q — preuzmi na {multiplier}',
   cashoutHint:'Preuzmi: Q ili zelena granica',exitNeed:'Za izlazak je potrebno {multiplier}',exitOpen:'Izlaz je otvoren',targetValue:'Cilj {amount}',
   lootProgress:'Napredak plena',leaderboard:'Rang-lista',minimap:'Mini-mapa',map:'MAPA',arena:'Arena sa zmijama',sound:'Uključi ili isključi zvuk',length:'DUŽINA',kills:'ELIMINACIJE',
   loot:'PLEN ×{multiplier}',combo:'KOMBO ×{count}',cutOff:'PRESEKAO SI GA!',anotherRival:'JOŠ JEDAN PROTIVNIK',collectLoot:'SAKUPI PLEN',
   exitBanner:'IZLAZ OTVOREN',boundaryHint:'STIGNI DO ZELENE GRANICE',newStage:'NOVI NIVO PLENA'
  },
  it:{
   showMultipliers:'Mostra moltiplicatori',lootPlain:'BOTTINO',comboPlain:'COMBO',target:'OBIETTIVO',pause:'Pausa',paused:'Partita in pausa',effects:'Effetti',on:'SÌ',off:'NO',resume:'Continua',leave:'Esci senza riscuotere il bottino',
   returnMenu:'Torna al menu',died:'SEI MORTO',again:'Gioca ancora',home:'Menu',
   deathInfo:'Il bottino è rimasto in arena. Tempo: {time} · Eliminati: {kills}. Saldo: {balance}',
   controls:'Mouse / tocco — sterza · Space — accelera · Esc — pausa · Q — riscuoti a {multiplier}',
   cashoutHint:'Riscuoti: Q o confine verde',exitNeed:'Per uscire serve {multiplier}',exitOpen:'Uscita aperta',targetValue:'Obiettivo {amount}',
   lootProgress:'Avanzamento del bottino',leaderboard:'Classifica',minimap:'Minimappa',map:'MAPPA',arena:'Arena dei serpenti',sound:'Attiva o disattiva audio',length:'LUNGHEZZA',kills:'ELIMINATI',
   loot:'BOTTINO ×{multiplier}',combo:'COMBO ×{count}',cutOff:'PRESO!',anotherRival:'UN ALTRO AVVERSARIO',collectLoot:'RACCOGLI IL BOTTINO',
   exitBanner:'USCITA APERTA',boundaryHint:'RAGGIUNGI IL CONFINE VERDE',newStage:'NUOVO LIVELLO DI BOTTINO'
  },
  en:{
   showMultipliers:'Show multipliers',lootPlain:'LOOT',comboPlain:'COMBO',target:'TARGET',pause:'Pause',paused:'Round paused',effects:'Effects',on:'ON',off:'OFF',resume:'Resume',leave:'Leave without collecting loot',
   returnMenu:'Return to menu',died:'YOU DIED',again:'Play again',home:'Menu',
   deathInfo:'Your loot stayed in the arena. Time: {time} · Kills: {kills}. Balance: {balance}',
   controls:'Mouse / touch — steer · Space — boost · Esc — pause · Q — cash out at {multiplier}',
   cashoutHint:'Cash out: Q or the green boundary',exitNeed:'Reach {multiplier} to cash out',exitOpen:'Exit open',targetValue:'Target {amount}',
   lootProgress:'Loot progress',leaderboard:'Leaderboard',minimap:'Minimap',map:'MAP',arena:'Snake game arena',sound:'Toggle sound',length:'LENGTH',kills:'KILLS',
   loot:'LOOT ×{multiplier}',combo:'COMBO ×{count}',cutOff:'CUT OFF!',anotherRival:'ANOTHER RIVAL',collectLoot:'COLLECT THE LOOT',
   exitBanner:'EXIT OPEN',boundaryHint:'REACH THE GREEN BOUNDARY',newStage:'NEW LOOT MILESTONE'
  }
 };
 const languages=Object.freeze(Object.keys(messages)),keys=Object.freeze(Object.keys(messages.ru));
 function normalize(value){const code=String(value||'ru').trim().toLowerCase().split(/[-_]/)[0];return code==='cz'?'cs':languages.includes(code)?code:'ru'}
 function create(initial){
  let language=normalize(initial);
  const t=(key,values={})=>(messages[language][key]??messages.ru[key]??key).replace(/\{(\w+)\}/g,(match,name)=>Object.prototype.hasOwnProperty.call(values,name)?String(values[name]):match);
  return {t,setLanguage(value){language=normalize(value);return language},get language(){return language}};
 }
 return {languages,keys,normalize,create};
});
