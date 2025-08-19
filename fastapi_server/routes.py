from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
from uuid import uuid4

app = FastAPI()

# Allow CORS for local dev and deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-memory storage (replace with DB in production) ---
users = {}
projects = {}
site_areas = {}
site_subareas = {}
activity_categories = {}
activities = {}
boq_items = {}

# --- Pydantic models (simplified, based on your schema) ---
class Project(BaseModel):
    id: str
    userId: str
    projectType: str
    clientFirstName: str
    clientSurname: str
    clientPhone: Optional[str]
    clientEmail: str
    siteAddress: str
    digitalSignature: Optional[str]
    generalNotes: Optional[str]
    status: Optional[str] = "setup"

class ProjectCreate(BaseModel):
    projectType: str
    clientFirstName: str
    clientSurname: str
    clientPhone: Optional[str]
    clientEmail: str
    siteAddress: str
    digitalSignature: Optional[str]
    generalNotes: Optional[str]
    status: Optional[str] = "setup"

# --- Project routes ---
@app.post("/api/projects")
def create_project(project: ProjectCreate):
    id = str(uuid4())
    user_id = "demo-user"  # Replace with Clerk user ID after auth integration
    new_project = Project(id=id, userId=user_id, **project.dict())
    projects[id] = new_project
    return new_project

