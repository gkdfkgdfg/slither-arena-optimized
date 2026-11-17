(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ArenaLabels=factory()})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 const regular=new Intl.NumberFormat('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2});
 const small=new Intl.NumberFormat('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:6});
 const ratio=new Intl.NumberFormat('ru-RU',{minimumFractionDigits:1,maximumFractionDigits:2});
 const clean=text=>text.replace(/\s/g,' ');
 function amount(value){const n=Number.isFinite(value)?value:0;return clean((Math.abs(n)<1?small:regular).format(Object.is(n,-0)?0:n))}
 function details(value,stake,currency,showCurrency,own,open){
  const profit=value-stake;
  return {amount:amount(value),unit:showCurrency?String(currency):'',multiplier:'×'+clean(ratio.format(stake>0?value/stake:0)),
   profit:own?(profit<-.0000005?'−':'+')+amount(Math.abs(profit)):'',positive:profit>=-.0000005,own,open:!!open};
 }
 return {amount,details};
});
