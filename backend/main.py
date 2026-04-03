from contextlib import (
    asynccontextmanager,
)  # Pour gérer le cycle de vie de l'application (start/stop)
from fastapi import (
    FastAPI,
    HTTPException,
)  # Le framework web et la gestion des erreurs HTTP
from fastapi.middleware.cors import (
    CORSMiddleware,
)  # Pour autoriser les requêtes venant d'autres domaines (Frontend)
from dotenv import load_dotenv  # Pour charger les variables secrètes (.env)

# Importation des modèles de données (schemas) et des logiques métiers (services)
from schemas.chat_schema import ChatRequest, ChatResponse
from services.gemini_service import call_gemini

from agents.text_analysis_agent import TextAnalysisAgent
from schemas.agent_schema import AgentRequest, AgentResponse

load_dotenv()  # Initialise le chargement des variables d'environnement

# Déclaration globale de l'agent (sera instancié au démarrage)
text_agent: TextAnalysisAgent = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global text_agent

    print("Démarrage du serveur...")

    text_agent = TextAnalysisAgent()
    print("TextAnalysisAgent prêt")

    yield
    print("Arrêt du serveur")


# Création de l'instance principale de l'API avec ses métadonnées
app = FastAPI(
    title="Chatbot IA + RAG API",
    description="Backend d'un chatbot fullstack avec mémoire documentaire",
    version="2.0.0",
    lifespan=lifespan,  # Lie le cycle de vie défini plus haut
)


# Configuration du CORS pour permettre au Frontend (Localhost ou Vercel) de communiquer avec l'API
# Dans backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5501",
        "http://127.0.0.1:5501",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://agent-frontend-chi.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Point d'entrée de test pour vérifier que l'API répond"""
    return {
        "status": "ok",
        "message": "Chatbot API v2 is running",
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Endpoint pour une discussion simple avec l'IA sans contexte documentaire"""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Le message ne peut pas être vide")
    try:
        # Appel du service Gemini créé précédemment
        gemini_reply = await call_gemini(request.message)
        return ChatResponse(reply=gemini_reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")


# ══════════════════════════════════════════════════════════════════
# ROUTES SEMAINE 13 — Agent IA
# ══════════════════════════════════════════════════════════════════


@app.post("/agent/analyze", response_model=AgentResponse)
async def agent_analyze(request: AgentRequest):
    """
    Lance l'agent d'analyse de texte.
    L'agent planifie, exécute et observe son propre travail.
    Le raisonnement complet est retourné dans la réponse.
    """
    if not text_agent:
        raise HTTPException(status_code=503, detail="Agent non initialisé")

    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Le texte ne peut pas être vide")

    if len(request.text) > 5000:
        raise HTTPException(
            status_code=400, detail="Texte trop long. Maximum 5000 caractères."
        )

    try:
        response = await text_agent.run(request.text, request.task)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur agent: {str(e)}")


@app.get("/agent/status")
async def agent_status():
    """Vérifie si l'agent est prêt et liste ses outils"""
    return {
        "ready": text_agent is not None,
        "agent": "TextAnalysisAgent",
        "tools_available": [
            "analyser_sentiment",
            "extraire_themes",
            "evaluer_complexite",
        ],
    }
