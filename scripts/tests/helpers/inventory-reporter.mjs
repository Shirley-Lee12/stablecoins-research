// Real Node runner events establish which test files actually loaded and executed.
export default async function* inventory(events){
 for await(const event of events){
  if(!['test:enqueue','test:pass','test:fail','test:summary'].includes(event.type))continue;
  const d=event.data;yield JSON.stringify({type:event.type,file:d.file,name:d.name,nesting:d.nesting,line:d.line,column:d.column,counts:d.counts,details:d.details?{type:d.details.type,error:d.details.error?.message}:undefined})+'\n';
 }
}
