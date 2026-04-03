from typing import List  # Import du type List pour le typage statique des listes.
from schemas.agent_schema import (
    AgentStep,
    AgentResponse,
)  # Import des classes de structuration des données.
from services.gemini_service import (
    call_gemini,
)  # Import de la fonction d'interface avec l'IA Gemini.


class TextAnalysisAgent:  # Définition de la classe principale de l'agent d'analyse.
    """Agent d'analyse de texte qui planifie, exécute et observe son travail."""  # Documentation de la classe.

    def __init__(self):  # Constructeur de la classe.
        self.tools = {  # Dictionnaire associant des noms d'outils à leurs méthodes respectives.
            "analyser_sentiment": self._analyser_sentiment,  # Enregistre l'outil d'analyse de sentiment.
            "extraire_themes": self._extraire_themes,  # Enregistre l'outil d'extraction de thèmes.
            "evaluer_complexite": self._evaluer_complexite,  # Enregistre l'outil d'évaluation de complexité.
        }  # Fin du dictionnaire d'outils.

    async def run(  # Méthode asynchrone principale pour lancer l'analyse.
        self,
        text: str,
        task: str = "Analyse complète de ce texte",  # Paramètres : texte à analyser et intitulé de la tâche.
    ) -> AgentResponse:  # Type de retour : objet structuré AgentResponse.
        """Exécute l'agent sur le texte donné."""  # Documentation de la méthode.
        # Planification
        plan = [  # Liste descriptive des étapes théoriques à suivre.
            "Analyser le sentiment du texte",  # Étape 1 définie.
            "Extraire les thèmes principaux",  # Étape 2 définie.
            "Évaluer la complexité du texte",  # Étape 3 définie.
            "Synthétiser les résultats",  # Étape 4 définie.
        ]  # Fin de la liste du plan.

        steps: List[
            AgentStep
        ] = []  # Initialisation de la liste pour stocker l'historique réel des étapes.
        step_number = 1  # Initialisation du compteur d'ordre des étapes.

        # Exécution des étapes
        for (
            tool_name,
            tool_func,
        ) in self.tools.items():  # Boucle sur chaque outil configuré dans __init__.
            try:  # Bloc de gestion d'erreur pour sécuriser l'exécution de l'IA.
                result = await tool_func(text)  # Appel asynchrone de l'outil LLM.
                observation = (  # Création d'un résumé court pour le contexte de synthèse.
                    f"Résultat de {tool_name}: {result[:200]}..."  # Tronquage à 200 caractères pour la lisibilité.
                )  # Fin de l'observation.
                steps.append(  # Ajout d'un objet AgentStep à l'historique.
                    AgentStep(  # Instanciation de l'étape avec ses métadonnées.
                        step_number=step_number,  # Position dans la séquence.
                        step_name=tool_name.replace(
                            "_", " "
                        ).capitalize(),  # Nom formaté pour l'utilisateur.
                        tool_used=tool_name,  # Nom technique de l'outil.
                        result=result,  # Réponse complète de l'IA.
                        observation=observation,  # Résumé de l'action.
                    )  # Fin de l'objet AgentStep.
                )  # Fin de l'ajout.
                step_number += 1  # Incrémentation du compteur.
            except Exception as e:  # Capture de toute erreur durant l'appel.
                steps.append(  # Enregistrement de l'échec dans l'historique des étapes.
                    AgentStep(  # Création d'une étape d'erreur.
                        step_number=step_number,  # Position actuelle.
                        step_name=f"Erreur dans {tool_name}",  # Libellé explicite de l'erreur.
                        tool_used=tool_name,  # Outil concerné par l'échec.
                        result="",  # Aucun résultat produit.
                        observation=f"Erreur: {str(e)}",  # Description de l'exception capturée.
                    )  # Fin de l'objet d'erreur.
                )  # Fin de l'ajout.
                step_number += 1  # Incrémentation du compteur.

        # Synthèse finale
        final_answer = await self._synthetiser_resultats(
            steps, task
        )  # Appel final pour agréger tous les résultats.

        return AgentResponse(  # Retour de l'objet de réponse final structuré.
            task=task,  # Rappel de la tâche demandée.
            plan=plan,  # Liste des intentions initiales.
            steps=steps,  # Liste des exécutions réelles.
            final_answer=final_answer,  # Conclusion générée par la synthèse.
            total_steps=len(steps),  # Nombre total d'étapes traitées.
        )  # Fin du constructeur AgentResponse.

    async def _analyser_sentiment(
        self, text: str
    ) -> str:  # Méthode privée d'analyse de sentiment.
        """Analyse le sentiment du texte."""  # Documentation.
        prompt = f"Analyse le sentiment de ce texte (positif, négatif, neutre) et explique brièvement: {text[:1000]}"  # Préparation de l'instruction LLM (limite 1000 chars).
        return await call_gemini(prompt)  # Appel à l'API Gemini.

    async def _extraire_themes(
        self, text: str
    ) -> str:  # Méthode privée d'extraction thématique.
        """Extrait les thèmes principaux."""  # Documentation.
        prompt = f"Extrait les thèmes principaux de ce texte sous forme de liste: {text[:1000]}"  # Préparation de l'instruction LLM.
        return await call_gemini(prompt)  # Appel à l'API Gemini.

    async def _evaluer_complexite(
        self, text: str
    ) -> str:  # Méthode privée d'évaluation de complexité.
        """Évalue la complexité du texte."""  # Documentation.
        prompt = f"Évalue la complexité linguistique de ce texte (simple, moyenne, complexe) et justifie: {text[:1000]}"  # Préparation de l'instruction LLM.
        return await call_gemini(prompt)  # Appel à l'API Gemini.

    async def _synthetiser_resultats(
        self, steps: List[AgentStep], task: str
    ) -> str:  # Méthode privée de synthèse globale.
        """Synthétise les résultats des étapes."""  # Documentation.
        results_summary = "\n".join(  # Concaténation des observations de chaque étape réussie ou échouée.
            [
                f"- {step.step_name}: {step.observation}" for step in steps
            ]  # Formatage en liste à puces.
        )  # Fin de la jointure.
        prompt = f"Basé sur ces analyses:\n{results_summary}\n\nSynthétise une réponse complète pour la tâche: {task}"  # Prompt de synthèse finale.
        return await call_gemini(
            prompt
        )  # Appel final à l'API Gemini pour la réponse utilisateur.
