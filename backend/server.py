from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import json
import random
import asyncio
import logging
import uuid
from pathlib import Path
from typing import List, Optional, Annotated, Any
from datetime import datetime, timezone

from pydantic import BaseModel, Field, BeforeValidator, ConfigDict

from questions_data import QUESTIONS

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

COMPANIES = ["ANZ", "Star", "Santos", "RioTinto", "WiseTech"]
COMPANY_LABELS = {
    "ANZ": "ANZ Banking Group",
    "Star": "The Star Entertainment Group",
    "Santos": "Santos Energy",
    "RioTinto": "Rio Tinto",
    "WiseTech": "WiseTech Global",
}


def _obj_id_str(v: Any) -> str:
    return str(v)


PyObjectId = Annotated[str, BeforeValidator(_obj_id_str)]


# ------------------- Models -------------------
class QuizQuestion(BaseModel):
    id: str
    company: str
    category: str
    question: str
    options: List[str]
    correctIndex: int
    explanation: str


class CompanyBreakdown(BaseModel):
    company: str
    correct: int
    total: int


class AttemptCreate(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    score: int
    total: int
    timeSeconds: int
    accuracy: float
    breakdown: List[CompanyBreakdown] = []


class Attempt(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: PyObjectId = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    name: str
    score: int
    total: int
    timeSeconds: int
    accuracy: float
    breakdown: List[CompanyBreakdown] = []
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ------------------- Helpers -------------------
def shuffle_question(q: dict) -> dict:
    """Return a copy with options shuffled and correctIndex recomputed."""
    opts = list(q["options"])
    correct_val = opts[q["correctIndex"]]
    order = list(range(len(opts)))
    random.shuffle(order)
    new_opts = [opts[i] for i in order]
    return {
        "id": q["id"],
        "company": q["company"],
        "category": q["category"],
        "question": q["question"],
        "options": new_opts,
        "correctIndex": new_opts.index(correct_val),
        "explanation": q["explanation"],
    }


# ------------------- Routes -------------------
@api_router.get("/")
async def root():
    return {"message": "Reuters Corporate Intelligence Terminal API"}


@api_router.get("/questions", response_model=List[QuizQuestion])
async def get_questions():
    shuffled = [shuffle_question(q) for q in QUESTIONS]
    random.shuffle(shuffled)
    return shuffled


@api_router.post("/regenerate-questions", response_model=List[QuizQuestion])
async def regenerate_questions():
    """Generate a fresh set of 40 MCQs (8 per company) using the LLM."""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
    except Exception as e:
        logger.error(f"emergentintegrations import failed: {e}")
        raise HTTPException(status_code=500, detail="LLM library unavailable")

    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")

    system_message = (
        "You are a Reuters corporate-intelligence desk editor creating factual, "
        "newsroom-grade multiple-choice quiz questions about major Australian listed companies. "
        "Every question must be factually accurate to publicly reported events up to 2025. "
        "Return STRICT JSON only, no prose, no markdown fences."
    )
    company_brief = {
        "ANZ": "ANZ banking: Big Four, 4th-largest by market cap/mortgage share; segments retail/business/institutional/NZ; CEO Nuno Matos, former CEO Shayne Elliott; 2026 Judo Bank acquisition talks; CET1 12.51%, NIM 1.54%; APRA/AUSTRAC/ASIC regulation.",
        "Star": "The Star Entertainment Group: Australia's 2nd-largest casino operator; The Star Sydney/Gold Coast, Treasury Brisbane; Bell Inquiry A$100m fine & licence loss 2022; AUSTRAC civil proceedings 2022; ex-CEO Matthias Bekier banned 2025; WhiteHawk A$390m loan; Mathieson family largest shareholder; CEO Bruce Mathieson Jr since Dec 2024.",
        "Santos": "Santos oil & gas: Australia's 2nd-largest independent producer; assets Barossa, Pikka Alaska, PNG LNG, Papua LNG; CEO Kevin Gallagher; guidance 99-105 mmboe; Papua LNG FID end-2026 with TotalEnergies & ExxonMobil; Moomba CCS; South Australia 200PJ gas deal.",
        "RioTinto": "Rio Tinto mining: world's largest iron ore producer; commodities iron ore/copper/aluminium/lithium; CEO Simon Trott, CFO Peter Cunningham; copper+aluminium now 56% of profit; Glencore merger talks Jan 2026 ~$207bn; Tomago Aluminium A$2.5bn support; interim dividend $2.11; Quebec low-carbon aluminium.",
        "WiseTech": "WiseTech Global logistics tech: Australia's largest listed tech company; flagship CargoWise; founder Richard White, CEO Zubin Appoo, Chair Raelene Murphy, CFO Jeff Howard; e2open $2.1bn acquisition; ACCC search warrant Aug 2026; ~2,000 AI-related job cuts.",
    }

    def parse_questions(text: str, company: str) -> List[dict]:
        text = text.strip()
        text = re.sub(r"^```(?:json)?", "", text).strip()
        text = re.sub(r"```$", "", text).strip()
        m = re.search(r"\[.*\]", text, re.DOTALL)
        if m:
            text = m.group(0)
        try:
            raw = json.loads(text)
        except Exception:
            return []
        out = []
        for i, item in enumerate(raw):
            try:
                options = item["options"]
                ci = int(item["correctIndex"])
                if len(options) != 4 or not (0 <= ci <= 3):
                    continue
                out.append({
                    "id": f"ai-{company}-{i}-{uuid.uuid4().hex[:6]}",
                    "company": company,
                    "category": str(item.get("category", "General")),
                    "question": str(item["question"]),
                    "options": [str(o) for o in options],
                    "correctIndex": ci,
                    "explanation": str(item.get("explanation", "")),
                })
            except Exception:
                continue
        return out[:8]

    async def gen_for_company(company: str) -> List[dict]:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"regen-{company}-{uuid.uuid4()}",
            system_message=system_message,
        ).with_model("anthropic", "claude-sonnet-4-6")
        prompt = (
            f"Company: {company}. Context: {company_brief[company]}\n\n"
            "Generate EXACTLY 8 multiple-choice questions about this company. "
            "Each object must have: 'category' (short 1-3 word tag), 'question' (string), "
            "'options' (array of EXACTLY 4 distinct strings), 'correctIndex' (integer 0-3), "
            "and 'explanation' (one factual sentence). Vary the correct option position. "
            "Return ONLY a JSON array of 8 objects, no other text."
        )
        try:
            resp = await chat.send_message(UserMessage(text=prompt))
        except Exception as e:
            logger.error(f"LLM call failed for {company}: {e}")
            return []
        return parse_questions(resp if isinstance(resp, str) else str(resp), company)

    results = await asyncio.gather(*[gen_for_company(c) for c in COMPANIES])
    combined: List[dict] = []
    for r in results:
        combined.extend(r)

    if len(combined) < 20:
        raise HTTPException(status_code=502, detail="AI produced too few valid questions")

    random.shuffle(combined)
    return combined


@api_router.get("/leaderboard", response_model=List[Attempt])
async def get_leaderboard():
    docs = await db.attempts.find().sort([("score", -1), ("timeSeconds", 1)]).to_list(100)
    return [Attempt(**d) for d in docs]


@api_router.post("/leaderboard", response_model=Attempt)
async def create_attempt(payload: AttemptCreate):
    attempt = Attempt(**payload.model_dump())
    doc = attempt.model_dump(by_alias=True)
    await db.attempts.insert_one(doc)
    return attempt


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
