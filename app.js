// STATE MANAGEMENT
const state = {
    theologians: [],
    filteredTheologians: [],
    searchQuery: '',
    activeEra: 'all',
    activeLocus: 'summary', // 'summary', 'theology_proper', 'christology', 'soteriology', 'ecclesiology_sacraments', 'eschatology'
    selectedForCompare: []  // Maximum 2 theologians
};

// ERA STYLING MAP (To inject CSS custom properties dynamically)
const eraColorMap = {
    'patristic': 'var(--color-patristic)',
    'medieval': 'var(--color-medieval)',
    'reformation': 'var(--color-reformation)',
    'scholasticism': 'var(--color-scholasticism)',
    'modern': 'var(--color-modern)',
    'contemporary': 'var(--color-contemporary)'
};

const eraLabelMap = {
    'patristic': '초대 교부',
    'medieval': '중세 신학',
    'reformation': '종교개혁',
    'scholasticism': '개혁 정통주의',
    'modern': '근대 신학',
    'contemporary': '현대 신학'
};

const locusLabelMap = {
    'theology_proper': '신론 (God)',
    'christology': '기독론 (Christ)',
    'soteriology': '구원론 (Salvation)',
    'ecclesiology_sacraments': '교회/성례론 (Church)',
    'eschatology': '종말론 (Eschatology)'
};

// HELPER: Match theologian in database by Ko/En name substrings
const findTheologianByName = (name) => {
    const cleanName = name.replace(/\s+/g, '').toLowerCase();
    return state.theologians.find(t => {
        const tNameKo = t.name_ko.replace(/\s+/g, '').toLowerCase();
        const tNameEn = t.name_en.replace(/\s+/g, '').toLowerCase();
        return cleanName.includes(tNameKo) || tNameKo.includes(cleanName) ||
               cleanName.includes(tNameEn) || tNameEn.includes(cleanName);
    });
};

// DOM ELEMENTS
const theologiansGrid = document.getElementById('theologians-grid');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const eraFiltersContainer = document.getElementById('era-filters');
const locusFiltersContainer = document.getElementById('locus-filters');
const resultsCount = document.getElementById('results-count');

// Compare Mode Elements
const compareBar = document.getElementById('compare-bar');
const compareStatusText = document.getElementById('compare-status-text');
const btnCompareTrigger = document.getElementById('btn-compare-trigger');
const btnCompareReset = document.getElementById('btn-compare-reset');

// Detail Modal Elements
const detailModal = document.getElementById('detail-modal');
const modalClose = document.getElementById('modal-close');
const modalBackdrop = document.getElementById('modal-backdrop');

// Comparison Modal Elements
const compareModal = document.getElementById('compare-modal');
const compareClose = document.getElementById('compare-close');
const compareBackdrop = document.getElementById('compare-backdrop');

// INITIALIZATION
window.addEventListener('DOMContentLoaded', () => {
    fetchData();
    setupEventListeners();
});

// FETCH DATA
async function fetchData() {
    try {
        const response = await fetch('data/theologians.json');
        if (!response.ok) {
            throw new Error('데이터 파일을 불러오는 데 실패했습니다.');
        }
        state.theologians = await response.json();
        applyFiltersAndRender();
    } catch (error) {
        console.error('Error fetching theologians:', error);
        theologiansGrid.innerHTML = `
            <div class="empty-state">
                <span>❌</span>
                <p>데이터를 불러오는 중 오류가 발생했습니다: ${error.message}</p>
            </div>
        `;
    }
}

// SETUP EVENT LISTENERS
function setupEventListeners() {
    // Real-time Search
    searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
        applyFiltersAndRender();
    });

    // Clear Search Button
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        state.searchQuery = '';
        clearSearchBtn.style.display = 'none';
        searchInput.focus();
        applyFiltersAndRender();
    });

    // Era Filter Buttons
    eraFiltersContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        
        // Toggle Active Class
        eraFiltersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        state.activeEra = btn.dataset.era;
        applyFiltersAndRender();
    });

    // Locus Selector Buttons
    locusFiltersContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.locus-btn');
        if (!btn) return;

        locusFiltersContainer.querySelectorAll('.locus-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        state.activeLocus = btn.dataset.locus;
        applyFiltersAndRender();
    });

    // Compare Trigger Button
    btnCompareTrigger.addEventListener('click', openComparisonModal);

    // Compare Reset Button
    btnCompareReset.addEventListener('click', resetComparison);

    // Detail Modal Closing
    modalClose.addEventListener('click', closeDetailModal);
    modalBackdrop.addEventListener('click', closeDetailModal);

    // Comparison Modal Closing
    compareClose.addEventListener('click', closeCompareModal);
    compareBackdrop.addEventListener('click', closeCompareModal);

    // ESC key closes modals
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDetailModal();
            closeCompareModal();
        }
    });
}

