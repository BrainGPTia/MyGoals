document.addEventListener('DOMContentLoaded', () => {
    
    // ========================================================== //
    // 1. SÉLECTION DES ÉLÉMENTS DU DOM
    // ========================================================== //
    
    // Global & Navigation
    const body = document.body;
    const homeButton = document.getElementById('home-button');
    const faqButton = document.getElementById('faq-button');
    const focusPage = document.getElementById('focus-page');
    const faqPage = document.getElementById('faq-page');

    // Audio Controls
    const audio = document.getElementById('background-audio');
    const audioToggleButton = document.getElementById('audio-toggle-button');
    const nextTrackButton = document.getElementById('next-track-button');
    const currentTrackInfo = document.getElementById('current-track-info');
    const volumeSlider = document.getElementById('volume-slider');

    // Modale & Paramètres
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModalButton = document.querySelector('.close-modal-button');
    const settingsButton = document.getElementById('settings-button');
    const themeSwitch = document.getElementById('theme-switch');
    const animationSwitch = document.getElementById('animation-switch');

    // Focus Tools
    const quoteElement = document.getElementById('motivational-quote');
    const changeQuoteButton = document.getElementById('change-quote-button');
    const dailyGoalInput = document.getElementById('daily-goal');
    const saveGoalButton = document.getElementById('save-goal-button');
    const newTodoInput = document.getElementById('new-todo');
    const addTodoButton = document.getElementById('add-todo-button');
    const todoListElement = document.getElementById('todo-list');
    const todoCountElement = document.getElementById('todo-count');
    const timerDisplay = document.getElementById('timer-display');
    const startTimerButton = document.getElementById('start-timer');
    const resetTimerButton = document.getElementById('reset-timer');
    const timerStatus = document.getElementById('timer-status');
    const sessionCountElement = document.getElementById('session-count');
    
    // Pomodoro Durations (dans la carte Pomodoro)
    const workDurationInline = document.getElementById('work-duration-inline');
    const breakDurationInline = document.getElementById('break-duration-inline');
    
    // Canvas & Drawing Tools
    const canvas = document.getElementById('drawing-canvas');
    const clearCanvasButton = document.getElementById('clear-canvas');
    const toolPencilButton = document.getElementById('tool-pencil');
    const toolEraserButton = document.getElementById('tool-eraser');
    const colorPicker = document.getElementById('color-picker');
    const brushSize = document.getElementById('brush-size');
    const brushSizeValue = document.getElementById('brush-size-value');

    // ========================================================== //
    // 2. GESTION DES DONNÉES LOCALES
    // ========================================================== //
    
    const loadState = (key, defaultValue) => {
        try {
            const stored = localStorage.getItem(key);
            if (stored === null) return defaultValue;
            return JSON.parse(stored);
        } catch (error) {
            console.warn(`Erreur lors du chargement de ${key}:`, error);
            return defaultValue;
        }
    };

    const saveState = (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Erreur lors de la sauvegarde de ${key}:`, error);
        }
    };

    // ========================================================== //
    // 3. GESTION DE LA PLAYLIST & AUDIO
    // ========================================================== //
    
    const playlist = [
        { title: "Calm Focus (Ambiant)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" }, 
        { title: "Deep Ambient (Concentration)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" }, 
        { title: "Zen Loop (Minimaliste)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
        { title: "Synthwave Rêveur", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
        { title: "Flow State", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" }
    ];
    
    let currentTrackIndex = loadState('currentTrackIndex', 0);

    const loadTrack = (index) => {
        if (index < 0 || index >= playlist.length) {
            index = 0;
        }
        audio.src = playlist[index].url;
        audio.load();
        currentTrackIndex = index;
        saveState('currentTrackIndex', index);
        updateAudioButtonState();
    };
    
    const updateAudioButtonState = () => {
        const icon = audio.paused ? 'play' : 'pause';
        audioToggleButton.innerHTML = `<i class="fas fa-${icon}"></i>`;
        currentTrackInfo.textContent = playlist[currentTrackIndex].title;
    };

    const toggleAudio = () => {
        if (audio.paused) {
            audio.play().catch(error => {
                console.error("Erreur de lecture:", error);
                alert("Le navigateur a bloqué la lecture automatique. Veuillez cliquer à nouveau.");
            });
        } else {
            audio.pause();
        }
    };

    const playNextTrack = () => {
        const wasPlaying = !audio.paused;
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        loadTrack(currentTrackIndex);
        if (wasPlaying) {
            audio.play().catch(error => {
                console.error("Erreur lors du changement de piste:", error);
            });
        }
    };

    // Initialisation du volume
    const initialVolume = loadState('audioVolume', 0.5);
    audio.volume = Math.min(Math.max(initialVolume, 0), 1);
    
    if (volumeSlider) {
        volumeSlider.value = initialVolume;
        volumeSlider.addEventListener('input', () => {
            const volume = parseFloat(volumeSlider.value);
            audio.volume = volume;
            saveState('audioVolume', volume);
        });
    }

    // Event Listeners Audio
    audioToggleButton.addEventListener('click', toggleAudio);
    nextTrackButton.addEventListener('click', playNextTrack);
    audio.addEventListener('ended', playNextTrack);
    audio.addEventListener('play', updateAudioButtonState);
    audio.addEventListener('pause', updateAudioButtonState);

    loadTrack(currentTrackIndex);

    // ========================================================== //
    // 4. GESTION DE LA NAVIGATION (SPA)
    // ========================================================== //

    const navigateTo = (targetPageElement, sourceButton) => {
        document.querySelectorAll('.page-section').forEach(page => {
            page.classList.remove('visible-page-section');
            page.classList.add('hidden-page-section');
        });

        targetPageElement.classList.remove('hidden-page-section');
        targetPageElement.classList.add('visible-page-section');

        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.classList.remove('active-nav-button');
        });
        
        if (sourceButton) {
            sourceButton.classList.add('active-nav-button');
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    homeButton.addEventListener('click', () => navigateTo(focusPage, homeButton));
    faqButton.addEventListener('click', () => navigateTo(faqPage, faqButton));

    // ========================================================== //
    // 5. GESTION DES MODALES ET PARAMÈTRES
    // ========================================================== //

    const openModal = () => {
        modalOverlay.classList.remove('hidden-modal');
        body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        modalOverlay.classList.add('hidden-modal');
        body.style.overflow = '';
    };
    
    settingsButton.addEventListener('click', openModal);
    closeModalButton.addEventListener('click', closeModal);
    
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // Gestion du Thème
    const currentTheme = loadState('theme', 'light');
    if (currentTheme === 'dark') {
        body.classList.add('dark-mode');
        if (themeSwitch) themeSwitch.checked = true;
    }

    if (themeSwitch) {
        themeSwitch.addEventListener('change', () => {
            const isDark = themeSwitch.checked;
            if (isDark) {
                body.classList.add('dark-mode');
            } else {
                body.classList.remove('dark-mode');
            }
            saveState('theme', isDark ? 'dark' : 'light');
            if (canvas) setupCanvas();
        });
    }

    // Gestion des Animations
    const toggleAnimations = (enable) => {
        const value = enable ? '0.25s' : '0s';
        document.documentElement.style.setProperty('--transition-speed', value);
        saveState('animationsEnabled', enable);
    };
    
    const animationsEnabled = loadState('animationsEnabled', true);
    if (animationSwitch) {
        animationSwitch.checked = animationsEnabled;
        toggleAnimations(animationsEnabled);
        animationSwitch.addEventListener('change', () => {
            toggleAnimations(animationSwitch.checked);
        });
    }

    // ========================================================== //
    // 6. GESTION DU CONTENU (FAQ, Citation, Objectif)
    // ========================================================== //
    
    // FAQ
    const faqData = [
        {
            question: "Qui a créé ce site ?",
            answer: "Ce site a été conçu par un développeur visant à créer un espace de travail numérique sans distraction, se concentrant uniquement sur l'efficacité des méthodes éprouvées (Pomodoro, To-Do minimaliste)."
        },
        {
            question: "Pourquoi ces fonctionnalités limitées ?",
            answer: "C'est un choix délibéré pour éviter la surcharge cognitive. Chaque outil sert un but précis : le Minuteur gère le temps, la To-Do gère l'organisation minimale, et la Zone de dessin permet la détente active ou le 'doodling' sans basculer sur une autre application."
        },
        {
            question: "La musique est-elle vraiment libre de droits ?",
            answer: "Les pistes utilisées sont des URLs de démonstration provenant de sources libres de droits (SoundHelix). Dans une version finale, ces pistes seraient remplacées par des musiques ambient et lo-fi spécifiquement sélectionnées pour la concentration et le relaxement."
        },
        {
            question: "Où sont stockées mes données ?",
            answer: "Toutes les données (Objectif, To-Do, Thème, Durées Pomodoro) sont stockées exclusivement dans le <strong>localStorage</strong> de votre navigateur. Elles ne quittent jamais votre appareil, garantissant la confidentialité et l'accès instantané."
        }
    ];

    const renderFAQ = () => {
        const container = faqPage.querySelector('#faq-content');
        if (!container) return;
        
        container.innerHTML = `
            <div class="faq-introduction">
                <h2><i class="fas fa-question-circle"></i> Pourquoi Focus & Zen ?</h2>
                <p>Cette section détaille la philosophie et les choix de conception derrière Focus & Zen.</p>
            </div>
        `;
        
        faqData.forEach(item => {
            const section = document.createElement('div');
            section.style.marginBottom = '30px';
            
            const question = document.createElement('h3');
            question.innerHTML = `Q: ${item.question}`;
            
            const answer = document.createElement('p');
            answer.innerHTML = `R: ${item.answer}`;
            
            section.appendChild(question);
            section.appendChild(answer);
            container.appendChild(section);
        });
    };
    
    renderFAQ();
    
    // Citations
    const quotes = [
        "La simplicité est la sophistication suprême. - Leonardo da Vinci",
        "Ne remettez jamais à demain ce que vous pouvez faire après-demain. - Mark Twain",
        "Le secret pour avancer est de commencer. - Mark Twain",
        "Concentrez toute votre énergie sur la tâche que vous avez à accomplir. - Bouddha",
        "Un petit pas vaut mieux qu'une longue méditation. - Proverbe tibétain",
        "La perfection est atteinte non pas lorsqu'il n'y a plus rien à ajouter, mais lorsqu'il n'y a plus rien à retirer. - Antoine de Saint-Exupéry",
        "Ce qui compte, ce n'est pas le nombre d'heures que vous mettez dans votre travail, c'est le travail que vous mettez dans vos heures. - Sam Ewing"
    ];

    const displayRandomQuote = () => {
        if (quoteElement) {
            const randomIndex = Math.floor(Math.random() * quotes.length);
            quoteElement.textContent = quotes[randomIndex];
        }
    };

    displayRandomQuote();
    
    if (changeQuoteButton) {
        changeQuoteButton.addEventListener('click', displayRandomQuote);
    }
    
    if (quoteElement) {
        quoteElement.style.cursor = 'pointer';
        quoteElement.addEventListener('click', displayRandomQuote);
    }

    // Objectif - Apparition du bouton UNIQUEMENT si modification
    let originalGoalValue = loadState('dailyGoal', '');
    
    const saveGoal = () => {
        if (!dailyGoalInput || !saveGoalButton) return;
        
        const goalValue = dailyGoalInput.value.trim();
        saveState('dailyGoal', goalValue);
        originalGoalValue = goalValue; // Met à jour la valeur originale
        
        saveGoalButton.classList.add('confirm-save-animation');
        saveGoalButton.innerHTML = `<i class="fas fa-check"></i> Enregistré !`;
        
        setTimeout(() => {
            saveGoalButton.classList.add('hidden-goal-button');
            saveGoalButton.innerHTML = `<i class="fas fa-save"></i> Enregistrer`;
            saveGoalButton.classList.remove('confirm-save-animation');
        }, 800);
    };
    
    const checkGoalInput = () => {
        if (!dailyGoalInput || !saveGoalButton) return;
        
        const currentValue = dailyGoalInput.value.trim();
        
        // Le bouton apparaît SEULEMENT si la valeur a changé par rapport à la valeur sauvegardée
        if (currentValue !== originalGoalValue) {
            saveGoalButton.classList.remove('hidden-goal-button');
        } else {
            saveGoalButton.classList.add('hidden-goal-button');
        }
    };
    
    if (dailyGoalInput) {
        dailyGoalInput.value = originalGoalValue;
        // Le bouton est caché au démarrage
        saveGoalButton.classList.add('hidden-goal-button');
        dailyGoalInput.addEventListener('input', checkGoalInput);
    }
    
    if (saveGoalButton) {
        saveGoalButton.addEventListener('click', saveGoal);
    }

    // ========================================================== //
    // 7. LOGIQUE DES FONCTIONNALITÉS (To-Do, Pomodoro, Canvas)
    // ========================================================== //
    
    // a. To-Do List
    let todos = loadState('todos', []);

    const renderTodos = () => {
        if (!todoListElement) return;
        
        todoListElement.innerHTML = '';
        
        todos.forEach((todo, index) => {
            const li = document.createElement('li');
            li.className = todo.completed ? 'completed' : '';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.completed;
            checkbox.dataset.index = index;
            checkbox.setAttribute('aria-label', `Marquer "${todo.text}" comme ${todo.completed ? 'non complétée' : 'complétée'}`);
            
            const span = document.createElement('span');
            span.textContent = todo.text;
            span.dataset.index = index;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '&#x2715;';
            deleteBtn.dataset.index = index;
            deleteBtn.setAttribute('aria-label', `Supprimer "${todo.text}"`);
            deleteBtn.title = 'Supprimer la tâche';
            
            li.appendChild(checkbox);
            li.appendChild(span);
            li.appendChild(deleteBtn);
            todoListElement.appendChild(li);
        });
        
        if (todoCountElement) {
            todoCountElement.textContent = todos.length;
        }
        
        saveState('todos', todos);
    };

    const addTodo = () => {
        if (!newTodoInput) return;
        
        const text = newTodoInput.value.trim();
        if (text) {
            todos.unshift({ text: text, completed: false });
            newTodoInput.value = '';
            renderTodos();
        }
    };

    if (addTodoButton) {
        addTodoButton.addEventListener('click', addTodo);
    }
    
    if (newTodoInput) {
        newTodoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTodo();
            }
        });
    }
    
    if (todoListElement) {
        todoListElement.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            if (index === undefined) return;
            
            const idx = parseInt(index);
            
            if (e.target.type === 'checkbox' || e.target.tagName === 'SPAN') {
                todos[idx].completed = !todos[idx].completed;
            } else if (e.target.tagName === 'BUTTON') {
                todos.splice(idx, 1);
            }
            
            renderTodos();
        });
    }
    
    renderTodos();

    // b. Minuteur Pomodoro (durées dans la carte)
    let WORK_DURATION = loadState('workDuration', 25) * 60;
    let BREAK_DURATION = loadState('breakDuration', 5) * 60;
    let totalSeconds = WORK_DURATION;
    let isRunning = false;
    let intervalId = null;
    let isWorkSession = true;
    let sessionsCompleted = loadState('sessionsCompleted', 0);

    const updatePomodoroSettings = () => {
        if (!workDurationInline || !breakDurationInline) return;
        
        const newWorkMin = parseInt(workDurationInline.value);
        const newBreakMin = parseInt(breakDurationInline.value);
        
        if (newWorkMin > 0 && newWorkMin <= 60) {
            WORK_DURATION = newWorkMin * 60;
            saveState('workDuration', newWorkMin);
        }
        
        if (newBreakMin > 0 && newBreakMin <= 30) {
            BREAK_DURATION = newBreakMin * 60;
            saveState('breakDuration', newBreakMin);
        }
        
        if (!isRunning) {
            resetTimer(true);
        }
    };

    const updateDisplay = () => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        if (timerDisplay) {
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (sessionCountElement) {
            sessionCountElement.textContent = sessionsCompleted;
        }
    };

    const updateStatus = () => {
        if (!timerStatus || !startTimerButton) return;
        
        const durationMin = isWorkSession 
            ? Math.floor(WORK_DURATION / 60) 
            : Math.floor(BREAK_DURATION / 60);
        
        if (isWorkSession) {
            timerStatus.textContent = isRunning 
                ? 'FOCUS : Travail en cours' 
                : `Prêt pour Focus (${durationMin} min)`;
            startTimerButton.innerHTML = isRunning 
                ? '<i class="fas fa-pause"></i> Pause' 
                : '<i class="fas fa-play"></i> Démarrer Focus';
        } else {
            timerStatus.textContent = isRunning 
                ? 'PAUSE : Détente active' 
                : `Prêt pour Pause (${durationMin} min)`;
            startTimerButton.innerHTML = isRunning 
                ? '<i class="fas fa-pause"></i> Pause' 
                : '<i class="fas fa-play"></i> Démarrer Pause';
        }
    };

    const countdown = () => {
        totalSeconds--;
        
        if (totalSeconds < 0) {
            clearInterval(intervalId);
            
            if (isWorkSession) {
                sessionsCompleted++;
                saveState('sessionsCompleted', sessionsCompleted);
            }
            
            const message = isWorkSession 
                ? "⏰ Temps de Focus terminé ! C'est l'heure de la pause." 
                : "⏰ Pause terminée ! Reprenons le travail.";
            
            alert(message);
            
            isWorkSession = !isWorkSession;
            totalSeconds = isWorkSession ? WORK_DURATION : BREAK_DURATION;
            intervalId = setInterval(countdown, 1000);
        }
        
        updateDisplay();
        updateStatus();
    };

    const toggleTimer = () => {
        isRunning = !isRunning;
        
        if (isRunning) {
            intervalId = setInterval(countdown, 1000);
        } else {
            clearInterval(intervalId);
        }
        
        updateStatus();
    };

    const resetTimer = (toWork = true) => {
        clearInterval(intervalId);
        isRunning = false;
        isWorkSession = toWork;
        totalSeconds = isWorkSession ? WORK_DURATION : BREAK_DURATION;
        updateDisplay();
        updateStatus();
    };

    // Initialisation Pomodoro avec les inputs inline
    if (workDurationInline && breakDurationInline) {
        workDurationInline.value = loadState('workDuration', 25);
        breakDurationInline.value = loadState('breakDuration', 5);
        
        // Mise à jour dynamique des durées
        workDurationInline.addEventListener('change', updatePomodoroSettings);
        breakDurationInline.addEventListener('change', updatePomodoroSettings);
        
        resetTimer(true);
    }

    if (startTimerButton) {
        startTimerButton.addEventListener('click', toggleTimer);
    }
    
    if (resetTimerButton) {
        resetTimerButton.addEventListener('click', () => resetTimer(true));
    }

    // c. Zone de Dessin avec Outils (Crayon/Gomme + Couleur)
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;
        let currentTool = 'pencil'; // 'pencil' ou 'eraser'
        let currentColor = loadState('drawingColor', '#333333');
        let currentBrushSize = loadState('brushSize', 3);

        const setupCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            
            ctx.fillStyle = body.classList.contains('dark-mode') ? '#212932' : '#f0f3f6';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            updateDrawingStyle();
        };

        const updateDrawingStyle = () => {
            if (currentTool === 'pencil') {
                ctx.strokeStyle = currentColor;
                ctx.globalCompositeOperation = 'source-over';
                canvas.classList.remove('eraser-mode');
            } else {
                ctx.strokeStyle = body.classList.contains('dark-mode') ? '#212932' : '#f0f3f6';
                ctx.globalCompositeOperation = 'destination-out';
                canvas.classList.add('eraser-mode');
            }
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.lineWidth = currentBrushSize;
        };

        setupCanvas();
        window.addEventListener('resize', setupCanvas);
        
        // Gestion des outils
        if (toolPencilButton) {
            toolPencilButton.addEventListener('click', () => {
                currentTool = 'pencil';
                toolPencilButton.classList.add('active-tool');
                toolEraserButton.classList.remove('active-tool');
                updateDrawingStyle();
            });
        }
        
        if (toolEraserButton) {
            toolEraserButton.addEventListener('click', () => {
                currentTool = 'eraser';
                toolEraserButton.classList.add('active-tool');
                toolPencilButton.classList.remove('active-tool');
                updateDrawingStyle();
            });
        }
        
        // Gestion de la couleur
        if (colorPicker) {
            colorPicker.value = currentColor;
            colorPicker.addEventListener('input', (e) => {
                currentColor = e.target.value;
                saveState('drawingColor', currentColor);
                if (currentTool === 'pencil') {
                    ctx.strokeStyle = currentColor;
                }
            });
        }
        
        // Gestion de la taille du pinceau
        if (brushSize && brushSizeValue) {
            brushSize.value = currentBrushSize;
            brushSizeValue.textContent = currentBrushSize;
            
            brushSize.addEventListener('input', (e) => {
                currentBrushSize = parseInt(e.target.value);
                brushSizeValue.textContent = currentBrushSize;
                ctx.lineWidth = currentBrushSize;
                saveState('brushSize', currentBrushSize);
            });
        }
        
        const getCoords = (e) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
            const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
            return [clientX - rect.left, clientY - rect.top];
        };
        
        const draw = (e) => {
            if (!isDrawing) return;
            
            const [currentX, currentY] = getCoords(e);
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
            [lastX, lastY] = [currentX, currentY];
        };

        const startDrawing = (e) => {
            isDrawing = true;
            [lastX, lastY] = getCoords(e);
            e.preventDefault();
        };

        const stopDrawing = () => {
            isDrawing = false;
        };

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);
        canvas.addEventListener('touchstart', startDrawing);
        canvas.addEventListener('touchmove', draw);
        canvas.addEventListener('touchend', stopDrawing);
        
        if (clearCanvasButton) {
            clearCanvasButton.addEventListener('click', setupCanvas);
        }
    }
    
    // ========================================================== //
    // 8. FINALISATION
    // ========================================================== //
    
    console.log('✅ Focus & Zen initialisé avec succès !');
});
