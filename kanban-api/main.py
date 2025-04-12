import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.init_db import init_db
from app.routers import columns, comments, tags, tasks, users

# Initialize FastAPI app
app = FastAPI(title="Kanban API", description="API for Kanban Board Application")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app's address
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(columns.router, prefix="/api/columns", tags=["columns"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(comments.router, prefix="/api/comments", tags=["comments"])
app.include_router(tags.router, prefix="/api/tags", tags=["tags"])


@app.on_event("startup")
async def startup_event():
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Initialize the database with sample data
    init_db()


@app.get("/")
async def root():
    return {"message": "Welcome to Kanban API"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
