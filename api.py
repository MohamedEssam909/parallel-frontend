# run -> # run -> uvicorn api:app --host 0.0.0.0 --port 8000 --reload
# TODO status endpoint

import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import os
import sys
import tempfile
import json
import logging
import traceback
from typing import List, Any, Optional

from fastapi import (
    FastAPI, UploadFile, File, Request, BackgroundTasks, Form, HTTPException
)

from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import status as http_status
from pydantic import BaseModel

# local package imports

# from pipeline.agents.tools.document_parser.config import ParserConfig
# from pipeline.agents.tools.document_parser.docling_parser import Parser
# from pipeline.agents.graph.graph import build_graph
# from pipeline.agents.graph.state import GraphState
# from pipeline.agents.configs.system_config import SYSTEM_CONFIG



def run_full_pipeline(output_json: dict, state: GraphState = None, project_id: str = None):
    print("Starting the pipeline")
    state["parsed_json"] = output_json
    graph = build_graph()
    app = graph.compile()
    print(f"Running pipeline for project {project_id}...\n")
    result_state = app.invoke(state)
    logger.info(f"Pipeline completed successfully for project {project_id}")
    return result_state



# --- Configuration ---
BASE_OUTPUT_DIR = "outputs"
LOG_DIR = "logs"
LOG_FILE_PATH = os.path.join(LOG_DIR, "parser.log")

# Ensure directories exist
os.makedirs(LOG_DIR, exist_ok=True)

# Security / operational settings
ALLOWED_EXTENSIONS = {".pdf", ".docx"}




# --- Logging ---
logger = logging.getLogger("document_parser")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)
formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)

# also add file handler
file_handler = logging.FileHandler(LOG_FILE_PATH)
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

# --- FastAPI app ---
app = FastAPI(title="Docling Parser API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Expose outputs for static download (ensure reverse-proxy doesn't expose unnecessarily)
app.mount("/outputs", StaticFiles(directory=BASE_OUTPUT_DIR), name="outputs")

# --- Pydantic response schemas ---
class ParsedFile(BaseModel):
    filename: str
    project_id: str
    result_path: str
    tables_dir: str
    images_dir: str
    parsed_data: Any

class ParseResponse(BaseModel):
    count: int
    files: List[ParsedFile]


# --- Helpers ---
def _validate_file_extension(filename: str):
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File extension '{ext}' is not supported yet.")


# --- Global exception handler ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception for request %s:\n%s", request.url, "".join(traceback.format_exception_only(type(exc), exc)))
    return JSONResponse(
        status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "internal_server_error", "details": str(exc)},
    )


# --- Health / Status endpoints ---
@app.get("/status")
async def status():
    return {"service": "document_parser", "status": "running", "version": "1.0.0"}


@app.get("/health")
async def health():
    ok = os.path.isdir(BASE_OUTPUT_DIR) and os.access(BASE_OUTPUT_DIR, os.W_OK)
    return {"healthy": ok}





