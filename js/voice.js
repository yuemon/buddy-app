/* Buddy voice guidance: on-device speechSynthesis, spoken only for trouble (after it persists) and key moments, rate-limited. */
(function(root){
'use strict';
var MSG={
 nohead:'I can\u2019t see your head, tilt the phone up',
 frame:'Move into the frame',
 noperson:'Move into the frame',
 stepback:'Step back a little',
 steady:'Hold steady',
 pose:'Hold steady'};
function create(opt){
 opt=opt||{};
 var PERSIST=opt.persist||1500,SAME=opt.same||7000,GAP=opt.gap||2500,KEY='buddyVoice';
 var synth=opt.synth!==undefined?opt.synth:(root.speechSynthesis||null),Utt=opt.Utt||root.SpeechSynthesisUtterance,now=opt.now||function(){return Date.now()};
 var busyTo=-1e9,busyText='',on=true,primed=false,last={},lastAny=-1e9,prob=null,spoken=[];
 try{var sv=root.localStorage&&root.localStorage.getItem(KEY);if(sv==='0')on=false}catch(e){}
 function supported(){return !!(synth&&Utt)}
 function speak(text,t){
  if(!supported())return false;
  try{synth.cancel&&synth.cancel();var u=new Utt(text);u.rate=1.05;u.pitch=1;u.volume=1;if(root.navigator&&navigator.language)u.lang=navigator.language;synth.speak(u)}catch(e){return false}
  busyTo=t+600+text.length*75;busyText=text;spoken.push([t,text]);return true}
 var V={
  supported:supported,
  // true while our own TTS is (probably) talking, plus a short tail, so speech recognition can ignore it
  get speakingText(){return this.speaking?busyText.toLowerCase():''},
  get speaking(){var t=now();try{if(synth&&synth.speaking&&t<busyTo+4000)return true}catch(e){}return t<busyTo},
  get enabled(){return on},
  get log(){return spoken},
  setEnabled:function(b){on=!!b;try{root.localStorage&&root.localStorage.setItem(KEY,on?'1':'0')}catch(e){}if(!on&&synth&&synth.cancel)try{synth.cancel()}catch(e){}return on},
  toggle:function(){return V.setEnabled(!on)},
  prime:function(){ // call from a tap (Start): unlocks speechSynthesis on iOS Safari / Chrome
   if(!supported()||primed)return;primed=true;
   try{var u=new Utt(' ');u.volume=0;synth.speak(u)}catch(e){}},
  // key moments ("Ready, go", "5 reps", "Great set!"): never delayed, rate-limited per message
  say:function(text,o){o=o||{};var t=now();if(!on||!supported())return false;
   if(!o.force&&t-(last[text]||-1e9)<(o.same||SAME))return false;
   last[text]=t;lastAny=t;return speak(text,t)},
  // trouble: pass the counter's issue code every frame ('' when fine). Spoken only after it persists, then at most once per SAME ms
  trouble:function(code){var t=now();
   if(!code||!MSG[code]){prob=null;return false}
   if(!prob||prob.code!==code)prob={code:code,since:t};
   if(t-prob.since<PERSIST)return false;
   var m=MSG[code];if(!on||!supported())return false;
   if(t-(last[m]||-1e9)<SAME||t-lastAny<GAP)return false;
   last[m]=t;lastAny=t;return speak(m,t)},
  clearTrouble:function(){prob=null},
  reset:function(){last={};lastAny=-1e9;prob=null;spoken.length=0}
 };
 return V}
var API={create:create,MSG:MSG};
if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.BVoice=API;
})(typeof window!=='undefined'?window:this);
