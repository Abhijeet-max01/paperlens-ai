from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    pool_pre_ping=True
)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA synchronous=NORMAL;")
    cursor.execute("PRAGMA foreign_keys=ON;")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from app.db import models  # noqa
    Base.metadata.create_all(bind=engine)

    # Safe lightweight schema migration for SQLite
    with engine.connect() as conn:
        # Check papers columns
        columns_res = conn.exec_driver_sql("PRAGMA table_info(papers);").fetchall()
        existing_cols = {col[1] for col in columns_res}

        if "is_test_document" not in existing_cols:
            conn.exec_driver_sql("ALTER TABLE papers ADD COLUMN is_test_document BOOLEAN DEFAULT 0;")
        if "abstract" not in existing_cols:
            conn.exec_driver_sql("ALTER TABLE papers ADD COLUMN abstract TEXT;")
        if "affiliations" not in existing_cols:
            conn.exec_driver_sql("ALTER TABLE papers ADD COLUMN affiliations TEXT DEFAULT '[]';")
        if "emails" not in existing_cols:
            conn.exec_driver_sql("ALTER TABLE papers ADD COLUMN emails TEXT DEFAULT '[]';")
        if "unextractable_pages" not in existing_cols:
            conn.exec_driver_sql("ALTER TABLE papers ADD COLUMN unextractable_pages TEXT DEFAULT '[]';")
        if "structured_analysis" not in existing_cols:
            conn.exec_driver_sql("ALTER TABLE papers ADD COLUMN structured_analysis TEXT;")

        # Check background_tasks columns
        t_cols_res = conn.exec_driver_sql("PRAGMA table_info(background_tasks);").fetchall()
        t_existing = {col[1] for col in t_cols_res}
        if "stages_json" not in t_existing:
            conn.exec_driver_sql("ALTER TABLE background_tasks ADD COLUMN stages_json TEXT DEFAULT '[]';")

        # Check claims columns
        c_cols_res = conn.exec_driver_sql("PRAGMA table_info(claims);").fetchall()
        c_existing = {col[1] for col in c_cols_res}
        if "normalized_claim" not in c_existing:
            conn.exec_driver_sql("ALTER TABLE claims ADD COLUMN normalized_claim TEXT;")
        if "extraction_method" not in c_existing:
            conn.exec_driver_sql("ALTER TABLE claims ADD COLUMN extraction_method VARCHAR(128) DEFAULT 'spaCy Dependency & Epistemic Parsing';")
        if "is_candidate" not in c_existing:
            conn.exec_driver_sql("ALTER TABLE claims ADD COLUMN is_candidate BOOLEAN DEFAULT 1;")

        # Check claim_pairs columns
        cp_cols_res = conn.exec_driver_sql("PRAGMA table_info(claim_pairs);").fetchall()
        cp_existing = {col[1] for col in cp_cols_res}
        if "scientific_relationship" not in cp_existing:
            conn.exec_driver_sql("ALTER TABLE claim_pairs ADD COLUMN scientific_relationship VARCHAR(64) DEFAULT 'NEUTRAL_OR_INSUFFICIENT_EVIDENCE';")

        # Mark historical test papers as test documents
        conn.exec_driver_sql("""
            UPDATE papers 
            SET is_test_document = 1 
            WHERE title LIKE 'Test%' 
               OR filename IN ('test.pdf', 'corrupted.pdf', 'empty.pdf') 
               OR filename LIKE 'temp_test%';
        """)
        conn.commit()
