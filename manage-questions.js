document.addEventListener('DOMContentLoaded', () => {
    const managementTitle = document.getElementById('management-title');
    const backLink = document.querySelector('.back-link');
    const questionsListElement = document.getElementById('questions-list');
    const modal = document.getElementById('question-modal');
    const modalTitle = document.getElementById('modal-title');
    const questionForm = document.getElementById('question-form');
    const questionIdInput = document.getElementById('question-id');
    const questionTextInput = document.getElementById('question-text-input');
    const answerFields = document.querySelectorAll('.answer-field');
    const answerInputs = document.querySelectorAll('.answer-input');
    const correctRadioButtons = document.querySelectorAll('input[name="correct-answer"]');
    const formError = document.getElementById('form-error');

    let currentManageMode = '4_options'; // Valor por defecto
    let allQuestions = [];

    // --- Lógica para determinar el modo automáticamente ---
    function setModeFromURL() {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode');
        if (mode === '2_options') {
            currentManageMode = '2_options';
        } else {
            currentManageMode = '4_options';
        }
        // Actualizar el título de la página
        managementTitle.textContent = `Gestionar Modo ${currentManageMode === '4_options' ? 'Clásico' : 'Duelo'}`;
        // Actualizar el enlace de vuelta
        backLink.href = `index.html?mode=${currentManageMode}&return=true`;
    }

    function getStorageKey() {
        return currentManageMode === '4_options' ? 'miCuestionarioPreguntas' : 'miCuestionarioPreguntas_2_options';
    }

    function getDefaultQuestions() {
        if (currentManageMode === '4_options') {
            return (typeof questions !== 'undefined' && Array.isArray(questions)) ? questions : [];
        } else {
            return (typeof questions_2_options !== 'undefined' && Array.isArray(questions_2_options)) ? questions_2_options : [];
        }
    }

    function loadQuestions() {
        const storageKey = getStorageKey();
        let loadedQuestions = [];
        try {
            const storedQuestions = localStorage.getItem(storageKey);
            if (storedQuestions && storedQuestions !== '[]') {
                const parsed = JSON.parse(storedQuestions);
                if (Array.isArray(parsed)) {
                    loadedQuestions = parsed;
                }
            }
        } catch (e) {
            console.error(`Error al cargar preguntas de ${storageKey}, usando por defecto:`, e);
        }
        
        if (loadedQuestions.length === 0) {
            loadedQuestions = getDefaultQuestions();
        }
        
        allQuestions = loadedQuestions;
        renderQuestions();
    }

    function saveQuestions() {
        localStorage.setItem(getStorageKey(), JSON.stringify(allQuestions));
    }

    function renderQuestions() {
        questionsListElement.innerHTML = '';
        if (allQuestions.length === 0) {
            questionsListElement.innerHTML = `<p>No hay preguntas para el ${currentManageMode === '4_options' ? 'Modo Clásico' : 'Modo Duelo'}. ¡Añade una para empezar!</p>`;
            return;
        }

        allQuestions.forEach((q, index) => {
            const item = document.createElement('div');
            item.className = 'question-item';
            
            const answersHtml = q.answers.map(a => 
                `<li class="${a.correct ? 'correct' : ''}">${a.text}</li>`
            ).join('');

            item.innerHTML = `
                <h3>${index + 1}. ${q.question}</h3>
                <ul class="answers">${answersHtml}</ul>
                <div class="question-item-actions">
                    <button class="action-btn edit" data-index="${index}">Editar</button>
                    <button class="action-btn delete" data-index="${index}">Eliminar</button>
                </div>
            `;
            questionsListElement.appendChild(item);
        });

        document.querySelectorAll('.edit').forEach(btn => btn.addEventListener('click', handleEdit));
        document.querySelectorAll('.delete').forEach(btn => btn.addEventListener('click', handleDelete));
    }

    function adaptModalForMode() {
        const isClassicMode = currentManageMode === '4_options';
        answerFields.forEach(field => {
            if (field.dataset.mode === '4_options') {
                field.style.display = isClassicMode ? 'flex' : 'none';
                field.querySelector('.answer-input').required = isClassicMode;
            }
        });
    }

    function showModal(mode = 'add', questionIndex = -1) {
        formError.textContent = '';
        questionForm.reset();
        adaptModalForMode();
        
        if (mode === 'edit' && questionIndex !== -1) {
            modalTitle.textContent = 'Editar Pregunta';
            questionIdInput.value = questionIndex;
            
            const q = allQuestions[questionIndex];
            questionTextInput.value = q.question;
            q.answers.forEach((ans, i) => {
                if (answerInputs[i]) {
                    answerInputs[i].value = ans.text;
                    if (ans.correct) {
                        correctRadioButtons[i].checked = true;
                    }
                }
            });
        } else {
            modalTitle.textContent = 'Añadir Nueva Pregunta';
            questionIdInput.value = '-1';
        }
        modal.classList.add('show');
    }

    function hideModal() {
        modal.classList.remove('show');
    }

    function handleEdit(e) {
        const index = parseInt(e.target.dataset.index, 10);
        showModal('edit', index);
    }

    function handleDelete(e) {
        const index = parseInt(e.target.dataset.index, 10);
        if (confirm(`¿Estás seguro de que quieres eliminar la pregunta ${index + 1}?`)) {
            allQuestions.splice(index, 1);
            saveQuestions();
            renderQuestions();
        }
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        formError.textContent = '';

        const questionText = questionTextInput.value.trim();
        const correctIndexEl = document.querySelector('input[name="correct-answer"]:checked');
        
        if (!questionText || !correctIndexEl) {
            formError.textContent = 'El texto de la pregunta es obligatorio y debes seleccionar una respuesta correcta.';
            return;
        }
        const correctIndex = parseInt(correctIndexEl.value, 10);

        const answers = [];
        const numAnswers = currentManageMode === '4_options' ? 4 : 2;

        for (let i = 0; i < numAnswers; i++) {
            const text = answerInputs[i].value.trim();
            if (text === '') {
                formError.textContent = `La respuesta ${String.fromCharCode(65 + i)} no puede estar vacía.`;
                return;
            }
            answers.push({
                text: text,
                correct: i === correctIndex
            });
        }

        const newQuestion = {
            question: questionText,
            answers: answers
        };

        const questionId = parseInt(questionIdInput.value, 10);
        if (questionId !== -1) {
            allQuestions[questionId] = newQuestion;
        } else {
            allQuestions.push(newQuestion);
        }

        saveQuestions();
        renderQuestions();
        hideModal();
    }

    // --- Event Listeners ---
    document.getElementById('add-new-question-btn').addEventListener('click', () => showModal('add'));
    document.getElementById('cancel-btn').addEventListener('click', hideModal);
    questionForm.addEventListener('submit', handleFormSubmit);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    // --- Iniciar todo ---
    setModeFromURL(); // Determinar el modo desde la URL
    loadQuestions(); // Cargar las preguntas correspondientes
});