# --- Endpoints ---
@app.post("/parse", response_model=ParseResponse)
async def parse_multiple(
    files: List[UploadFile] = File(...),
    project_id: Optional[str] = Form(None),
    request: Request = None
):
    """
    Parse multiple uploaded documents in one request.
    Accepts:
      - files: list of UploadFile
      - project_id: optional form field to group the files/processing
    Returns:
      - JSON with result URLs and parsed data
    """
    base_url = str(request.base_url).rstrip('/') if request else ""
    results = []

    # --- create project-based folders ---
    project_dir = os.path.join(BASE_OUTPUT_DIR, project_id)
    results_dir = os.path.join(project_dir, "results")
    images_dir = os.path.join(project_dir, "images")
    tables_dir = os.path.join(project_dir, "tables")

    os.makedirs(results_dir, exist_ok=True)
    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(tables_dir, exist_ok=True)
    os.makedirs(LOG_DIR, exist_ok=True)

    for file in files:
        tmp_file = None
        try:
            _validate_file_extension(file.filename)

            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
                content = await file.read()
                tmp.write(content)
                tmp_file = tmp.name


            base_name = os.path.splitext(os.path.basename(file.filename))[0]
            safe_name = base_name.replace(" ", "_")
            output_path = os.path.join(results_dir, f"{safe_name}_parsed.json")

            config = ParserConfig(
                images_path=images_dir,
                tables_path=tables_dir,
                output_path=output_path,
                logs_path=LOG_FILE_PATH,
                generate_images=True,
                save_tables_as_csv=True,
                include_metadata=False,
            )

            parser = Parser(config=config)
            logger.info("Parsing file %s (project_id=%s)...", file.filename, project_id)
            parser.parse(input_path=tmp_file, file_name=file.filename, project_id=project_id)

            with open(output_path, "r", encoding="utf-8") as f:
                parsed_data = json.load(f)

            # Build URLs
            result_url = f"{base_url}/{BASE_OUTPUT_DIR}/{project_id}/results/{safe_name}_parsed.json"
            tables_base_url = f"{base_url}/{BASE_OUTPUT_DIR}/{project_id}/tables/"
            images_base_url = f"{base_url}/{BASE_OUTPUT_DIR}/{project_id}/images/"

            parsed_entry = {
                "filename": file.filename,
                "project_id": project_id,
                "result_path": result_url,
                "tables_dir": tables_base_url,
                "images_dir": images_base_url,
                "parsed_data": parsed_data
            }

            
            state_instance = GraphState(
                raw_doc_path=None,
                parsed_json=None,
                compressed_json=[],
                current_requirement=[],
                mapped_requirements=[]
                )
            
            run_full_pipeline(parsed_entry["parsed_data"], state_instance, project_id)
            results.append(parsed_entry)


        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Failed to parse %s: %s", file.filename, e)
            # include failure info but don't stop other file processing
            results.append({
                "filename": file.filename,
                "project_id": project_id,
                "result_path": "",
                "tables_dir": "",
                "images_dir": "",
                "parsed_data": {"error": str(e)}
            })
        finally:
            if tmp_file and os.path.exists(tmp_file):
                try:
                    os.remove(tmp_file)
                except Exception:
                    logger.debug("Could not remove temporary file %s", tmp_file)

    return {"count": len(results), "files": results}



"""
@app.post("/parse-file")
async def parse_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    project_id: Optional[str] = Form(None),
):

    tmp_file = None
    try:
        _validate_file_extension(file.filename)

        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_file = tmp.name

        _validate_file_size(tmp_file)

        base_name = os.path.splitext(os.path.basename(file.filename))[0]
        safe_name = base_name.replace(" ", "_")
        output_path = os.path.join(RESULTS_DIR, f"{safe_name}_parsed.json")

        config = ParserConfig(
            images_path=IMAGES_DIR,
            tables_path=TABLES_DIR,
            output_path=output_path,
            logs_path=LOG_FILE_PATH,
            generate_images=False,
            save_tables_as_csv=False,
            include_metadata=False
        )
        parser = Parser(config=config)
        logger.info("Parsing file %s (project_id=%s)...", file.filename, project_id)
        parser.parse(input_path=tmp_file, file_name=file.filename)

        with open(output_path, "r", encoding="utf-8") as f:
            parsed_data = json.load(f)

        response_payload = {
            "filename": file.filename,
            "project_id": project_id,
            "result_path": os.path.abspath(output_path),
            "tables_dir": os.path.abspath(TABLES_DIR),
            "images_dir": os.path.abspath(IMAGES_DIR),
            "parsed_data": parsed_data
        }

        
        # Optionally forward in background
        background_tasks.add_task(_forward_to_pipeline, response_payload)
        

        return response_payload

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error parsing file %s: %s", file.filename, e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_file and os.path.exists(tmp_file):
            try:
                os.remove(tmp_file)
            except Exception:
                logger.debug("Could not remove temporary file %s", tmp_file)
"""
