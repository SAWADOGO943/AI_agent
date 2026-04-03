// Fonction utilitaire pour afficher le chargement
function showLoading(element, message = 'Chargement...') {
    element.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
    element.style.color = '#4299e1';
}

function hideLoading(element) {
    element.style.color = '';
}

// Chat simple
document.getElementById('chat-btn').addEventListener('click', async () => {
    const message = document.getElementById('chat-input').value.trim();
    if (!message) return;

    const responseDiv = document.getElementById('chat-response');
    showLoading(responseDiv, 'Envoi en cours...');

    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        const data = await response.json();
        hideLoading(responseDiv);
        responseDiv.textContent = data.reply || JSON.stringify(data, null, 2);
    } catch (error) {
        hideLoading(responseDiv);
        responseDiv.textContent = `Erreur: ${error.message}`;
        responseDiv.style.color = '#e53e3e';
    }
});

// Analyse par agent
document.getElementById('agent-btn').addEventListener('click', async () => {
    const text = document.getElementById('agent-input').value.trim();
    const task = document.getElementById('agent-task').value.trim() || 'Analyse complète de ce texte';

    if (!text) return;

    const responseDiv = document.getElementById('agent-response');
    showLoading(responseDiv, 'Analyse en cours...');

    try {
        const response = await fetch(`${API_BASE}/agent/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, task }),
        });

        const data = await response.json();
        hideLoading(responseDiv);

        let output = `📋 Tâche: ${data.task}\n\n🗂️ Plan:\n`;
        data.plan.forEach((step, index) => {
            output += `${index + 1}. ${step}\n`;
        });

        output += `\n⚙️ Étapes exécutées:\n`;
        data.steps.forEach(step => {
            output += `Étape ${step.step_number}: ${step.step_name}\n`;
            output += `🔧 Outil: ${step.tool_used}\n`;
            output += `📄 Résultat: ${step.result}\n`;
            output += `👁️ Observation: ${step.observation}\n\n`;
        });

        output += `🎯 Réponse finale: ${data.final_answer}\n`;
        output += `📊 Total étapes: ${data.total_steps}`;

        responseDiv.textContent = output;
    } catch (error) {
        hideLoading(responseDiv);
        responseDiv.textContent = `Erreur: ${error.message}`;
        responseDiv.style.color = '#e53e3e';
    }
});

// Vérifier status
document.getElementById('status-btn').addEventListener('click', async () => {
    const responseDiv = document.getElementById('status-response');
    showLoading(responseDiv, 'Vérification...');

    try {
        const response = await fetch(`${API_BASE}/`);
        const data = await response.json();
        hideLoading(responseDiv);
        responseDiv.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        hideLoading(responseDiv);
        responseDiv.textContent = `Erreur: ${error.message}`;
        responseDiv.style.color = '#e53e3e';
    }
});