// SEARCH & FILTER ENGINE
function applyFiltersAndRender() {
    state.filteredTheologians = state.theologians.filter(t => {
        // 1. Era Filtering
        const matchesEra = state.activeEra === 'all' || t.era === state.activeEra;
        
        // 2. Search Query Filtering
        let matchesSearch = true;
        if (state.searchQuery) {
            const query = state.searchQuery;
            
            // Check basic fields
            const nameKoMatch = t.name_ko.toLowerCase().includes(query);
            const nameEnMatch = t.name_en.toLowerCase().includes(query);
            const summaryMatch = t.summary.toLowerCase().includes(query);
            const regionMatch = t.region.toLowerCase().includes(query);
            
            // Check tags
            const tagsMatch = t.key_themes.some(tag => tag.toLowerCase().includes(query));
            
            // Check key works
            const worksMatch = t.key_works.some(work => work.toLowerCase().includes(query));
            
            // Check core doctrine texts
            const doctrinesMatch = Object.values(t.core_doctrines).some(doc => doc.toLowerCase().includes(query));
            
            matchesSearch = nameKoMatch || nameEnMatch || summaryMatch || regionMatch || tagsMatch || worksMatch || doctrinesMatch;
        }

        return matchesEra && matchesSearch;
    });

    renderGrid();
}

// RENDER DASHBOARD GRID
function renderGrid() {
    resultsCount.textContent = `검색 결과: ${state.filteredTheologians.length}명의 신학자`;

    if (state.filteredTheologians.length === 0) {
        theologiansGrid.innerHTML = `
            <div class="empty-state">
                <span>🔍</span>
                <p>검색 조건에 맞는 신학자가 아카이브에 존재하지 않습니다.</p>
                <button class="btn btn-secondary" id="btn-reset-filters">필터 초기화</button>
            </div>
        `;
        document.getElementById('btn-reset-filters').addEventListener('click', resetAllFilters);
        return;
    }

    theologiansGrid.innerHTML = state.filteredTheologians.map(t => {
        const isChecked = state.selectedForCompare.some(selected => selected.id === t.id);
        const cardColor = eraColorMap[t.era] || 'var(--accent-blue)';
        
        // Determine whether to display general summary or locus detail
        let bodyContentHtml = '';
        if (state.activeLocus === 'summary') {
            bodyContentHtml = `<p class="card-summary">${t.summary}</p>`;
        } else {
            const locusTitle = locusLabelMap[state.activeLocus];
            const locusContent = t.core_doctrines[state.activeLocus] || '사상 진술 없음';
            bodyContentHtml = `
                <div class="card-locus-detail" style="border-left: 3px solid ${cardColor}">
                    <div class="locus-label-mini">${locusTitle}</div>
                    <div class="locus-text-mini">${locusContent}</div>
                </div>
            `;
        }

        // Generate tags HTML
        const tagsHtml = t.key_themes.slice(0, 3).map(tag => `<span class="tag">#${tag}</span>`).join('');

        return `
            <div class="theologian-card" data-id="${t.id}" style="--card-color: ${cardColor}">
                <div class="card-header">
                    <div class="card-title-group">
                        <h3>${t.name_ko}</h3>
                        <p>${t.name_en}</p>
                    </div>
                    <span class="era-badge">${t.era_ko}</span>
                </div>
                
                <div class="card-meta">
                    <span>📅 ${t.years}</span>
                    <span>📍 ${t.region}</span>
                </div>

                ${bodyContentHtml}

                <div class="card-tags">
                    ${tagsHtml}
                </div>

                <div class="card-footer">
                    <label class="checkbox-container" data-card-id="${t.id}">
                        <input type="checkbox" class="compare-checkbox" data-id="${t.id}" ${isChecked ? 'checked' : ''}>
                        <span>비교 선택</span>
                    </label>
                    <button class="btn-more" data-id="${t.id}">상세 프로필 →</button>
                </div>
            </div>
        `;
    }).join('');

    // Attach card event listeners
    const cards = theologiansGrid.querySelectorAll('.theologian-card');
    cards.forEach(card => {
        const id = card.dataset.id;
        
        // Card click opens detail modal, EXCEPT when clicking checkbox or "비교 선택" label
        card.addEventListener('click', (e) => {
            if (e.target.closest('.checkbox-container') || e.target.closest('.compare-checkbox')) {
                return; // Let checkbox event fire normally
            }
            openDetailModal(id);
        });

        // Checkbox change event
        const checkbox = card.querySelector('.compare-checkbox');
        checkbox.addEventListener('change', (e) => {
            handleComparisonSelection(id, e.target.checked);
        });
    });
}

