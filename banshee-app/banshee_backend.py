import os
import json
import re
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env para a memória
load_dotenv()

try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

app = FastAPI(
    title="Banshee API - Analytics & Intelligence Musical",
    description="API para consulta de estatísticas, biografias e músicas em alta com Gemini AI",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MODEL_NAMES = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
MODEL_NAMES = ["gemini-3.8-flash"]


class ArtistQueryRequest(BaseModel):
    artist_name: str = Field(..., example="Linkin Park")
    api_key: Optional[str] = None


class MetricStat(BaseModel):
    label: str
    value: str
    highlight: str


class TrackInfo(BaseModel):
    title: str
    album: str
    year: str
    popularity_score: int


class ArtistAnalyticsResponse(BaseModel):
    artist_name: str
    real_name_or_origin: str
    genres: List[str]
    monthly_listeners_estimate: str
    biography_summary: str
    musical_style_analysis: str
    top_tracks: List[TrackInfo]
    metrics: List[MetricStat]
    similar_artists: List[str]


SYSTEM_PROMPT = """
Você é o motor de inteligência musical do Banshee.
Sua missão é buscar e retornar dados PRECISOS, VERÍDICOS e ATUALIZADOS sobre o artista ou banda informado.

DIRETRIZES DE CONTEÚDO:
1. MÚSICAS EM ALTA REAIS: Traga os maiores sucessos reais do artista.
2. ÁLBUNS E ANOS REAIS: Traga o nome verdadeiro dos álbuns e os anos de lançamento corretos.
3. ESTATÍSTICAS REAIS: Estimativa de ouvintes mensais no Spotify, país e cidade de origem reais.
4. BIOGRAFIA REAL: Resumo biográfico factual em 3 a 4 frases.

Responda EXCLUSIVAMENTE em formato JSON estrito:
{
  "artist_name": "Nome Oficial do Artista",
  "real_name_or_origin": "Origem ou Nome Real",
  "genres": ["Gênero 1", "Gênero 2", "Gênero 3"],
  "monthly_listeners_estimate": "Estimativa real de ouvintes (ex: 42M+)",
  "biography_summary": "Resumo biográfico factual do artista.",
  "musical_style_analysis": "Análise técnica do estilo musical e sonoridade.",
  "top_tracks": [
    {"title": "Música Real 1", "album": "Álbum Real 1", "year": "2000", "popularity_score": 98},
    {"title": "Música Real 2", "album": "Álbum Real 2", "year": "2003", "popularity_score": 95},
    {"title": "Música Real 3", "album": "Álbum Real 3", "year": "2024", "popularity_score": 92}
  ],
  "metrics": [
    {"label": "Ouvintes Mensais", "value": "42M+", "highlight": "Top Global Spotify"},
    {"label": "Plataforma Principal", "value": "YouTube & Spotify", "highlight": "Bilhões de Streams"},
    {"label": "Origem", "value": "Califórnia, EUA", "highlight": "Banda Global"},
    {"label": "Status da Carreira", "value": "Ativo / Turnê", "highlight": "Lançamento Recente"}
  ],
  "similar_artists": ["Artista Similar 1", "Artista Similar 2", "Artista Similar 3"]
}
"""


def clean_json_text(raw_text: str) -> str:
    text = raw_text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\n?", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\n?```$", "", text)
    return text.strip()


@app.get("/")
def home():
    return {"app": "Banshee API", "status": "Online"}


@app.post("/api/artist/search", response_model=ArtistAnalyticsResponse)
async def search_artist(payload: ArtistQueryRequest):
    if not HAS_GENAI:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A biblioteca 'google-generativeai' não está instalada."
        )

    artist_name = payload.artist_name.strip()
    if not artist_name or len(artist_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O nome do artista deve conter pelo menos 2 caracteres."
        )

    # Agora a API busca a chave do payload (front) ou do .env (os.getenv)
    active_key = None
    if payload.api_key and payload.api_key.strip():
        active_key = payload.api_key.strip()
    elif os.getenv("GEMINI_API_KEY"):
        active_key = os.getenv("GEMINI_API_KEY").strip()

    if not active_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Chave da API Gemini não encontrada. Verifique o arquivo .env."
        )

    genai.configure(api_key=active_key)
    user_prompt = f"Pesquise e traga dados atualizados sobre o artista: '{artist_name}'. Siga o formato JSON solicitando."

    last_error = None
    for model_name in MODEL_NAMES:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                f"{SYSTEM_PROMPT}\n\n{user_prompt}",
                generation_config={"response_mime_type": "application/json"}
            )
            cleaned = clean_json_text(response.text)
            return json.loads(cleaned)
        except Exception as e:
            last_error = e

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Erro ao consultar o Gemini: {str(last_error)}"
    )