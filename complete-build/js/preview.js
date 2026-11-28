
const chapterPreview=document.querySelector('#previewEpisode');
for(const episode of STORY.slice(GUIDE_COUNT)){
 chapterPreview.add(new Option(episode.ep+'화 · '+episode.title,String(episode.ep)));
}
document.querySelector('#previewStart').onclick=async()=>{
 if(!window.__g||UI.cur!=='title')return;
 const e=Number(chapterPreview.value)-1,done={};
 for(const prior of STORY.slice(0,e)){
  for(const scene of prior.scenes){
   if(scene.mission)done[scene.mission.id]=true;
  }
 }
 if(e>=10)done.gardenAwakened=true;
 await startGame(true,{pos:{e,s:0,ph:'pre',li:0},done,
  size:6,pool:POOL3,ui:{small:true},care:true,hub:true,hatched:true,snd:false});
 resumeStory();
};
