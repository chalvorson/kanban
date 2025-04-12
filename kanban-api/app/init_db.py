from datetime import datetime, timedelta

from app.database import SessionLocal
from app.models.models import KanbanColumn, Tag, Task, User


def init_db():
    db = SessionLocal()
    try:
        # Check if we already have data
        if db.query(KanbanColumn).count() > 0:
            print("Database already initialized, skipping...")
            return

        # Create default columns
        columns = [
            KanbanColumn(id="todo", title="To Do", position=0),
            KanbanColumn(id="in-progress", title="In Progress", position=1),
            KanbanColumn(id="review", title="Review", position=2),
            KanbanColumn(id="done", title="Done", position=3),
        ]
        db.add_all(columns)
        db.commit()

        # Create default users
        users = [
            User(name="John Doe", avatar="JD"),
            User(name="Jane Smith", avatar="JS"),
            User(name="Robert Johnson", avatar="RJ"),
            User(name="Emily Davis", avatar="ED"),
            User(name="Michael Wilson", avatar="MW"),
        ]
        db.add_all(users)
        db.commit()

        # Create default tags
        tags = [
            Tag(name="bug"),
            Tag(name="feature"),
            Tag(name="enhancement"),
            Tag(name="documentation"),
            Tag(name="design"),
        ]
        db.add_all(tags)
        db.commit()

        # Create some sample tasks
        now = datetime.utcnow()
        tasks = [
            Task(
                title="Setup project structure",
                description="Create the initial project structure and configuration files",
                start_date=now - timedelta(days=5),
                end_date=now - timedelta(days=2),
                status="done",
                priority="high",
                assignee_id=1,
                time_spent=7200,  # 2 hours
            ),
            Task(
                title="Implement authentication",
                description="Add user authentication and authorization",
                start_date=now - timedelta(days=3),
                end_date=now + timedelta(days=2),
                status="in-progress",
                priority="high",
                assignee_id=2,
            ),
            Task(
                title="Design UI components",
                description="Create reusable UI components for the application",
                start_date=now - timedelta(days=2),
                end_date=now + timedelta(days=5),
                status="in-progress",
                priority="medium",
                assignee_id=4,
            ),
            Task(
                title="Fix navigation bug",
                description="Fix the bug in the navigation menu that causes it to collapse unexpectedly",
                start_date=now,
                end_date=now + timedelta(days=1),
                status="todo",
                priority="high",
                assignee_id=3,
            ),
            Task(
                title="Write API documentation",
                description="Document all API endpoints and their usage",
                start_date=now + timedelta(days=1),
                end_date=now + timedelta(days=7),
                status="todo",
                priority="low",
                assignee_id=5,
            ),
        ]
        db.add_all(tasks)
        db.commit()

        # Add tags to tasks
        tasks[0].tags.append(tags[3])  # documentation
        tasks[1].tags.append(tags[1])  # feature
        tasks[2].tags.append(tags[4])  # design
        tasks[3].tags.append(tags[0])  # bug
        tasks[4].tags.append(tags[3])  # documentation
        db.commit()

        print("Database initialized with default data")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
