'use strict';
(function(root){
const months=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
function valid(p){return p&&typeof p.id==='string'&&/^[a-zA-Z0-9-]{1,80}$/.test(p.id)&&typeof p.name==='string'&&p.name.trim().length>0&&p.name.length<=100&&Number.isInteger(p.day)&&Number.isInteger(p.month)&&p.month>=1&&p.month<=12&&p.day>=1&&p.day<=new Date(2000,p.month,0).getDate()&&(p.year==null||(Number.isInteger(p.year)&&p.year>=1&&p.year<=new Date().getFullYear()&&!(p.month===2&&p.day===29&&!(p.year%4===0&&(p.year%100!==0||p.year%400===0)))&&`${String(p.year).padStart(4,'0')}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}`<=`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`));}
function occurrence(p,y){return new Date(y,p.month-1,Math.min(p.day,new Date(y,p.month,0).getDate()));}
function next(p,now=new Date()){const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());let date=occurrence(p,today.getFullYear());if(date<today)date=occurrence(p,today.getFullYear()+1);return date;}
function days(p,now=new Date()){const n=next(p,now);return Math.round((Date.UTC(n.getFullYear(),n.getMonth(),n.getDate())-Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()))/86400000);}
function age(p,now=new Date()){return p.year==null?null:next(p,now).getFullYear()-p.year;}
function ageLabel(n){const last=n%10,lastTwo=n%100;return `${n} ${lastTwo>=11&&lastTwo<=14?'лет':last===1?'год':last>=2&&last<=4?'года':'лет'}`;}
function esc(s){return s.replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');}
function fold(s){let line='',out=[];for(const c of s){if(new TextEncoder().encode(line+c).length>73){out.push(line);line=' '+c;}else line+=c;}out.push(line);return out.join('\r\n');}
// Separate annual events allow the age in each title to change every year.
function ics(records,now=new Date(),separateReminders=true){
  const stamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z');
  const pad=n=>String(n).padStart(2,'0');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Dni Rozhdeniya//RU','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Дни рождения'];
  for(const p of records){
    const firstYear=next(p,now).getFullYear();
    for(let y=firstYear;y<firstYear+20;y++){
      const d=occurrence(p,y);
      const date=`${y}${pad(d.getMonth()+1)}${pad(d.getDate())}`;
      const ageText=p.year==null?'':` — исполнится ${ageLabel(y-p.year)} (${p.year} г. р.)`;
      const title=`День рождения: ${p.name}${ageText}`;
      const description=`Дата рождения: ${p.day} ${months[p.month-1]}${p.year==null?' (год не указан)':' '+p.year+' г.'}.\n${p.year==null?'':`В ${y} году исполнится ${ageLabel(y-p.year)}.\n`}Поздравить с 09:00 до 14:00. Напоминания: 09:00, 11:00, 13:00. Время местное.\nЭкспорт на 20 ближайших дней рождения (${firstYear}–${firstYear+19}). Это копия, не синхронизация.`;
      const slots=separateReminders?[[9,14,'main'],[11,11,'reminder-11'],[13,13,'reminder-13']]:[[9,14,'main']];
      for(const [hour,endHour,slot] of slots){
        const main=slot==='main';
        const summary=main?title:`Поздравить: ${p.name}${ageText}`;
        lines.push('BEGIN:VEVENT',`UID:${p.id}-${y}-${slot}@dni-rozhdeniya.local`,`DTSTAMP:${stamp}`,`DTSTART:${date}T${pad(hour)}0000`,`DTEND:${date}T${pad(endHour)}${main?'00':'05'}00`,`SUMMARY:${esc(summary)}`,`DESCRIPTION:${esc(description)}`,'TRANSP:TRANSPARENT');
        for(const trigger of separateReminders?['PT0S']:['PT0S','PT2H','PT4H']){
          lines.push('BEGIN:VALARM','ACTION:DISPLAY',`TRIGGER;RELATED=START:${trigger}`,`DESCRIPTION:${esc(summary)}`,'END:VALARM');
        }
        lines.push('END:VEVENT');
      }
    }
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n')+'\r\n';
}

const api={valid,next,days,ics,months,age,ageLabel};root.Birthdays=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
