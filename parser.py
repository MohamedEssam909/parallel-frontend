import json
from docling.document_converter import DocumentConverter
import os
from docling.datamodel.base_models import DocItemLabel
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.datamodel.base_models import InputFormat

from .handlers import parse_table, parse_image, parse_text

from .logger import setup_logger
from .config import ParserConfig

from dataclasses import dataclass, field




# type-safe and structured section dictionary.
# ensures consistent structure.

Section={
    "section_id": str,
    "document_name": str,
    "section_title": str,
    "section_level": int,
    "section_path": str,
    "headers": list[str],
    "content": str,
    "tables": list[dict] ,
    "figures": list[dict] ,
    "equations": list[dict] ,
    "page_range": tuple[int, int] ,
    "header_metadata": dict 
    }



class Parser:
    """Handles document parsing using docling and section grouping post-processing."""
    def __init__(self, config: ParserConfig):
        self.config = config
        self.logger = setup_logger(log_file=self.config.logs_path)
        self.logger.debug("Detailed debug logs enabled.")
        self.logger.info("Parser initialized with output path: %s", self.config.output_path)
        

       
    def parse(self, input_path, file_name: str, project_id: str):
        self.input_path = input_path
        self.file_name = file_name
        self.project_id= project_id

        self.logger.info(f"Starting parsing for project {self.project_id}, file {self.file_name}")
        self.logger.info("Input file: %s", self.input_path)
        self.logger.info("Loading document...")
        pipeline_options = PdfPipelineOptions()
        pipeline_options.generate_picture_images = True  
        pipeline_options.images_scale = 2                 
    
        converter = DocumentConverter(format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        })
        try:
            self.logger.info("Parsing document...")
            doc = converter.convert(self.input_path).document

        except Exception as e:
            self.logger.exception("Parsing failed for %s: %s", file_name, e)
            raise

        self.logger.info("Grouping sections...")
        sections = self.group_document_by_sections(doc)
        
        self.logger.info(f"Project {self.project_id}: Document grouped into {len(sections)} sections.")
        self.logger.info("Saving to %s...", self.config.output_path)
        with open(self.config.output_path, "w", encoding="utf-8") as f:
            json.dump(sections, f, indent=2, ensure_ascii=False)

        self.logger.info("File Saved %s", self.config.output_path)


        return sections



    def group_document_by_sections(self, doc):
            # derive safe base name from input file
            base_name = os.path.splitext(os.path.basename(self.file_name))[0]
            safe_name = base_name.replace(" ", "_")

            # Detect if file is DOCX or pageless
            input_ext = getattr(self, "input_ext", None)
            disable_page_info = input_ext and input_ext.lower().endswith(".docx")

            sections = []
            current_path = []
            current_pages = []
            current_header_metadata = None
            current_section_level = 0
            section_counter = 1

            # grouped content buffers
            current_text = []
            current_tables = []
            current_figures = []
            current_equations = []

            # check output directories exist
            if self.config.save_tables_as_csv:
                os.makedirs(self.config.tables_path, exist_ok=True)
            if self.config.generate_images:
                os.makedirs(self.config.images_path, exist_ok=True)

            def new_section_id():
                nonlocal section_counter
                sid = section_counter
                section_counter += 1
                return sid
            
            def flush_section():
                """Finalize and store current section."""
                if (
                    current_text
                    or current_tables
                    or current_figures
                    or current_equations
                    or current_header_metadata
                ):
                    section_data = {
                        "section_id": f"SEC_{new_section_id()}",
                        "project_id": self.project_id,
                        "document_name":self.file_name,
                        "section_title": current_path[-1] if current_path else None,
                        "section_level": current_section_level,
                        "section_path": " > ".join(current_path),
                        "headers": current_path.copy(),
                        "content": "\n".join(current_text).strip(),
                        "tables": current_tables.copy(),
                        "figures":current_figures.copy(),
                        "equations": current_equations.copy(),
                        "page_range": (
                            (min(current_pages), max(current_pages))
                            if (current_pages and not disable_page_info)
                            else (None, None)
                        ),
                    }

                    if self.config.include_metadata:
                        section_data["header_metadata"] = current_header_metadata

                    sections.append(section_data) # SECTIONS MUST BE A LIST OF Dicts TO MATCH THE DEFINED Section TYPE
                    print(f"section")
                    self.logger.debug("Flushed section: %s", section_data.get("section_title"))


                # Reset buffers
                current_text.clear()
                current_tables.clear()
                current_figures.clear()
                current_equations.clear()
                current_pages.clear()

            table_counter = 1
            image_counter = 1

            for item, level in doc.iterate_items():
                page_no = None if disable_page_info else (item.prov[0].page_no if item.prov else None)

                # HEADERS 
                if item.label in (DocItemLabel.SECTION_HEADER, DocItemLabel.TITLE):
                    flush_section()

                    if level < len(current_path):
                        current_path = current_path[:level]
                    current_path.append(item.text)
                    current_section_level = level

                    # capture metadata
                    current_header_metadata = {
                        "text": item.text,
                        "label": item.label.value,
                        "self_ref": getattr(item, "self_ref", None),
                        "provenance": None if disable_page_info else [
                            {
                                "page_no": p.page_no,
                                "bbox": [p.bbox.l, p.bbox.t, p.bbox.r, p.bbox.b],
                                "coord_origin": p.bbox.coord_origin.value,
                                "charspan": p.charspan,
                            }
                            for p in item.prov
                        ] if item.prov else None,
                        "level": getattr(item, "level", None),
                    }
                    self.logger.debug("New section header: %s", item.text)


                # TEXT / LIST 
                elif item.label in (
                    DocItemLabel.TEXT,
                    DocItemLabel.LIST_ITEM,
                    DocItemLabel.CAPTION,
                    DocItemLabel.FOOTNOTE,
                ):
                    parse_text(item, page_no, current_text, current_figures, current_pages, logger=self.logger)
                    

                # TABLES 
                elif item.label == DocItemLabel.TABLE:
                    parse_table(item, page_no, safe_name, self.config.tables_path, table_counter, disable_page_info, self.config.save_tables_as_csv, current_tables, current_pages, logger=self.logger)
                    table_counter += 1

            
                # FORMULAS
                elif item.label == DocItemLabel.FORMULA:
                    formula_text = getattr(item, "orig", "").strip()
                    current_equations.append({
                        "text": formula_text,
                    })
                    if page_no is not None:
                        current_pages.append(page_no)


                # FIGURES (PICTURES)
                elif item.label == DocItemLabel.PICTURE and self.config.generate_images:
                    parse_image(item, page_no, safe_name, image_counter, self.config.images_path, self.config.generate_images, current_figures, current_pages, logger=self.logger)
                    image_counter += 1

                
                # FALLBACK
                elif hasattr(item, "text") and item.text.strip():
                    current_text.append(item.text.strip())
                    if page_no is not None:
                        current_pages.append(page_no)

            flush_section()
            self.logger.info("Document grouped into %d sections.", len(sections))
            return sections
    

    
    

            
