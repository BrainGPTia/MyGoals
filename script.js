console.log('🚀 Chargement de Focus & Zen...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM chargé, initialisation...');
    
    // ========================================================== //
    // 1. SÉLECTION DES ÉLÉMENTS DU DOM
    // ========================================================== //
    
    var body = document.body;
    var homeButton = document.getElementById('home-button');
    var faqButton = document.getElementById('faq-button');
    var focusPage = document.getElementById('focus-page');
    var faqPage = document.getElementById('faq-page');

    var audio = document.getElementById('background-audio');
    var audioToggleButton = document.getElementById('audio-toggle-button');
    var nextTrackButton = document.getElementById('next-track-button');
    var currentTrackInfo = document.getElementById('current-track-info');
    var volumeSlider = document.getElementById('volume-slider');

    var modalOverlay = document.getElementById('modal-overlay');
    var closeModalButton = document.querySelector('.close-modal-button');
    var settingsButton = document.getElementById('settings-button');
    var themeSwitch = document.getElementById('theme-switch');
    var animationSwitch = document.getElementById('animation-switch');

    var quoteElement = document.getElementById('motivational-quote');
    var changeQuoteButton = document.getElementById('change-quote-button');
    var dailyGoalInput = document.getElementById('daily-goal');
    var newTodoInput = document.getElementById('new-todo');
    var addTodoButton = document.getElementById('add-todo-button');
    var todoListElement = document.getElementById('todo-list');
    var todoCountElement = document.getElementById('todo-count');
    
    var timerDisplay = document.getElementById('timer-display');
    var startTimerButton = document.getElementById('start-timer');
    var resetTimerButton = document.getElementById('reset-timer');
    var timerStatus = document.getElementById('timer-status');
    var sessionCountElement = document.getElementById('session-count');
    var workDurationInline = document.getElementById('work-duration-inline');
    var breakDurationInline = document.getElementById('break-duration-inline');
    
    var canvas = document.getElementById('drawing-canvas');
    var clearCanvasButton = document.getElementById('clear-canvas');
    var toolPencilButton = document.getElementById('tool-pencil');
    var toolEraserButton = document.getElementById('tool-eraser');
    var colorPicker = document.getElementById('color-picker');
    var brushSize = document.getElementById('brush-size');
    var brushSizeValue = document.getElementById('brush-size-value');

    console.log('✅ Éléments DOM sélectionnés');

    // ========================================================== //
    // 2. GESTION DES DONNÉES LOCALES
    // ========================================================== //
    
    function loadState(key, defaultValue) {
        try {
            var stored = localStorage.getItem(key);
            if (stored === null) return defaultValue;
            return JSON.parse(stored);
        } catch (error) {
            console.warn('Erreur chargement ' + key + ':', error);
            return defaultValue;
        }
    }

    function saveState(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Erreur sauvegarde ' + key + ':', error);
        }
    }

    // ========================================================== //
    // 3. GESTION DE LA PLAYLIST & AUDIO
    // ========================================================== //
    
    var playlist = [
        { title: "Calm Focus", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" }, 
        { title: "Deep Ambient", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" }, 
        { title: "Zen Loop", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
        { title: "Synthwave", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
        { title: "Flow State", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" }
    ];
    
    var currentTrackIndex = loadState('currentTrackIndex', 0);

    function loadTrack(index) {
        if (index < 0 || index >= playlist.length) {
            index = 0;
        }
        audio.src = playlist[index].url;
        audio.load();
        currentTrackIndex = index;
        saveState('currentTrackIndex', index);
        updateAudioButtonState();
    }
    
    function updateAudioButtonState() {
        var icon = audio.paused ? 'play' : 'pause';
        audioToggleButton.innerHTML = '<i class="fas fa-' + icon + '"></i>';
        currentTrackInfo.textContent = playlist[currentTrackIndex].title;
    }

    function toggleAudio() {
        if (audio.paused) {
            audio.play().catch(function(error) {
                console.error("Erreur lecture:", error);
                alert("Le navigateur a bloqué la lecture. Cliquez à nouveau.");
            });
        } else {
            audio.pause();
        }
    }

    function playNextTrack() {
        var wasPlaying = !audio.paused;
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        loadTrack(currentTrackIndex);
        if (wasPlaying) {
            audio.play().catch(function(error) {
                console.error("Erreur changement piste:", error);
            });
        }
    }

    var initialVolume = loadState('audioVolume', 0.5);
    audio.volume = Math.min(Math.max(initialVolume, 0), 1);
    
    if (volumeSlider) {
        volumeSlider.value = initialVolume;
        volumeSlider.addEventListener('input', function() {
            var volume = parseFloat(volumeSlider.value);
            audio.volume = volume;
            saveState('audioVolume', volume);
        });
    }

    if (audioToggleButton) audioToggleButton.addEventListener('click', toggleAudio);
    if (nextTrackButton) nextTrackButton.addEventListener('click', playNextTrack);
    audio.addEventListener('ended', playNextTrack);
    audio.addEventListener('play', updateAudioButtonState);
    audio.addEventListener('pause', updateAudioButtonState);

    loadTrack(currentTrackIndex);
    console.log('✅ Audio initialisé');

    // ========================================================== //
    // 4. GESTION DE LA NAVIGATION
    // ========================================================== //

    function navigateTo(targetPageElement, sourceButton) {
        var allPages = document.querySelectorAll('.page-section');
        for (var i = 0; i < allPages.length; i++) {
            allPages[i].classList.remove('visible-page-section');
            allPages[i].classList.add('hidden-page-section');
        }

        targetPageElement.classList.remove('hidden-page-section');
        targetPageElement.classList.add('visible-page-section');

        var allButtons = document.querySelectorAll('.nav-button');
        for (var i = 0; i < allButtons.length; i++) {
            allButtons[i].classList.remove('active-nav-button');
        }
        
        if (sourceButton) {
            sourceButton.classList.add('active-nav-button');
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (homeButton) {
        homeButton.addEventListener('click', function() {
            console.log('Navigation: Accueil');
            navigateTo(focusPage, homeButton);
        });
    }
    
    if (faqButton) {
        faqButton.addEventListener('click', function() {
            console.log('Navigation: FAQ');
            navigateTo(faqPage, faqButton);
        });
    }

    console.log('✅ Navigation initialisée');

    // ========================================================== //
    // 5. GESTION DES MODALES
    // ========================================================== //

    function openModal() {
        if (modalOverlay) modalOverlay.classList.remove('hidden-modal');
        body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (modalOverlay) modalOverlay.classList.add('hidden-modal');
        body.style.overflow = '';
    }
    
    if (settingsButton) {
        settingsButton.addEventListener('click', function() {
            console.log('Ouverture paramètres');
            openModal();
        });
    }
    
    if (closeModalButton) {
        closeModalButton.addEventListener('click', function() {
            console.log('Fermeture paramètres');
            closeModal();
        });
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    // Thème
    var currentTheme = loadState('theme', 'light');
    if (currentTheme === 'dark') {
        body.classList.add('dark-mode');
        if (themeSwitch) themeSwitch.checked = true;
    }

    if (themeSwitch) {
        themeSwitch.addEventListener('change', function() {
            var isDark = themeSwitch.checked;
            if (isDark) {
                body.classList.add('dark-mode');
            } else {
                body.classList.remove('dark-mode');
            }
            saveState('theme', isDark ? 'dark' : 'light');
            console.log('Thème changé:', isDark ? 'sombre' : 'clair');
        });
    }

    // Animations
    function toggleAnimations(enable) {
        var value = enable ? '0.25s' : '0s';
        document.documentElement.style.setProperty('--transition-speed', value);
        saveState('animationsEnabled', enable);
    }
    
    var animationsEnabled = loadState('animationsEnabled', true);
    if (animationSwitch) {
        animationSwitch.checked = animationsEnabled;
        toggleAnimations(animationsEnabled);
        animationSwitch.addEventListener('change', function() {
            toggleAnimations(animationSwitch.checked);
        });
    }

    console.log('✅ Paramètres initialisés');

    // ========================================================== //
    // 6. FAQ
    // ========================================================== //
    
    var faqData = [
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

    function renderFAQ() {
        if (!faqPage) return;
        var container = faqPage.querySelector('#faq-content');
        if (!container) return;
        
        container.innerHTML = '<div class="faq-introduction"><h2><i class="fas fa-question-circle"></i> Pourquoi Focus & Zen ?</h2><p>Cette section détaille la philosophie et les choix de conception derrière Focus & Zen.</p></div>';
        
        for (var i = 0; i < faqData.length; i++) {
            var item = faqData[i];
            var section = document.createElement('div');
            section.style.marginBottom = '30px';
            
            var question = document.createElement('h3');
            question.innerHTML = 'Q: ' + item.question;
            
            var answer = document.createElement('p');
            answer.innerHTML = 'R: ' + item.answer;
            
            section.appendChild(question);
            section.appendChild(answer);
            container.appendChild(section);
        }
    }
    
    renderFAQ();

    // ========================================================== //
    // 7. CITATIONS
    // ========================================================== //
    
    var quotes = [
        "La simplicité est la sophistication suprême. - Leonardo da Vinci",
        "Ne remettez jamais à demain ce que vous pouvez faire après-demain. - Mark Twain",
        "Le secret pour avancer est de commencer. - Mark Twain",
        "Concentrez toute votre énergie sur la tâche que vous avez à accomplir. - Bouddha",
        "Un petit pas vaut mieux qu'une longue méditation. - Proverbe tibétain",
        "La perfection est atteinte non pas lorsqu'il n'y a plus rien à ajouter, mais lorsqu'il n'y a plus rien à retirer. - Antoine de Saint-Exupéry",
        "Ce qui compte, ce n'est pas le nombre d'heures que vous mettez dans votre travail, c'est le travail que vous mettez dans vos heures. - Sam Ewing"
    ];

    function displayRandomQuote() {
        if (quoteElement) {
            var randomIndex = Math.floor(Math.random() * quotes.length);
            quoteElement.textContent = quotes[randomIndex];
        }
    }

    displayRandomQuote();
    
    if (changeQuoteButton) {
        changeQuoteButton.addEventListener('click', function() {
            console.log('Changement de citation');
            displayRandomQuote();
        });
    }
    
    if (quoteElement) {
        quoteElement.style.cursor = 'pointer';
        quoteElement.addEventListener('click', displayRandomQuote);
    }

    console.log('✅ Citations initialisées');

    // ========================================================== //
    // 8. OBJECTIF - SAUVEGARDE AUTOMATIQUE
    // ========================================================== //
    
    if (dailyGoalInput) {
        var savedGoal = loadState('dailyGoal', '');
        dailyGoalInput.value = savedGoal;
        
        dailyGoalInput.addEventListener('input', function() {
            saveState('dailyGoal', dailyGoalInput.value.trim());
        });
    }

    console.log('✅ Objectif initialisé');

    // ========================================================== //
    // 9. TO-DO LIST
    // ========================================================== //
    
    var todos = loadState('todos', []);

    function renderTodos() {
        if (!todoListElement) return;
        
        todoListElement.innerHTML = '';
        
        for (var i = 0; i < todos.length; i++) {
            var todo = todos[i];
            var li = document.createElement('li');
            li.className = todo.completed ? 'completed' : '';
            
            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.completed;
            checkbox.dataset.index = i;
            
            var span = document.createElement('span');
            span.textContent = todo.text;
            span.dataset.index = i;
            
            var deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '&#x2715;';
            deleteBtn.dataset.index = i;
            deleteBtn.type = 'button';
            
            li.appendChild(checkbox);
            li.appendChild(span);
            li.appendChild(deleteBtn);
            todoListElement.appendChild(li);
        }
        
        if (todoCountElement) {
            todoCountElement.textContent = todos.length;
        }
        
        saveState('todos', todos);
    }

    function addTodo() {
        if (!newTodoInput) return;
        
        var text = newTodoInput.value.trim();
        if (text) {
            todos.unshift({ text: text, completed: false });
            newTodoInput.value = '';
            renderTodos();
            console.log('Tâche ajoutée:', text);
        }
    }

    if (addTodoButton) {
        addTodoButton.addEventListener('click', function() {
            console.log('Clic bouton ajouter tâche');
            addTodo();
        });
    }
    
    if (newTodoInput) {
        newTodoInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTodo();
            }
        });
    }
    
    if (todoListElement) {
        todoListElement.addEventListener('click', function(e) {
            var index = e.target.dataset.index;
            if (index === undefined || index === null) return;
            
            var idx = parseInt(index);
            if (isNaN(idx) || idx < 0 || idx >= todos.length) return;
            
            if (e.target.type === 'checkbox' || e.target.tagName === 'SPAN') {
                todos[idx].completed = !todos[idx].completed;
            } else if (e.target.tagName === 'BUTTON') {
                todos.splice(idx, 1);
            }
            
            renderTodos();
        });
    }
    
    renderTodos();
    console.log('✅ To-Do initialisée');

    // ========================================================== //
    // 10. MINUTEUR POMODORO
    // ========================================================== //
    
    var WORK_DURATION = loadState('workDuration', 25) * 60;
    var BREAK_DURATION = loadState('breakDuration', 5) * 60;
    var totalSeconds = WORK_DURATION;
    var isRunning = false;
    var intervalId = null;
    var isWorkSession = true;
    var sessionsCompleted = loadState('sessionsCompleted', 0);

    function updatePomodoroSettings() {
        if (!workDurationInline || !breakDurationInline) return;
        
        var newWorkMin = parseInt(workDurationInline.value);
        var newBreakMin = parseInt(breakDurationInline.value);
        
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
    }

    function updateDisplay() {
        var minutes = Math.floor(totalSeconds / 60);
        var seconds = totalSeconds % 60;
        
        if (timerDisplay) {
            timerDisplay.textContent = (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
        }
        
        if (sessionCountElement) {
            sessionCountElement.textContent = sessionsCompleted;
        }
    }

    function updateStatus() {
        if (!timerStatus || !startTimerButton) return;
        
        var durationMin = isWorkSession 
            ? Math.floor(WORK_DURATION / 60) 
            : Math.floor(BREAK_DURATION / 60);
        
        if (isWorkSession) {
            timerStatus.textContent = isRunning 
                ? 'FOCUS : Travail en cours' 
                : 'Prêt pour Focus (' + durationMin + ' min)';
            startTimerButton.innerHTML = isRunning 
                ? '<i class="fas fa-pause"></i> Pause' 
                : '<i class="fas fa-play"></i> Démarrer Focus';
        } else {
            timerStatus.textContent = isRunning 
                ? 'PAUSE : Détente active' 
                : 'Prêt pour Pause (' + durationMin + ' min)';
            startTimerButton.innerHTML = isRunning 
                ? '<i class="fas fa-pause"></i> Pause' 
                : '<i class="fas fa-play"></i> Démarrer Pause';
        }
    }

    function countdown() {
        totalSeconds--;
        
        if (totalSeconds < 0) {
            clearInterval(intervalId);
            
            if (isWorkSession) {
                sessionsCompleted++;
                saveState('sessionsCompleted', sessionsCompleted);
            }
            
            var message = isWorkSession 
                ? "⏰ Temps de Focus terminé ! C'est l'heure de la pause." 
                : "⏰ Pause terminée ! Reprenons le travail.";
            
            alert(message);
            
            isWorkSession = !isWorkSession;
            totalSeconds = isWorkSession ? WORK_DURATION : BREAK_DURATION;
            intervalId = setInterval(countdown, 1000);
        }
        
        updateDisplay();
        updateStatus();
    }

    function toggleTimer() {
        isRunning = !isRunning;
        console.log('Timer:', isRunning ? 'démarré' : 'pausé');
        
        if (isRunning) {
            intervalId = setInterval(countdown, 1000);
        } else {
            clearInterval(intervalId);
        }
        
        updateStatus();
    }

    function resetTimer(toWork) {
        if (toWork === undefined) toWork = true;
        clearInterval(intervalId);
        isRunning = false;
        isWorkSession = toWork;
        totalSeconds = isWorkSession ? WORK_DURATION : BREAK_DURATION;
        updateDisplay();
        updateStatus();
    }

    if (workDurationInline && breakDurationInline) {
        workDurationInline.value = loadState('workDuration', 25);
        breakDurationInline.value = loadState('breakDuration', 5);
        
        workDurationInline.addEventListener('change', updatePomodoroSettings);
        breakDurationInline.addEventListener('change', updatePomodoroSettings);
        
        resetTimer(true);
    }

    if (startTimerButton) {
        startTimerButton.addEventListener('click', toggleTimer);
    }
    
    if (resetTimerButton) {
        resetTimerButton.addEventListener('click', function() {
            resetTimer(true);
        });
    }

    console.log('✅ Pomodoro initialisé');

    // ========================================================== //
    // 11. ZONE DE DESSIN
    // ========================================================== //
    
    if (canvas) {
        var ctx = canvas.getContext('2d');
        var isDrawing = false;
        var lastX = 0;
        var lastY = 0;
        var currentTool = 'pencil';
        var currentColor = loadState('drawingColor', '#333333');
        var currentBrushSize = loadState('brushSize', 3);

        function setupCanvas() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            
            ctx.fillStyle = body.classList.contains('dark-mode') ? '#212932' : '#f0f3f6';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            updateDrawingStyle();
        }

        function updateDrawingStyle() {
            if (currentTool === 'pencil') {
                ctx.strokeStyle = currentColor;
                ctx.globalCompositeOperation = 'source-over';
                if (canvas) canvas.classList.remove('eraser-mode');
            } else {
                ctx.strokeStyle = body.classList.contains('dark-mode') ? '#212932' : '#f0f3f6';
                ctx.globalCompositeOperation = 'destination-out';
                if (canvas) canvas.classList.add('eraser-mode');
            }
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.lineWidth = currentBrushSize;
        }

        setupCanvas();
        window.addEventListener('resize', setupCanvas);
        
        if (toolPencilButton) {
            toolPencilButton.addEventListener('click', function() {
                currentTool = 'pencil';
                toolPencilButton.classList.add('active-tool');
                if (toolEraserButton) toolEraserButton.classList.remove('active-tool');
                updateDrawingStyle();
            });
        }
        
        if (toolEraserButton) {
            toolEraserButton.addEventListener('click', function() {
                currentTool = 'eraser';
                toolEraserButton.classList.add('active-tool');
                if (toolPencilButton) toolPencilButton.classList.remove('active-tool');
                updateDrawingStyle();
            });
        }
        
        if (colorPicker) {
            colorPicker.value = currentColor;
            colorPicker.addEventListener('input', function(e) {
                currentColor = e.target.value;
                saveState('drawingColor', currentColor);
                if (currentTool === 'pencil') {
                    ctx.strokeStyle = currentColor;
                }
            });
        }
        
        if (brushSize && brushSizeValue) {
            brushSize.value = currentBrushSize;
            brushSizeValue.textContent = currentBrushSize;
            
            brushSize.addEventListener('input', function(e) {
                currentBrushSize = parseInt(e.target.value);
                brushSizeValue.textContent = currentBrushSize;
                ctx.lineWidth = currentBrushSize;
                saveState('brushSize', currentBrushSize);
            });
        }
        
        function getCoords(e) {
            var rect = canvas.getBoundingClientRect();
            var clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
            var clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
            return [clientX - rect.left, clientY - rect.top];
        }
        
        function draw(e) {
            if (!isDrawing) return;
            
            var coords = getCoords(e);
            var currentX = coords[0];
            var currentY = coords[1];
            
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
            
            lastX = currentX;
            lastY = currentY;
        }

        function startDrawing(e) {
            isDrawing = true;
            var coords = getCoords(e);
            lastX = coords[0];
            lastY = coords[1];
            e.preventDefault();
        }

        function stopDrawing() {
            isDrawing = false;
        }

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

        console.log('✅ Canvas initialisé');
    }
    
    console.log('✅✅✅ Focus & Zen complètement initialisé !');
});