// HANDLE COMPARISON SELECTION
function handleComparisonSelection(id, isChecked) {
    const theologian = state.theologians.find(t => t.id === id);
    if (!theologian) return;

    if (isChecked) {
        if (state.selectedForCompare.length >= 2) {
            // Already 2 selected, prevent checking and alert user
            alert('최대 2명의 신학자만 선택하여 비교할 수 있습니다.');
            // Revert checkbox
            const checkbox = theologiansGrid.querySelector(`.compare-checkbox[data-id="${id}"]`);
            if (checkbox) checkbox.checked = false;
            return;
        }
        state.selectedForCompare.push(theologian);
    } else {
        state.selectedForCompare = state.selectedForCompare.filter(t => t.id !== id);
    }

    updateCompareBar();
}

// UPDATE COMPARE BAR STATS
function updateCompareBar() {
    const count = state.selectedForCompare.length;
    
    if (count > 0) {
        compareBar.style.display = 'flex';
        
        if (count === 1) {
            compareStatusText.innerHTML = `⚖️ <strong>${state.selectedForCompare[0].name_ko}</strong> 신학자가 선택되었습니다. 비교할 두 번째 대상을 마저 선택해 주세요. (1/2)`;
            btnCompareTrigger.disabled = true;
        } else if (count === 2) {
            compareStatusText.innerHTML = `⚖️ <strong>${state.selectedForCompare[0].name_ko}</strong> & <strong>${state.selectedForCompare[1].name_ko}</strong> 신학자 선택 완료! 두 거장의 사상을 비교해 보세요. (2/2)`;
            btnCompareTrigger.disabled = false;
        }
    } else {
        compareBar.style.display = 'none';
        btnCompareTrigger.disabled = true;
    }
}

// RESET COMPARISON SELECTION
function resetComparison() {
    state.selectedForCompare = [];
    updateCompareBar();
    
    // Uncheck all checkboxes on DOM
    const checkboxes = theologiansGrid.querySelectorAll('.compare-checkbox');
    checkboxes.forEach(cb => cb.checked = false);
}

// RESET ALL FILTERS
function resetAllFilters() {
    searchInput.value = '';
    state.searchQuery = '';
    clearSearchBtn.style.display = 'none';
    
    state.activeEra = 'all';
    eraFiltersContainer.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.era === 'all');
    });

    state.activeLocus = 'summary';
    locusFiltersContainer.querySelectorAll('.locus-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.locus === 'summary');
    });

    applyFiltersAndRender();
}

// OPEN DETAIL MODAL
function openDetailModal(id) {
    const t = state.theologians.find(item => item.id === id);
    if (!t) return;

    const cardColor = eraColorMap[t.era] || 'var(--accent-blue)';
    detailModal.style.setProperty('--card-color', cardColor);

    // Populate elements
    document.getElementById('modal-era').textContent = t.era_ko;
    document.getElementById('modal-title-ko').textContent = t.name_ko;
    document.getElementById('modal-title-en').textContent = t.name_en;
    document.getElementById('modal-years').textContent = `📅 활동 시기: ${t.years}`;
    document.getElementById('modal-region').textContent = `📍 지역: ${t.region}`;
    document.getElementById('modal-summary').textContent = t.summary;
    
    // Theological influence relations
    const influenceCard = document.getElementById('modal-influence-card');
    const influencedByContainer = document.getElementById('modal-influenced-by');
    const influencedThemContainer = document.getElementById('modal-influenced-them');

    if ((t.influenced_by && t.influenced_by.length > 0) || (t.influenced_them && t.influenced_them.length > 0)) {
        influenceCard.style.display = 'block';
        
        const renderTags = (namesArray) => {
            if (!namesArray || namesArray.length === 0) return '';
            return namesArray.map(name => {
                const target = findTheologianByName(name);
                if (target) {
                    return `<span class="influence-tag clickable" data-target-id="${target.id}" title="${target.name_ko}의 상세 프로필 보기">${name}</span>`;
                } else {
                    return `<span class="influence-tag">${name}</span>`;
                }
            }).join('');
        };

        influencedByContainer.innerHTML = t.influenced_by && t.influenced_by.length > 0
            ? renderTags(t.influenced_by)
            : '<span style="font-size: 0.82rem; color: var(--text-muted); font-style: italic; padding: 4px 0;">기록된 스승 정보 없음</span>';
            
        influencedThemContainer.innerHTML = t.influenced_them && t.influenced_them.length > 0
            ? renderTags(t.influenced_them)
            : '<span style="font-size: 0.82rem; color: var(--text-muted); font-style: italic; padding: 4px 0;">알려진 후대 영향 없음</span>';

        // Add click events to clickable tags
        const clickableTags = influenceCard.querySelectorAll('.influence-tag.clickable');
        clickableTags.forEach(tag => {
            tag.addEventListener('click', (e) => {
                const targetId = e.currentTarget.dataset.targetId;
                openDetailModal(targetId);
            });
        });
    } else {
        influenceCard.style.display = 'none';
    }

    // Key works
    const worksList = document.getElementById('modal-works');
    worksList.innerHTML = t.key_works.map(work => `<li>${work}</li>`).join('');

    // Famous quote
    document.getElementById('modal-quote').textContent = t.famous_quote;

    // Key concepts
    const conceptsCard = document.getElementById('modal-concepts-card');
    const conceptsContainer = document.getElementById('modal-concepts');
    if (t.key_concepts && t.key_concepts.length > 0) {
        conceptsCard.style.display = 'block';
        conceptsContainer.innerHTML = t.key_concepts.map(concept => `
            <div class="concept-item">
                <div class="concept-term">${concept.term}</div>
                <div class="concept-definition">${concept.definition}</div>
            </div>
        `).join('');
    } else {
        conceptsCard.style.display = 'none';
    }

    // Detailed Loci Table
    document.getElementById('modal-locus-proper').textContent = t.core_doctrines.theology_proper;
    document.getElementById('modal-locus-christology').textContent = t.core_doctrines.christology;
    document.getElementById('modal-locus-soteriology').textContent = t.core_doctrines.soteriology;
    document.getElementById('modal-locus-ecclesiology').textContent = t.core_doctrines.ecclesiology_sacraments;
    document.getElementById('modal-locus-eschatology').textContent = t.core_doctrines.eschatology;

    // Impact
    document.getElementById('modal-impact').textContent = t.impact;

    // Open Modal
    detailModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Lock background scrolling

    // Reset scroll position to top
    const modalContent = detailModal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }
}

