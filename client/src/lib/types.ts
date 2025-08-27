export interface SiteSubareaItem {
  id: string;
  status: string;
  dimensions: string;
  udm: string;
  quantity: string;
  description: string;
  photos: { url: string; fileName?: string }[];
}

export interface SiteSubarea {
  id: string;
  title: string;
  items: SiteSubareaItem[];
}

export interface SiteArea {
  id: string;
  name: string;
  statusDescription: string;
  whatToDo: string;
  totalArea: string;
  floorAttachments: { url: string; name?: string; extractedText?: string }[];
  subareas: SiteSubarea[];
}

export interface Activity {
  id: string;
  description: string;
  location: string;
  quantity: string;
  unit: string;
}

export interface ActivityCategory {
  id: string;
  name: string;
  icon: string;
  totalArea: string;
  activities: Activity[];
}

export interface BOQItem {
  id: string;
  code: string;
  description: string;
  length: string;
  width: string;
  factor: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  total: string;
  priceSource: string;
}

export interface ProjectWizardData {
  projectType: "site_visit" | "upload_boq";
  clientFirstName: string;
  clientSurname: string;
  clientPhone: string;
  clientEmail: string;
  siteAddress: string;
  digitalSignature: string;
  generalNotes: string;
  generalAttachments: { url: string; title: string }[];
  aiConsent: boolean;
  siteAreas: SiteArea[];
  activityCategories: ActivityCategory[];
  boqItems: BOQItem[];
  logo: string;
}

export interface DocumentData {
  client: {
    name: string;
    email: string;
    phone: string;
  };
  project: {
    address: string;
    date: string;
    totalCost: number;
  };
  activities: {
    category: string;
    total: number;
  }[];
  timeline: {
    phase: string;
    duration: string;
  }[];
}

export interface InternalCostData {
  costBreakdown: {
    materials: number;
    labor: number;
    subcontractors: number;
    equipment: number;
    overhead: number;
    profit: number;
  };
  materialsList: {
    item: string;
    quantity: string;
    unitPrice: string;
  }[];
  personnel: {
    role: string;
    duration?: string;
    quantity?: string;
    unit_measure?: string;
  }[];
}
