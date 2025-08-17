export interface SiteSubarea {
  id: string;
  name: string;
  dimensions: string;
  area: string;
  height: string;
  volume: string;
  currentStatus: string;
  workRequired: string;
  photos: string[];
}

export interface SiteArea {
  id: string;
  name: string;
  totalArea: string;
  status: string;
  priority: "low" | "medium" | "high";
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
  siteAreas: SiteArea[];
  activityCategories: ActivityCategory[];
  boqItems: BOQItem[];
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
    categoryName: string;
    total: number;
  }[];
  timeline: {
    phase: string;
    duration: string;
  }[];
  terms: string[];
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
    duration: string;
  }[];
}
