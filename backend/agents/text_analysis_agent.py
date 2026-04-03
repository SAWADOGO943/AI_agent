from typing import List
from schemas.agent_schema import AgentStep, AgentResponse
from services.gemini_service import call_gemini


class TextAnalysisAgent:
    """Agent d'analyse de texte qui planifie, exécute et observe son travail."""

    def __init__(self):
        self.tools = {
            "analyser_sentiment": self._analyser_sentiment,
            "extraire_themes": self._extraire_themes,
            "evaluer_complexite": self._evaluer_complexite,
        }

    async def run(
        self, text: str, task: str = "Analyse complète de ce texte"
    ) -> AgentResponse:
        """Exécute l'agent sur le texte donné."""
        # Planification
        plan = [
            "Analyser le sentiment du texte",
            "Extraire les thèmes principaux",
            "Évaluer la complexité du texte",
            "Synthétiser les résultats",
        ]

        steps: List[AgentStep] = []
        step_number = 1

        # Exécution des étapes
        for tool_name, tool_func in self.tools.items():
            try:
                result = await tool_func(text)
                observation = (
                    f"Résultat de {tool_name}: {result[:200]}..."  # Limiter la longueur
                )
                steps.append(
                    AgentStep(
                        step_number=step_number,
                        step_name=tool_name.replace("_", " ").capitalize(),
                        tool_used=tool_name,
                        result=result,
                        observation=observation,
                    )
                )
                step_number += 1
            except Exception as e:
                steps.append(
                    AgentStep(
                        step_number=step_number,
                        step_name=f"Erreur dans {tool_name}",
                        tool_used=tool_name,
                        result="",
                        observation=f"Erreur: {str(e)}",
                    )
                )
                step_number += 1

        # Synthèse finale
        final_answer = await self._synthetiser_resultats(steps, task)

        return AgentResponse(
            task=task,
            plan=plan,
            steps=steps,
            final_answer=final_answer,
            total_steps=len(steps),
        )

    async def _analyser_sentiment(self, text: str) -> str:
        """Analyse le sentiment du texte."""
        prompt = f"Analyse le sentiment de ce texte (positif, négatif, neutre) et explique brièvement: {text[:1000]}"
        return await call_gemini(prompt)

    async def _extraire_themes(self, text: str) -> str:
        """Extrait les thèmes principaux."""
        prompt = f"Extrait les thèmes principaux de ce texte sous forme de liste: {text[:1000]}"
        return await call_gemini(prompt)

    async def _evaluer_complexite(self, text: str) -> str:
        """Évalue la complexité du texte."""
        prompt = f"Évalue la complexité linguistique de ce texte (simple, moyenne, complexe) et justifie: {text[:1000]}"
        return await call_gemini(prompt)

    async def _synthetiser_resultats(self, steps: List[AgentStep], task: str) -> str:
        """Synthétise les résultats des étapes."""
        results_summary = "\n".join(
            [f"- {step.step_name}: {step.observation}" for step in steps]
        )
        prompt = f"Basé sur ces analyses:\n{results_summary}\n\nSynthétise une réponse complète pour la tâche: {task}"
        return await call_gemini(prompt)
