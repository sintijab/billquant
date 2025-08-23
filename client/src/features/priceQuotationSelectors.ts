import { RootState } from "@/store";
import { selectAllTableItems } from "./boqSelectors";

export const selectWorksDescription = (state: RootState) => {
  const works = state.siteWorks?.Works;
  if (!Array.isArray(works) || works.length === 0) return '';
  return works.map((work: any, idx: number) => {
    return [
      `${work.Area || `Area no. ${idx + 1}`}`,
      work.Subarea ? `${work.Subarea}` : '',
      work.Item ? `Item: ${work.Item}` : '',
      work.Work ? `Work: ${work.Work}` : '',
      work.Quantity ? `Quantity: ${work.Quantity}` : '',
      work.Unit ? `Unit: ${work.Unit}` : '',
      work.Timeline ? `Timeline: ${work.Timeline}` : ''
    ].filter(Boolean).join(', ');
  }).join('\n');
};


export const selectSiteVisitDescription = (state: RootState) => {
  const siteAreas = state.siteVisit?.data?.siteAreas;
  if (!siteAreas || siteAreas.length === 0) return '';
  return siteAreas.map((area: any, idx: number) => {
    let areaText = `Area ${idx + 1}: ${area.name}\n`;
    if (area.statusDescription) areaText += `  - Status: ${area.statusDescription}\n`;
    if (area.whatToDo) areaText += `  - Planned Work: ${area.whatToDo}\n`;
    if (area.totalArea) areaText += `  - Total Area: ${area.totalArea} ${area.udm || ''}\n`;
    if (area.quantity) areaText += `  - Quantity: ${area.quantity}\n`;
    if (area.attachmentNote) areaText += `  - Note: ${area.attachmentNote}\n`;
    if (area.floorAttachments && area.floorAttachments.length > 0) {
      areaText += `  - Attachments: ${area.floorAttachments.map((att: any) => att.name || 'Attachment').join(', ')}\n`;
    }
    if (area.subareas && area.subareas.length > 0) {
      area.subareas.forEach((sub: any, subIdx: number) => {
        areaText += `    Subarea ${subIdx + 1}: ${sub.title}\n`;
        if (sub.items && sub.items.length > 0) {
          sub.items.forEach((item: any, itemIdx: number) => {
            areaText += `      - Item ${itemIdx + 1}: ${item.description || ''}`;
            if (item.dimensions) areaText += `, Dimensions: ${item.dimensions}`;
            if (item.quantity) areaText += `, Quantity: ${item.quantity}`;
            if (item.status) areaText += `, Status: ${item.status}`;
            if (item.udm) areaText += `, UDM: ${item.udm}`;
            areaText += '\n';
          });
        }
      });
    }
    return areaText;
  }).join('\n');
};

// Selector to get all PAT items from all categories, formatted as required
export const selectAllPatItemsStructured = (state: RootState) => {
  const result: any[] = [];
  for (const activity in state.boq.categories) {
    const entry = state.boq.categories[activity];
    if (!entry || !Array.isArray(entry.patItems)) continue;
    const mainCategory = entry.mainCategory || '';
    for (const item of entry.patItems) {
      result.push({
        type: 'main',
        activity: activity,
        mainCategory: mainCategory,
        priceSource: 'pat',
        code: item.code || '',
        title: item.title || '',
        unit: item.unit || '',
        quantity: item.quantity || '',
        resources: Array.isArray(item.resources) ? item.resources : [],
        summary: item.summary || ''
      });
    }
  }
  return result;
};
