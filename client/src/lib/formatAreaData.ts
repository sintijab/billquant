// Utility to format areaData into a readable text paragraph for reporting or export
// Usage: formatAreaData(areaData: any): string

export function formatAreaData(areaData: any): string {
  if (!areaData) return '';
  const {
    name,
    statusDescription,
    totalArea,
    udm,
    whatToDo,
    quantity,
    floorAttachments = [],
    subareas = []
  } = areaData;

  let text = '';
  text += `Information about the Area: ${name || ''}`;
  if (statusDescription) text += `\nStatus: ${statusDescription}`;
  if (totalArea) text += `\nTotal Area: ${totalArea}`;
  if (udm) text += ` ${udm}`;
  if (whatToDo) text += `\nWhat to do: ${whatToDo}`;
  if (quantity) text += `\nQuantity: ${quantity}`;

  // Floor attachments extracted text
  if (floorAttachments.length > 0) {
    const extracted = floorAttachments
      .map((att: any, i: number) => att.extractedText ? `Attachment ${i + 1} info: ${att.extractedText}` : null)
      .filter(Boolean)
      .join('\n');
    if (extracted) text += `\n${extracted}`;
  }

  // Subareas
  if (subareas.length > 0) {
    text += `\nInformation about Subareas:`;
    subareas.forEach((sub: any, subIdx: number) => {
      text += `\n  ${subIdx + 1}. ${sub.title || 'Untitled Subarea'}`;
      if (sub.items && sub.items.length > 0) {
        sub.items.forEach((item: any, itemIdx: number) => {
          text += `\n    - Item ${itemIdx + 1}:`;
          if (item.dimensions) text += ` Dimensions: ${item.dimensions}`;
          if (item.udm) text += ` ${item.udm}`;
          if (item.quantity) text += `, Quantity: ${item.quantity}`;
          if (item.status) text += `, Status: ${item.status}`;
          if (item.description) text += `, Description: ${item.description}`;
        });
      }
    });
  }

  return text.trim();
}
