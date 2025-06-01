document.addEventListener('DOMContentLoaded', function () {
    // State management
    const state = {
        currentView: 'extract',
        currentMetadata: {},
        history: [],
        settings: {
            theme: 'red',
            animationSpeed: 'normal',
            enableFaceDetection: true,
            enableColorAnalysis: true,
            enableQualityMetrics: true,
            showTutorial: true
        }
    };

    // DOM Elements
    const elements = {
        uploadArea: document.getElementById('uploadArea'),
        fileInput: document.getElementById('fileInput'),
        imagePreview: document.getElementById('imagePreview'),
        metadataGrid: document.getElementById('metadataGrid'),
        exportBtn: document.getElementById('exportBtn'),
        clearBtn: document.getElementById('clearBtn'),
        dimensions: document.getElementById('dimensions'),
        fileSize: document.getElementById('fileSize'),
        fileType: document.getElementById('fileType'),
        toastContainer: document.getElementById('toastContainer'),
        navItems: document.querySelectorAll('.nav-item'),
        viewContainers: document.querySelectorAll('.view-container'),
        themeSelect: document.getElementById('themeSelect'),
        animationSpeed: document.getElementById('animationSpeed'),
        colorPalette: document.getElementById('colorPalette'),
        faceDetectionResults: document.getElementById('faceDetectionResults'),
        qualityMetrics: document.getElementById('qualityMetrics'),
        analysisTabs: document.querySelectorAll('.analysis-tab'),
        analysisPanels: document.querySelectorAll('.analysis-panel')
    };

    // Initialize
    function init() {
        showLoadingScreen();
        loadSettings();
        loadHistory();
        setupEventListeners();
        setupKeyboardShortcuts();
        updateTheme();
        
        // Set default theme if no theme is saved
        if (!localStorage.getItem('settings')) {
            state.settings.theme = 'red';
            elements.themeSelect.value = 'red';
            updateTheme();
            saveSettings();
        }

        // Show tutorial if enabled
        if (state.settings.showTutorial) {
            setTimeout(showTutorial, 1000);
        }
    }

    // Loading Screen
    function showLoadingScreen() {
        const loader = document.createElement('div');
        loader.className = 'loading-screen';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="loader-spinner"></div>
                <h2>ExifGeek</h2>
                <p>Loading your image analysis tool...</p>
            </div>
        `;
        document.body.appendChild(loader);

        // Remove loader after content is loaded
        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => loader.remove(), 500);
            }, 1000);
        });
    }

    // Keyboard Shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only trigger if not typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // Ctrl/Cmd + U: Upload file
            if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                e.preventDefault();
                elements.fileInput.click();
            }

            // Ctrl/Cmd + H: Toggle History
            if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                e.preventDefault();
                switchView('history');
            }

            // Ctrl/Cmd + S: Toggle Settings
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                switchView('settings');
            }

            // Ctrl/Cmd + E: Export
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                exportMetadata();
            }

            // Ctrl/Cmd + C: Copy selected metadata
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                const selected = document.querySelector('.metadata-item.selected');
                if (selected) {
                    const value = selected.querySelector('.metadata-value').textContent;
                    copyToClipboard(value);
                }
            }

            // Escape: Close dropdowns/dialogs
            if (e.key === 'Escape') {
                document.querySelectorAll('.nav-group.active').forEach(group => {
                    group.classList.remove('active');
                });
                document.querySelector('.about-dialog')?.remove();
            }
        });
    }

    // Copy to Clipboard
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard', 'success');
        }).catch(() => {
            showToast('Failed to copy', 'error');
        });
    }

    // Tutorial System
    function showTutorial() {
        const steps = [
            {
                target: '#uploadArea',
                title: 'Upload Your Image',
                content: 'Drag and drop an image here or click to browse. You can also use Ctrl/Cmd + U as a shortcut.',
                position: 'bottom'
            },
            {
                target: '.analysis-tabs',
                title: 'Analysis Tabs',
                content: 'Switch between different types of analysis: Metadata, Colors, Faces, and Quality.',
                position: 'bottom'
            },
            {
                target: '#exportBtn',
                title: 'Export Data',
                content: 'Export your analysis results as JSON. Use Ctrl/Cmd + E as a shortcut.',
                position: 'left'
            },
            {
                target: '.nav-items',
                title: 'Navigation',
                content: 'Use the sidebar to switch between views. Ctrl/Cmd + H for History, Ctrl/Cmd + S for Settings.',
                position: 'right'
            }
        ];

        let currentStep = 0;

        function showStep() {
            if (currentStep >= steps.length) {
                state.settings.showTutorial = false;
                saveSettings();
                return;
            }

            const step = steps[currentStep];
            const target = document.querySelector(step.target);
            if (!target) {
                currentStep++;
                showStep();
                return;
            }

            const tooltip = document.createElement('div');
            tooltip.className = 'tutorial-tooltip';
            tooltip.innerHTML = `
                <div class="tooltip-content">
                    <h3>${step.title}</h3>
                    <p>${step.content}</p>
                    <div class="tooltip-actions">
                        <button class="tooltip-skip">Skip Tutorial</button>
                        <button class="tooltip-next">${currentStep === steps.length - 1 ? 'Finish' : 'Next'}</button>
                    </div>
                </div>
            `;

            const rect = target.getBoundingClientRect();
            tooltip.style.top = `${rect[step.position === 'bottom' ? 'bottom' : 'top']}px`;
            tooltip.style.left = `${rect.left}px`;

            document.body.appendChild(tooltip);

            tooltip.querySelector('.tooltip-next').addEventListener('click', () => {
                tooltip.remove();
                currentStep++;
                showStep();
            });

            tooltip.querySelector('.tooltip-skip').addEventListener('click', () => {
                tooltip.remove();
                state.settings.showTutorial = false;
                saveSettings();
            });
        }

        showStep();
    }

    // Load settings from localStorage
    function loadSettings() {
        const savedSettings = localStorage.getItem('settings');
        if (savedSettings) {
            state.settings = JSON.parse(savedSettings);
            elements.themeSelect.value = state.settings.theme;
            elements.animationSpeed.value = state.settings.animationSpeed;
        }
    }

    // Save settings to localStorage
    function saveSettings() {
        localStorage.setItem('settings', JSON.stringify(state.settings));
    }

    // Setup event listeners
    function setupEventListeners() {
        // File handling
        elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
        elements.fileInput.addEventListener('change', handleFileSelect);
        elements.uploadArea.addEventListener('dragover', handleDragOver);
        elements.uploadArea.addEventListener('dragleave', handleDragLeave);
        elements.uploadArea.addEventListener('drop', handleDrop);

        // Buttons
        elements.exportBtn.addEventListener('click', exportMetadata);
        elements.clearBtn.addEventListener('click', clearData);

        // Navigation
        elements.navItems.forEach(item => {
            item.addEventListener('click', () => switchView(item.dataset.view));
        });

        // Dropdown functionality
        document.querySelectorAll('.nav-group').forEach(group => {
            const navItem = group.querySelector('.nav-item');
            navItem.addEventListener('click', (e) => {
                e.stopPropagation();
                const isActive = group.classList.contains('active');
                
                // Close all other dropdowns
                document.querySelectorAll('.nav-group.active').forEach(activeGroup => {
                    if (activeGroup !== group) {
                        activeGroup.classList.remove('active');
                    }
                });

                // Toggle current dropdown
                group.classList.toggle('active', !isActive);
            });
        });

        // Dropdown actions
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.dataset.action;
                handleDropdownAction(action);
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.nav-group.active').forEach(group => {
                group.classList.remove('active');
            });
        });

        // Analysis Tabs
        document.querySelectorAll('.analysis-tab').forEach(tab => {
            tab.addEventListener('click', () => switchAnalysisTab(tab.dataset.tab));
        });

        // Settings
        elements.themeSelect.addEventListener('change', handleThemeChange);
        elements.animationSpeed.addEventListener('change', handleAnimationSpeedChange);
    }

    // File handling
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) processFile(file);
    }

    function handleDragOver(event) {
        event.preventDefault();
        elements.uploadArea.classList.add('dragover');
    }

    function handleDragLeave() {
        elements.uploadArea.classList.remove('dragover');
    }

    function handleDrop(event) {
        event.preventDefault();
        elements.uploadArea.classList.remove('dragover');
        const file = event.dataTransfer.files[0];
        if (file) processFile(file);
    }

    function processFile(file) {
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file', 'error');
            return;
        }

        showUploadProgress();
        
        // Create image preview
        const img = document.createElement('img');
        img.onload = function() {
            extractMetadata(file, this);
            analyzeColors(this);
            detectFaces(this);
            analyzeImageQuality(this);
            hideUploadProgress();
        };
        img.src = URL.createObjectURL(file);
        
        elements.imagePreview.innerHTML = '';
        elements.imagePreview.appendChild(img);

        // Update basic info
        elements.dimensions.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;
        elements.fileSize.textContent = formatBytes(file.size);
        elements.fileType.textContent = file.type;
    }

    // Metadata extraction
    function extractMetadata(file, img) {
        const metadata = {
            'FILE_NAME': file.name,
            'FILE_SIZE': formatBytes(file.size),
            'FILE_TYPE': file.type,
            'LAST_MODIFIED': new Date(file.lastModified).toLocaleString(),
            'IMAGE_WIDTH': img.naturalWidth + 'px',
            'IMAGE_HEIGHT': img.naturalHeight + 'px',
            'ASPECT_RATIO': (img.naturalWidth / img.naturalHeight).toFixed(2),
            'TOTAL_PIXELS': (img.naturalWidth * img.naturalHeight).toLocaleString()
        };

        EXIF.getData(img, function() {
            const exifData = EXIF.getAllTags(this);
            
            // Add EXIF data
            for (const [key, value] of Object.entries(exifData)) {
                if (value) {
                    metadata['EXIF_' + key.toUpperCase()] = value.toString();
                }
            }
            
            // Add GPS data if available
            const lat = EXIF.getTag(this, 'GPSLatitude');
            const lon = EXIF.getTag(this, 'GPSLongitude');
            const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
            const lonRef = EXIF.getTag(this, 'GPSLongitudeRef');
            
            if (lat && lon) {
                const latDecimal = convertDMSToDD(lat, latRef);
                const lonDecimal = convertDMSToDD(lon, lonRef);
                metadata['GPS_COORDINATES'] = `${latDecimal}, ${lonDecimal}`;
                metadata['GOOGLE_MAPS_LINK'] = `https://maps.google.com/?q=${latDecimal},${lonDecimal}`;
            }
            
            state.currentMetadata = metadata;
            displayMetadata(metadata);
            addToHistory(metadata);
            showToast('Metadata extracted successfully', 'success');
        });
    }

    // Display metadata
    function displayMetadata(metadata) {
        let html = '';
        
        for (const [key, value] of Object.entries(metadata)) {
            html += `
                <div class="metadata-item fade-in">
                    <div class="metadata-label">${key.replace(/_/g, ' ')}</div>
                    <div class="metadata-value" title="Click to copy">${value}</div>
                    <button class="copy-btn" title="Copy to clipboard">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            `;
        }
        
        elements.metadataGrid.innerHTML = html;

        // Add click handlers for copy buttons
        document.querySelectorAll('.metadata-value').forEach(element => {
            element.addEventListener('click', () => {
                copyToClipboard(element.textContent);
            });
        });

        document.querySelectorAll('.copy-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = button.parentElement.querySelector('.metadata-value').textContent;
                copyToClipboard(value);
            });
        });
    }

    // History management
    function addToHistory(metadata) {
        state.history.unshift({
            id: Date.now(),
            timestamp: new Date().toISOString(),
            metadata: metadata,
            imageUrl: elements.imagePreview.querySelector('img')?.src || null
        });
        
        // Keep only last 20 items
        if (state.history.length > 20) {
            state.history.pop();
        }
        
        updateHistoryView();
        saveHistory();
    }

    function updateHistoryView() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        if (state.history.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <i class="fas fa-history"></i>
                    <p>No history items yet</p>
                    <button class="action-btn" onclick="document.getElementById('fileInput').click()">
                        <i class="fas fa-upload"></i>
                        Upload an Image
                    </button>
                </div>
            `;
            return;
        }

        // Get filter values
        const sortBy = document.getElementById('sortBy')?.value || 'newest';
        const filterType = document.getElementById('filterType')?.value || 'all';
        const searchQuery = document.getElementById('searchHistory')?.value.toLowerCase() || '';

        // Filter and sort history
        let filteredHistory = [...state.history];

        // Apply search filter
        if (searchQuery) {
            filteredHistory = filteredHistory.filter(item => 
                item.metadata.FILE_NAME?.toLowerCase().includes(searchQuery) ||
                item.metadata.FILE_TYPE?.toLowerCase().includes(searchQuery)
            );
        }

        // Apply type filter
        if (filterType !== 'all') {
            filteredHistory = filteredHistory.filter(item => 
                item.metadata.FILE_TYPE === filterType
            );
        }

        // Apply sorting
        filteredHistory.sort((a, b) => {
            switch (sortBy) {
                case 'oldest':
                    return new Date(a.timestamp) - new Date(b.timestamp);
                case 'name':
                    return (a.metadata.FILE_NAME || '').localeCompare(b.metadata.FILE_NAME || '');
                case 'size':
                    return parseFileSize(a.metadata.FILE_SIZE) - parseFileSize(b.metadata.FILE_SIZE);
                default: // newest
                    return new Date(b.timestamp) - new Date(a.timestamp);
            }
        });

        // Display filtered history
        historyList.innerHTML = filteredHistory.map((item, index) => `
            <div class="history-item fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="history-preview">
                    ${item.imageUrl ? `<img src="${item.imageUrl}" alt="History preview">` : ''}
                    <div class="history-timestamp">
                        <i class="fas fa-clock"></i>
                        ${formatTimestamp(item.timestamp)}
                    </div>
                    <div class="history-stats">
                        <div class="history-stat">
                            <i class="fas fa-image"></i>
                            ${item.metadata.IMAGE_WIDTH || 'N/A'} × ${item.metadata.IMAGE_HEIGHT || 'N/A'}
                        </div>
                        <div class="history-stat">
                            <i class="fas fa-weight"></i>
                            ${item.metadata.FILE_SIZE || 'N/A'}
                        </div>
                    </div>
                </div>
                <div class="history-info">
                    <div class="history-filename">${item.metadata.FILE_NAME || 'Unknown file'}</div>
                    <div class="history-details">
                        <span>${item.metadata.FILE_TYPE || 'N/A'}</span>
                        <span>${formatTimestamp(item.timestamp, true)}</span>
                    </div>
                    <div class="history-meta">
                        ${item.metadata.EXIF_MAKE ? `<span>Camera: ${item.metadata.EXIF_MAKE} ${item.metadata.EXIF_MODEL || ''}</span>` : ''}
                        ${item.metadata.EXIF_DATETIME ? `<span>Taken: ${formatExifDate(item.metadata.EXIF_DATETIME)}</span>` : ''}
                    </div>
                    <div class="history-actions">
                        <button class="action-btn" onclick="loadHistoryItem(${item.id})">
                            <i class="fas fa-eye"></i>
                            View
                        </button>
                        <button class="action-btn delete" onclick="deleteHistoryItem(${item.id})">
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Utility functions for history
    function formatTimestamp(timestamp, short = false) {
        const date = new Date(timestamp);
        if (short) {
            return date.toLocaleDateString();
        }
        return date.toLocaleString();
    }

    function formatExifDate(exifDate) {
        try {
            const date = new Date(exifDate.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'));
            return date.toLocaleString();
        } catch {
            return exifDate;
        }
    }

    function parseFileSize(sizeStr) {
        if (!sizeStr) return 0;
        const match = sizeStr.match(/^([\d.]+)\s*([KMG]B)$/i);
        if (!match) return 0;
        const [, size, unit] = match;
        const units = { 'KB': 1, 'MB': 1024, 'GB': 1024 * 1024 };
        return parseFloat(size) * (units[unit.toUpperCase()] || 1);
    }

    // Load history item
    window.loadHistoryItem = function(id) {
        const item = state.history.find(h => h.id === id);
        if (!item) return;

        // Update image preview
        if (item.imageUrl) {
            const img = document.createElement('img');
            img.src = item.imageUrl;
            elements.imagePreview.innerHTML = '';
            elements.imagePreview.appendChild(img);
        }

        // Update basic info
        elements.dimensions.textContent = `${item.metadata.IMAGE_WIDTH || '-'} × ${item.metadata.IMAGE_HEIGHT || '-'}`;
        elements.fileSize.textContent = item.metadata.FILE_SIZE || '-';
        elements.fileType.textContent = item.metadata.FILE_TYPE || '-';

        // Update metadata
        state.currentMetadata = item.metadata;
        displayMetadata(item.metadata);

        // Switch to extract view
        switchView('extract');
        showToast('History item loaded', 'success');
    };

    // Delete history item
    window.deleteHistoryItem = function(id) {
        if (confirm('Are you sure you want to delete this history item?')) {
            state.history = state.history.filter(h => h.id !== id);
            updateHistoryView();
            saveHistory();
            showToast('History item deleted', 'info');
        }
    };

    // Clear all history
    window.clearHistory = function() {
        if (confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
            state.history = [];
            updateHistoryView();
            saveHistory();
            showToast('History cleared', 'success');
        }
    };

    // Save history to localStorage
    function saveHistory() {
        try {
            localStorage.setItem('metadataHistory', JSON.stringify(state.history));
        } catch (error) {
            console.error('Failed to save history:', error);
            showToast('Failed to save history', 'error');
        }
    }

    // Load history from localStorage
    function loadHistory() {
        try {
            const savedHistory = localStorage.getItem('metadataHistory');
            if (savedHistory) {
                state.history = JSON.parse(savedHistory);
                updateHistoryView();
            }
        } catch (error) {
            console.error('Failed to load history:', error);
            showToast('Failed to load history', 'error');
        }
    }

    // View switching
    function switchView(view) {
        state.currentView = view;
        
        // Update navigation
        elements.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });
        
        // Update content
        elements.viewContainers.forEach(container => {
            container.classList.toggle('hidden', container.id !== `${view}-view`);
        });
    }

    // Switch analysis tab
    function switchAnalysisTab(tabId) {
        // Update active tab
        document.querySelectorAll('.analysis-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });

        // Update active panel
        document.querySelectorAll('.analysis-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabId}-panel`);
        });

        // Trigger animation
        const activePanel = document.getElementById(`${tabId}-panel`);
        if (activePanel) {
            activePanel.style.animation = 'none';
            activePanel.offsetHeight; // Trigger reflow
            activePanel.style.animation = 'fadeIn 0.3s ease';
        }
    }

    // Theme handling
    function handleThemeChange(event) {
        state.settings.theme = event.target.value;
        updateTheme();
        saveSettings();
    }

    function updateTheme() {
        document.documentElement.setAttribute('data-theme', state.settings.theme);
    }

    function handleAnimationSpeedChange(event) {
        state.settings.animationSpeed = event.target.value;
        saveSettings();
    }

    // Utility functions
    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function convertDMSToDD(dms, ref) {
        let dd = dms[0] + dms[1]/60 + dms[2]/3600;
        if (ref === 'S' || ref === 'W') dd = dd * -1;
        return dd.toFixed(6);
    }

    function showUploadProgress() {
        const progressBar = elements.uploadArea.querySelector('.progress-bar');
        const progressContainer = elements.uploadArea.querySelector('.upload-progress');
        progressContainer.classList.add('active');
        progressBar.style.width = '100%';
    }

    function hideUploadProgress() {
        const progressBar = elements.uploadArea.querySelector('.progress-bar');
        const progressContainer = elements.uploadArea.querySelector('.upload-progress');
        progressBar.style.width = '0';
        setTimeout(() => progressContainer.classList.remove('active'), 300);
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        elements.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Export functionality
    function exportMetadata() {
        if (Object.keys(state.currentMetadata).length === 0) {
            showToast('No metadata to export', 'error');
            return;
        }
        
        const dataStr = JSON.stringify(state.currentMetadata, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'metadata_extraction.json';
        link.click();
        
        URL.revokeObjectURL(url);
        showToast('Metadata exported successfully', 'success');
    }

    // Clear functionality
    function clearData() {
        elements.imagePreview.innerHTML = '';
        elements.metadataGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-image"></i>
                <p>Upload an image to begin analysis</p>
            </div>
        `;
        elements.dimensions.textContent = '-';
        elements.fileSize.textContent = '-';
        elements.fileType.textContent = '-';
        state.currentMetadata = {};
        showToast('Data cleared', 'info');
    }

    // Color Analysis
    function analyzeColors(img) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;
            const colorCounts = new Map();
            const totalPixels = pixels.length / 4;

            // Sample pixels for efficiency
            for (let i = 0; i < pixels.length; i += 16) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const color = `rgb(${r},${g},${b})`;
                colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
            }

            // Get dominant colors
            const dominantColors = Array.from(colorCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([color, count]) => ({
                    color,
                    percentage: ((count * 16) / totalPixels * 100).toFixed(1)
                }));

            // Display color palette with animation
            const colorPalette = document.getElementById('colorPalette');
            if (!colorPalette) return;

            colorPalette.innerHTML = '';
            
            dominantColors.forEach(({color, percentage}, index) => {
                const colorItem = document.createElement('div');
                colorItem.className = 'color-item';
                colorItem.style.animationDelay = `${index * 0.1}s`;
                colorItem.innerHTML = `
                    <div class="color-swatch" style="background-color: ${color}"></div>
                    <div class="color-info">
                        <span class="color-value">${color}</span>
                        <span class="color-percentage">${percentage}%</span>
                    </div>
                `;
                colorPalette.appendChild(colorItem);
            });
        } catch (error) {
            console.error('Color analysis failed:', error);
            showToast('Color analysis failed', 'error');
        }
    }

    // Face Detection
    async function detectFaces(img) {
        try {
            if (!window.FaceDetector) {
                throw new Error('Face Detection API not supported');
            }

            const faceDetector = new FaceDetector({
                fastMode: true,
                maxDetectedFaces: 10
            });

            const faces = await faceDetector.detect(img);
            const faceDetectionResults = document.getElementById('faceDetectionResults');
            if (!faceDetectionResults) return;

            if (faces.length === 0) {
                faceDetectionResults.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-user-friends"></i>
                        <p>No faces detected in the image</p>
                    </div>
                `;
                return;
            }

            faceDetectionResults.innerHTML = `
                <div class="face-stats fade-in">
                    <div class="stat-item">
                        <i class="fas fa-user-friends"></i>
                        <span>${faces.length} faces detected</span>
                    </div>
                </div>
                <div class="face-grid">
                    ${faces.map((face, index) => `
                        <div class="face-item fade-in" style="animation-delay: ${index * 0.1}s">
                            <div class="face-box" style="
                                left: ${face.boundingBox.x}px;
                                top: ${face.boundingBox.y}px;
                                width: ${face.boundingBox.width}px;
                                height: ${face.boundingBox.height}px;
                            "></div>
                            <div class="face-info">
                                <span>Face ${index + 1}</span>
                                <span>${Math.round(face.boundingBox.width * face.boundingBox.height / 100)}px²</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            console.error('Face detection failed:', error);
            const faceDetectionResults = document.getElementById('faceDetectionResults');
            if (faceDetectionResults) {
                faceDetectionResults.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Face detection not supported in this browser</span>
                    </div>
                `;
            }
        }
    }

    // Image Quality Analysis
    function analyzeImageQuality(img) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;

            // Calculate brightness
            let totalBrightness = 0;
            for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                totalBrightness += (r + g + b) / 3;
            }
            const averageBrightness = totalBrightness / (pixels.length / 4);

            // Calculate contrast
            let contrast = 0;
            for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const brightness = (r + g + b) / 3;
                contrast += Math.abs(brightness - averageBrightness);
            }
            contrast = contrast / (pixels.length / 4);

            // Calculate sharpness using Laplacian
            let sharpness = 0;
            for (let y = 1; y < canvas.height - 1; y++) {
                for (let x = 1; x < canvas.width - 1; x++) {
                    const idx = (y * canvas.width + x) * 4;
                    const center = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
                    const top = (pixels[idx - canvas.width * 4] + pixels[idx - canvas.width * 4 + 1] + pixels[idx - canvas.width * 4 + 2]) / 3;
                    const bottom = (pixels[idx + canvas.width * 4] + pixels[idx + canvas.width * 4 + 1] + pixels[idx + canvas.width * 4 + 2]) / 3;
                    const left = (pixels[idx - 4] + pixels[idx - 3] + pixels[idx - 2]) / 3;
                    const right = (pixels[idx + 4] + pixels[idx + 5] + pixels[idx + 6]) / 3;
                    sharpness += Math.abs(4 * center - top - bottom - left - right);
                }
            }
            sharpness = sharpness / (canvas.width * canvas.height);

            // Display quality metrics with animation
            const qualityMetrics = document.getElementById('qualityMetrics');
            if (!qualityMetrics) return;

            qualityMetrics.innerHTML = `
                <div class="quality-metrics">
                    <div class="metric-item fade-in" style="animation-delay: 0s">
                        <div class="metric-label">
                            <i class="fas fa-sun"></i>
                            Brightness
                        </div>
                        <div class="metric-value">
                            <div class="progress-bar">
                                <div class="progress" style="width: ${(averageBrightness / 255 * 100)}%"></div>
                            </div>
                            <span>${Math.round(averageBrightness)}</span>
                        </div>
                    </div>
                    <div class="metric-item fade-in" style="animation-delay: 0.1s">
                        <div class="metric-label">
                            <i class="fas fa-adjust"></i>
                            Contrast
                        </div>
                        <div class="metric-value">
                            <div class="progress-bar">
                                <div class="progress" style="width: ${(contrast / 255 * 100)}%"></div>
                            </div>
                            <span>${Math.round(contrast)}</span>
                        </div>
                    </div>
                    <div class="metric-item fade-in" style="animation-delay: 0.2s">
                        <div class="metric-label">
                            <i class="fas fa-camera"></i>
                            Sharpness
                        </div>
                        <div class="metric-value">
                            <div class="progress-bar">
                                <div class="progress" style="width: ${(sharpness / 255 * 100)}%"></div>
                            </div>
                            <span>${Math.round(sharpness)}</span>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Quality analysis failed:', error);
            showToast('Quality analysis failed', 'error');
        }
    }

    // Handle dropdown actions
    function handleDropdownAction(action) {
        switch (action) {
            case 'upload':
                elements.fileInput.click();
                break;
            case 'camera':
                // Implement camera capture
                showToast('Camera capture coming soon', 'info');
                break;
            case 'paste':
                // Implement paste from clipboard
                showToast('Paste from clipboard coming soon', 'info');
                break;
            case 'clear-history':
                if (confirm('Are you sure you want to clear all history?')) {
                    state.history = [];
                    updateHistoryView();
                    saveHistory();
                    showToast('History cleared', 'success');
                }
                break;
            case 'export-history':
                exportHistory();
                break;
            case 'reset-settings':
                if (confirm('Are you sure you want to reset all settings?')) {
                    resetSettings();
                }
                break;
            case 'about':
                showAbout();
                break;
        }
    }

    // Export history
    function exportHistory() {
        if (state.history.length === 0) {
            showToast('No history to export', 'error');
            return;
        }

        const dataStr = JSON.stringify(state.history, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'metadata_history.json';
        link.click();
        
        URL.revokeObjectURL(url);
        showToast('History exported successfully', 'success');
    }

    // Reset settings
    function resetSettings() {
        state.settings = {
            theme: 'red',
            animationSpeed: 'normal',
            enableFaceDetection: true,
            enableColorAnalysis: true,
            enableQualityMetrics: true,
            showTutorial: true
        };
        
        elements.themeSelect.value = state.settings.theme;
        elements.animationSpeed.value = state.settings.animationSpeed;
        
        updateTheme();
        saveSettings();
        showToast('Settings reset to default', 'success');
    }

    // Show about dialog
    function showAbout() {
        const aboutDialog = document.createElement('div');
        aboutDialog.className = 'about-dialog';
        aboutDialog.innerHTML = `
            <div class="about-content">
                <h2>ExifGeek</h2>
                <p>Advanced Image Analysis Tool</p>
                <p>Version 1.0.0</p>
                <button class="action-btn" onclick="this.parentElement.parentElement.remove()">Close</button>
            </div>
        `;
        document.body.appendChild(aboutDialog);
    }

    // Mobile Navigation Setup
    function setupMobileNav() {
        const moreMenu = document.querySelector('.more-menu');
        const dropdownMenu = moreMenu.querySelector('.dropdown-menu');
        const dropdownItems = dropdownMenu.querySelectorAll('.dropdown-item');

        // Toggle dropdown on click
        moreMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            moreMenu.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!moreMenu.contains(e.target)) {
                moreMenu.classList.remove('active');
            }
        });

        // Handle dropdown item clicks
        dropdownItems.forEach(item => {
            item.addEventListener('click', () => {
                moreMenu.classList.remove('active');
            });
        });
    }

    // Initialize mobile features
    function initMobileFeatures() {
        setupMobileNav();
        
        // Add touch feedback to interactive elements
        const touchElements = document.querySelectorAll('.nav-item, .dropdown-item, .action-btn');
        touchElements.forEach(element => {
            element.addEventListener('touchstart', () => {
                element.classList.add('touch-active');
            });
            
            element.addEventListener('touchend', () => {
                element.classList.remove('touch-active');
            });
        });
    }

    // Initialize the app
    init();
    initMobileFeatures();
}); 