@app.get("/api/projects/{id}")
def get_project(id: str):
    project = projects.get(id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.put("/api/projects/{id}")
def update_project(id: str, updates: dict):
    project = projects.get(id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    updated = project.copy(update=updates)
    projects[id] = updated
    return updated

@app.delete("/api/projects/{id}")
def delete_project(id: str):
    if id in projects:
        del projects[id]
        return {"success": True}
    raise HTTPException(status_code=404, detail="Project not found")

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

# --- Site Area routes ---
class SiteArea(BaseModel):
    id: str
    projectId: str
    name: str
    totalArea: Optional[float]
    status: Optional[str]
    priority: Optional[str]

class SiteAreaCreate(BaseModel):
    projectId: str
    name: str
    totalArea: Optional[float]
    status: Optional[str]
    priority: Optional[str]

@app.post("/api/projects/{projectId}/areas")
def create_site_area(projectId: str, area: SiteAreaCreate):
    id = str(uuid4())
    new_area = SiteArea(id=id, projectId=projectId, **area.dict())
    site_areas[id] = new_area
    return new_area

@app.get("/api/projects/{projectId}/areas")
def get_site_areas(projectId: str):
    return [a for a in site_areas.values() if a.projectId == projectId]

@app.put("/api/areas/{id}")
def update_site_area(id: str, updates: dict):
    area = site_areas.get(id)
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    updated = area.copy(update=updates)
    site_areas[id] = updated
    return updated

@app.delete("/api/areas/{id}")
def delete_site_area(id: str):
    if id in site_areas:
        del site_areas[id]
        return {"success": True}
    raise HTTPException(status_code=404, detail="Area not found")

# --- Site Subarea routes ---
class SiteSubarea(BaseModel):
    id: str
    areaId: str
    name: str
    dimensions: Optional[str]
    area: Optional[float]
    height: Optional[float]
    volume: Optional[float]
    currentStatus: Optional[str]
    workRequired: Optional[str]
    photos: Optional[list] = []

class SiteSubareaCreate(BaseModel):
    areaId: str
    name: str
    dimensions: Optional[str]
    area: Optional[float]
    height: Optional[float]
    volume: Optional[float]
    currentStatus: Optional[str]
    workRequired: Optional[str]
    photos: Optional[list] = []

@app.post("/api/areas/{areaId}/subareas")
def create_site_subarea(areaId: str, subarea: SiteSubareaCreate):
    id = str(uuid4())
    new_subarea = SiteSubarea(id=id, areaId=areaId, **subarea.dict())
    site_subareas[id] = new_subarea
    return new_subarea

@app.get("/api/areas/{areaId}/subareas")
def get_site_subareas(areaId: str):
    return [s for s in site_subareas.values() if s.areaId == areaId]

@app.put("/api/subareas/{id}")
def update_site_subarea(id: str, updates: dict):
    subarea = site_subareas.get(id)
    if not subarea:
        raise HTTPException(status_code=404, detail="Subarea not found")
    updated = subarea.copy(update=updates)
    site_subareas[id] = updated
    return updated

@app.delete("/api/subareas/{id}")
def delete_site_subarea(id: str):
    if id in site_subareas:
        del site_subareas[id]
        return {"success": True}
    raise HTTPException(status_code=404, detail="Subarea not found")

# --- Activity Category routes ---
class ActivityCategory(BaseModel):
    id: str
    projectId: str
    name: str
    icon: Optional[str]
    totalArea: Optional[float]
    totalQuantity: Optional[float]
    unit: Optional[str]

class ActivityCategoryCreate(BaseModel):
    projectId: str
    name: str
    icon: Optional[str]
    totalArea: Optional[float]
    totalQuantity: Optional[float]
    unit: Optional[str]

@app.post("/api/projects/{projectId}/categories")
def create_activity_category(projectId: str, category: ActivityCategoryCreate):
    id = str(uuid4())
    new_category = ActivityCategory(id=id, projectId=projectId, **category.dict())
    activity_categories[id] = new_category
    return new_category

@app.get("/api/projects/{projectId}/categories")
def get_activity_categories(projectId: str):
    return [c for c in activity_categories.values() if c.projectId == projectId]

@app.put("/api/categories/{id}")
def update_activity_category(id: str, updates: dict):
    category = activity_categories.get(id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    updated = category.copy(update=updates)
    activity_categories[id] = updated
    return updated

@app.delete("/api/categories/{id}")
def delete_activity_category(id: str):
    if id in activity_categories:
        del activity_categories[id]
        return {"success": True}
    raise HTTPException(status_code=404, detail="Category not found")

# --- Activity routes ---
class Activity(BaseModel):
    id: str
    categoryId: str
    description: str
    location: Optional[str]
    quantity: float
    unit: str

class ActivityCreate(BaseModel):
    categoryId: str
    description: str
    location: Optional[str]
    quantity: float
    unit: str

@app.post("/api/categories/{categoryId}/activities")
def create_activity(categoryId: str, activity: ActivityCreate):
    id = str(uuid4())
    new_activity = Activity(id=id, categoryId=categoryId, **activity.dict())
    activities[id] = new_activity
    return new_activity

@app.get("/api/categories/{categoryId}/activities")
def get_activities(categoryId: str):
    return [a for a in activities.values() if a.categoryId == categoryId]

@app.delete("/api/activities/{id}")
def delete_activity(id: str):
    if id in activities:
        del activities[id]
        return {"success": True}
    raise HTTPException(status_code=404, detail="Activity not found")

# --- BOQ item routes ---
class BOQItem(BaseModel):
    id: str
    projectId: str
    code: str
    description: str
    length: Optional[float]
    width: Optional[float]
    factor: Optional[float]
    quantity: float
    unit: str
    unitPrice: float
    total: float
    priceSource: Optional[str]

class BOQItemCreate(BaseModel):
    projectId: str
    code: str
    description: str
    length: Optional[float]
    width: Optional[float]
    factor: Optional[float]
    quantity: float
    unit: str
    unitPrice: float
    total: float
    priceSource: Optional[str]

@app.post("/api/projects/{projectId}/boq-items")
def create_boq_item(projectId: str, item: BOQItemCreate):
    id = str(uuid4())
    new_item = BOQItem(id=id, projectId=projectId, **item.dict())
    boq_items[id] = new_item
    return new_item

@app.get("/api/projects/{projectId}/boq-items")
def get_boq_items(projectId: str):
    return [b for b in boq_items.values() if b.projectId == projectId]

@app.put("/api/boq-items/{id}")
def update_boq_item(id: str, updates: dict):
    item = boq_items.get(id)
    if not item:
        raise HTTPException(status_code=404, detail="BOQ item not found")
    updated = item.copy(update=updates)
    boq_items[id] = updated
    return updated

@app.delete("/api/boq-items/{id}")
def delete_boq_item(id: str):
    if id in boq_items:
        del boq_items[id]
        return {"success": True}
    raise HTTPException(status_code=404, detail="BOQ item not found")

# --- User endpoints (optional, for demo) ---
class User(BaseModel):
    id: str
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str

@app.post("/api/users")
def create_user(user: UserCreate):
    id = str(uuid4())
    new_user = User(id=id, **user.dict())
    users[id] = new_user
    return new_user

@app.get("/api/users/{id}")
def get_user(id: str):
    user = users.get(id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/api/users")
def list_users():
    return list(users.values())

@app.put("/api/users/{id}")
def update_user(id: str, updates: dict):
    user = users.get(id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    updated = user.copy(update=updates)
    users[id] = updated
    return updated

@app.delete("/api/users/{id}")
def delete_user(id: str):
    if id in users:
        del users[id]
        return {"success": True}
    raise HTTPException(status_code=404, detail="User not found")

# --- AI analysis endpoints (mock for now) ---
@app.post("/api/ai/analyze-site-visit")
def analyze_site_visit():
    mock_activities = [
        {
            "categoryName": "Demolizioni e Rimozioni",
            "icon": "hammer",
            "activities": [
                {"description": "Rimozione pavimento in legno esistente", "location": "Soggiorno", "quantity": "27.3", "unit": "m²"},
                {"description": "Demolizione cucina esistente", "location": "Cucina", "quantity": "14.0", "unit": "m²"}
            ]
        },
        {
            "categoryName": "Impianti Elettrici",
            "icon": "tools",
            "activities": [
                {"description": "Prese elettriche standard", "location": "Soggiorno", "quantity": "8", "unit": "pz"},
                {"description": "Punti luce a soffitto", "location": "Cucina", "quantity": "4", "unit": "pz"}
            ]
        }
    ]
    return mock_activities

@app.post("/api/ai/generate-boq")
def generate_boq():
    mock_boq_items = [
        {
            "code": "B.02.10.0010.007",
            "description": "Demolizione di fabbricati volumetria ≤ 5000 m³",
            "quantity": "35.0",
            "unit": "m³",
            "unitPrice": "11.87",
            "total": "415.45",
            "priceSource": "PAT 2025"
        },
        {
            "code": "E.02.15.0025.003",
            "description": "Rimozione pavimento in legno esistente",
            "quantity": "27.3",
            "unit": "m²",
            "unitPrice": "8.50",
            "total": "232.05",
            "priceSource": "DEI 2025"
        }
    ]
    return mock_boq_items
