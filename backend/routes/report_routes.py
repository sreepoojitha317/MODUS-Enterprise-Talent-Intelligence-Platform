from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from playwright.async_api import async_playwright
from urllib.parse import quote
import os
import uuid


router = APIRouter()


@router.get("/download-report")
async def download_report(
    attempt_id: str,
    user_id: str,
    candidate_name: str = "",
    candidate_email: str = ""
):

    try:

        print("\n====================================")
        print("METI PDF REPORT GENERATION")
        print("====================================")

        print("Attempt ID:", attempt_id)
        print("User ID:", user_id)
        print("Candidate Name:", candidate_name)
        print("Candidate Email:", candidate_email)

        # =====================================================
        # OPEN DEDICATED REPORT PAGE
        # =====================================================

        report_url = (
            "http://localhost:5500/frontend/report.html"
            f"?attempt_id={quote(str(attempt_id), safe='')}"
            f"&user_id={quote(str(user_id), safe='')}"
            f"&candidate_name={quote(str(candidate_name), safe='')}"
            f"&candidate_email={quote(str(candidate_email), safe='')}"
)

        print(
            "Opening report:",
            report_url
        )

        # =====================================================
        # CREATE REPORT DIRECTORY
        # =====================================================

        report_directory = "generated_reports"

        os.makedirs(
            report_directory,
            exist_ok=True
        )

        # =====================================================
        # PDF FILE NAME
        # =====================================================

        pdf_filename = (
            f"meti_report_{uuid.uuid4().hex}.pdf"
        )

        pdf_path = os.path.join(
            report_directory,
            pdf_filename
        )

        # =====================================================
        # PLAYWRIGHT
        # =====================================================

        async with async_playwright() as p:

            browser = await p.chromium.launch(
                headless=True
            )

            page = await browser.new_page(
                viewport={
                    "width": 1440,
                    "height": 1000
                }
            )

            # =================================================
            # LOAD REPORT HTML
            # =================================================

            await page.goto(
                report_url,
                wait_until="networkidle"
            )

            print(
                "Report page loaded."
            )

            # =================================================
            # WAIT FOR DATA + CHARTS
            # =================================================

            await page.wait_for_timeout(
                3000
            )

            print(
                "Report rendering completed."
            )

            # =================================================
            # GENERATE PDF
            # =================================================

            await page.pdf(

                path=pdf_path,

                format="A4",

                print_background=True,

                margin={

                    "top": "15mm",

                    "right": "12mm",

                    "bottom": "15mm",

                    "left": "12mm"

                }

            )

            await browser.close()

        # =====================================================
        # RETURN PDF
        # =====================================================

        print(
            "PDF generated:",
            pdf_path
        )

        return FileResponse(

            path=pdf_path,

            media_type="application/pdf",

            filename="METI_Assessment_Report.pdf"

        )

    except Exception as error:

        print(
            "PDF generation error:",
            error
        )

        raise HTTPException(

            status_code=500,

            detail=str(error)

        )