// CLOSE DETAIL MODAL
function closeDetailModal() {
    detailModal.classList.remove('active');
    document.body.style.overflow = '';
}

// OPEN COMPARISON MODAL
function openComparisonModal() {
    if (state.selectedForCompare.length !== 2) return;

    const t1 = state.selectedForCompare[0];
    const t2 = state.selectedForCompare[1];

    // Headers
    document.getElementById('comp-era-1').textContent = t1.era_ko;
    document.getElementById('comp-era-1').style.color = eraColorMap[t1.era];
    document.getElementById('comp-name-1').textContent = t1.name_ko;
    document.getElementById('comp-dates-1').textContent = t1.years;

    document.getElementById('comp-era-2').textContent = t2.era_ko;
    document.getElementById('comp-era-2').style.color = eraColorMap[t2.era];
    document.getElementById('comp-name-2').textContent = t2.name_ko;
    document.getElementById('comp-dates-2').textContent = t2.years;

    // Set Data Attribute for responsive label headers
    const cells = compareModal.querySelectorAll('.compare-cell');
    cells.forEach(cell => {
        if (cell.classList.contains('cell-1')) {
            cell.setAttribute('data-theologian-name', t1.name_ko);
        } else {
            cell.setAttribute('data-theologian-name', t2.name_ko);
        }
    });

    // Rows Data Injection
    document.getElementById('comp-summary-1').textContent = t1.summary;
    document.getElementById('comp-summary-2').textContent = t2.summary;

    document.getElementById('comp-proper-1').textContent = t1.core_doctrines.theology_proper;
    document.getElementById('comp-proper-2').textContent = t2.core_doctrines.theology_proper;

    document.getElementById('comp-christ-1').textContent = t1.core_doctrines.christology;
    document.getElementById('comp-christ-2').textContent = t2.core_doctrines.christology;

    document.getElementById('comp-soter-1').textContent = t1.core_doctrines.soteriology;
    document.getElementById('comp-soter-2').textContent = t2.core_doctrines.soteriology;

    document.getElementById('comp-ecc-1').textContent = t1.core_doctrines.ecclesiology_sacraments;
    document.getElementById('comp-ecc-2').textContent = t2.core_doctrines.ecclesiology_sacraments;

    document.getElementById('comp-esch-1').textContent = t1.core_doctrines.eschatology;
    document.getElementById('comp-esch-2').textContent = t2.core_doctrines.eschatology;

    // Tags Row
    const t1Tags = t1.key_themes.map(tag => `<span class="tag">#${tag}</span>`).join(' ');
    const t2Tags = t2.key_themes.map(tag => `<span class="tag">#${tag}</span>`).join(' ');
    document.getElementById('comp-tags-1').innerHTML = t1Tags;
    document.getElementById('comp-tags-2').innerHTML = t2Tags;

    // Show Modal
    compareModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Reset scroll position to top
    const compareContent = compareModal.querySelector('.modal-content');
    if (compareContent) {
        compareContent.scrollTop = 0;
    }
}

// CLOSE COMPARISON MODAL
function closeCompareModal() {
    compareModal.classList.remove('active');
    document.body.style.overflow = '';
}
