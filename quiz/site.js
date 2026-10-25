(() => {
  // The quiz engine only runs on the quiz page (take/).
  if (!document.getElementById('quiz-setup')) return;

  /* Settings and the question bank live in questions.js (QUIZ). */
  const CONFIG = { PASS_THRESHOLD: QUIZ.passMark / 100, RULEBOOK_EDITION: QUIZ.rulebookEdition };
  const QUESTION_BANK = QUIZ.questions;

  const CATEGORY_LABELS = { general:'General Rules', plate:'Plate Umpire', base:'Base Umpire', situations:'Game Situations' };
  const DIFFICULTY_LABELS = { foundation:'Foundation', intermediate:'Intermediate', advanced:'Advanced' };

  const els = {
    modeButtons: Array.from(document.querySelectorAll('.mode-btn')),
    categoryOptions: document.getElementById('category-options'),
    difficultyOptions: document.getElementById('difficulty-options'),
    setupRecord: document.getElementById('quiz-setup-record'),
    startBtn: document.getElementById('start-quiz-btn'),
    setupHint: document.getElementById('setup-hint'),
    quizSetup: document.getElementById('quiz-setup'),
    quizShell: document.getElementById('quiz-shell'),
    quizSummary: document.getElementById('quiz-summary'),
    qmetaCurrent: document.getElementById('qmeta-current'),
    qmetaPercent: document.getElementById('qmeta-percent'),
    bar: document.getElementById('quiz-bar'),
    questionText: document.getElementById('question-text'),
    answers: document.getElementById('answers'),
    feedback: document.getElementById('feedback'),
    feedbackIcon: document.getElementById('feedback-icon'),
    feedbackBody: document.getElementById('feedback-body'),
    submitContext: document.getElementById('submit-context'),
    submitBtn: document.getElementById('submit-answer'),
    recordHeading: document.getElementById('record-heading'),
    recordBody: document.getElementById('record-body'),
    summaryScore: document.getElementById('summary-score'),
    summaryPill: document.getElementById('summary-pill'),
    summaryNote: document.getElementById('summary-note'),
    reviewList: document.getElementById('review-list'),
    retryBtn: document.getElementById('retry-quiz-btn'),
    recordName: document.getElementById('record-name'),
    recordEmail: document.getElementById('record-email'),
    recordAssociation: document.getElementById('record-association')
  };

  const state = {
    mode: 'practice',
    category: null,
    difficulty: null,
    questions: [],
    index: 0,
    selected: null,
    answered: false,
    correctCount: 0,
    missed: [],
    responses: []
  };

  const attemptCounts = {};

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function selectChip(container, dataAttr, value) {
    Array.from(container.children).forEach(chip => {
      const active = chip.dataset[dataAttr] === value;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
  }

  function updateStartAvailability() {
    const hasCategory = !!state.category;
    const hasDifficulty = !!state.difficulty;
    let ready = hasCategory && hasDifficulty;
    if (state.mode === 'recorded') {
      ready = ready && els.recordName.value.trim() && els.recordEmail.value.trim();
    }
    els.startBtn.disabled = !ready;
    els.setupHint.textContent = ready
      ? 'Ready — select START QUIZ to begin.'
      : (state.mode === 'recorded'
          ? 'Select a category, difficulty, and enter your name and email to begin.'
          : 'Select a category and difficulty to begin.');
  }

  function setMode(mode) {
    state.mode = mode;
    els.modeButtons.forEach(btn => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    els.setupRecord.hidden = mode !== 'recorded';
    resetToSetup();
  }

  function resetToSetup() {
    els.quizShell.hidden = true;
    els.quizSummary.hidden = true;
    els.quizSetup.hidden = false;
    state.category = null;
    state.difficulty = null;
    selectChip(els.categoryOptions, 'category', null);
    selectChip(els.difficultyOptions, 'difficulty', null);
    updateStartAvailability();
  }

  els.modeButtons.forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });

  els.categoryOptions.addEventListener('click', (e) => {
    const btn = e.target.closest('.setup-chip');
    if (!btn) return;
    state.category = btn.dataset.category;
    selectChip(els.categoryOptions, 'category', state.category);
    updateStartAvailability();
  });

  els.difficultyOptions.addEventListener('click', (e) => {
    const btn = e.target.closest('.setup-chip');
    if (!btn) return;
    state.difficulty = btn.dataset.difficulty;
    selectChip(els.difficultyOptions, 'difficulty', state.difficulty);
    updateStartAvailability();
  });

  [els.recordName, els.recordEmail].forEach(input => {
    input.addEventListener('input', updateStartAvailability);
  });

  // Links from the landing page can preselect a category, e.g. take/?category=plate
  const preset = new URLSearchParams(location.search).get('category');
  if (preset && CATEGORY_LABELS[preset]) {
    state.category = preset;
    selectChip(els.categoryOptions, 'category', preset);
  }

  function getQuestionSet(category, difficulty) {
    let list = QUESTION_BANK.filter(q => q.active && q.category === category && q.difficulty === difficulty);
    let fellBack = false;
    if (list.length === 0) {
      list = QUESTION_BANK.filter(q => q.active && q.category === category);
      fellBack = true;
    }
    return { list, fellBack };
  }

  els.startBtn.addEventListener('click', () => {
    const { list, fellBack } = getQuestionSet(state.category, state.difficulty);
    if (list.length === 0) {
      els.setupHint.textContent = 'No questions are available yet for this category.';
      return;
    }
    state.questions = list;
    state.index = 0;
    state.correctCount = 0;
    state.missed = [];
    state.responses = [];
    els.quizSetup.hidden = true;
    els.quizSummary.hidden = true;
    els.quizShell.hidden = false;
    els.setupHint.textContent = fellBack
      ? 'No questions at this exact difficulty yet — showing all difficulties for this category.'
      : '';
    renderQuestion();
  });

  function renderQuestion() {
    const q = state.questions[state.index];
    state.selected = null;
    state.answered = false;

    els.qmetaCurrent.textContent = `Question ${state.index + 1} of ${state.questions.length}`;
    const pct = Math.round((state.index / state.questions.length) * 100);
    els.qmetaPercent.textContent = pct + '%';
    els.bar.style.width = pct + '%';

    els.questionText.textContent = q.question;
    els.answers.innerHTML = '';
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'answer';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', 'false');
      btn.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;
      btn.addEventListener('click', () => selectAnswer(i));
      els.answers.appendChild(btn);
    });

    els.feedback.style.display = 'none';
    els.feedback.classList.remove('is-correct', 'is-incorrect');
    els.submitBtn.textContent = 'SUBMIT ANSWER';
    els.submitBtn.disabled = false;

    els.submitContext.textContent = `${state.mode === 'recorded' ? 'Recorded' : 'Practice'} quiz · ${CATEGORY_LABELS[state.category]} · ${DIFFICULTY_LABELS[state.difficulty]}`;

    renderRecordPanel();
  }

  function selectAnswer(i) {
    if (state.answered) return;
    state.selected = i;
    Array.from(els.answers.children).forEach((btn, idx) => {
      const isSel = idx === i;
      btn.classList.toggle('selected', isSel);
      btn.setAttribute('aria-checked', String(isSel));
    });
  }

  function renderRecordPanel() {
    if (state.mode === 'recorded') {
      els.recordHeading.textContent = 'RECORDED ASSESSMENT';
      const key = `${state.category}:${state.difficulty}`;
      const attemptNumber = (attemptCounts[key] || 0) + 1;
      els.recordBody.innerHTML = `
        <div class="record-line"><span>Name</span><strong>${escapeHtml(els.recordName.value || '—')}</strong></div>
        <div class="record-line"><span>Association</span><strong>${escapeHtml(els.recordAssociation.value || '—')}</strong></div>
        <div class="record-line"><span>Difficulty</span><strong>${DIFFICULTY_LABELS[state.difficulty]}</strong></div>
        <div class="record-line"><span>Attempt</span><strong>Attempt ${attemptNumber}</strong></div>
        <div class="saved">
          <strong>Your score will be saved and sent to the site administrator when this quiz is completed.</strong>
        </div>`;
    } else {
      els.recordHeading.textContent = 'PRACTICE MODE';
      els.recordBody.innerHTML = `
        <div class="record-line"><span>Category</span><strong>${CATEGORY_LABELS[state.category]}</strong></div>
        <div class="record-line"><span>Difficulty</span><strong>${DIFFICULTY_LABELS[state.difficulty]}</strong></div>
        <div class="record-note">Practice attempts are not saved or emailed — use them to build confidence before a recorded quiz.</div>`;
    }
  }

  els.submitBtn.addEventListener('click', () => {
    if (!state.answered) {
      if (state.selected === null) {
        els.feedback.style.display = 'block';
        els.feedback.classList.remove('is-correct', 'is-incorrect');
        els.feedbackIcon.textContent = '';
        els.feedbackBody.textContent = 'Select an answer before submitting.';
        return;
      }
      const q = state.questions[state.index];
      const isCorrect = state.selected === q.correct;
      state.answered = true;

      Array.from(els.answers.children).forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === q.correct) btn.classList.add('correct-answer');
        else if (idx === state.selected) btn.classList.add('incorrect-answer');
      });

      state.responses.push({ q, chosen: state.selected, isCorrect });
      if (isCorrect) state.correctCount++;
      else state.missed.push(q);

      els.feedback.style.display = 'block';
      if (state.mode === 'practice') {
        els.feedback.classList.add(isCorrect ? 'is-correct' : 'is-incorrect');
        els.feedbackIcon.textContent = isCorrect ? '✓' : '✕';
        els.feedbackBody.innerHTML = `<strong>${isCorrect ? 'Correct' : 'Not quite'}:</strong> ${q.ruling} ${q.explanation}
          <br><span style="opacity:.85">Reference: ${q.ruleRef} · ${q.edition}</span>`;
      } else {
        els.feedback.classList.add('is-correct');
        els.feedbackIcon.textContent = '•';
        els.feedbackBody.textContent = 'Answer recorded. Full feedback for every question will appear in your results summary.';
      }

      els.submitBtn.textContent = state.index === state.questions.length - 1 ? 'FINISH QUIZ' : 'NEXT QUESTION';
      return;
    }

    if (state.index < state.questions.length - 1) {
      state.index++;
      renderQuestion();
    } else {
      finishQuiz();
    }
  });

  function finishQuiz() {
    const total = state.questions.length;
    const percentage = Math.round((state.correctCount / total) * 100);
    const passed = (state.correctCount / total) >= CONFIG.PASS_THRESHOLD;

    els.quizShell.hidden = true;
    els.quizSummary.hidden = false;

    els.summaryScore.innerHTML = `${percentage}%<small>${state.correctCount} of ${total} correct</small>`;
    els.summaryPill.textContent = passed ? 'PASS' : 'REVIEW NEEDED';
    els.summaryPill.className = 'summary-pill ' + (passed ? 'pass' : 'fail');

    els.reviewList.innerHTML = '';
    if (state.missed.length === 0) {
      const div = document.createElement('div');
      div.className = 'review-item was-correct';
      div.innerHTML = '<strong>All questions correct.</strong><p>Strong result — try a harder difficulty or a different category next.</p>';
      els.reviewList.appendChild(div);
    } else {
      state.missed.forEach(q => {
        const div = document.createElement('div');
        div.className = 'review-item';
        div.innerHTML = `<strong>${escapeHtml(q.question)}</strong>
          <p>${q.ruling} ${q.explanation}</p>
          <div class="ref">${q.ruleRef} · ${q.edition}</div>`;
        els.reviewList.appendChild(div);
      });
    }

    if (state.mode === 'recorded') {
      const key = `${state.category}:${state.difficulty}`;
      attemptCounts[key] = (attemptCounts[key] || 0) + 1;

      // Same shape the Worker and dashboard expect. One line per question: "G1: chosen answer (wrong)".
      const payload = {
        quiz: `${QUIZ.title} · ${CATEGORY_LABELS[state.category]} · ${DIFFICULTY_LABELS[state.difficulty]}`,
        name: els.recordName.value.trim(),
        email: els.recordEmail.value.trim(),
        association: els.recordAssociation.value.trim(),
        correct: state.correctCount,
        total,
        percent: percentage,
        result: passed ? 'PASS' : 'FAIL',
        answers: state.responses.map(r => `${r.q.id}: ${r.q.options[r.chosen]}${r.isCorrect ? '' : ' (wrong)'}`).join('\n')
      };

      els.summaryNote.textContent = 'Saving your result…';
      const save = () => saveRecordedResult(payload).then(res => {
        if (res.saved) {
          els.summaryNote.textContent = res.emailed
            ? 'Your score has been saved and sent to the site administrator.'
            : 'Your score has been saved. (The administrator email did not send, but your result is safely on file.)';
        } else {
          els.summaryNote.innerHTML = 'Your score could not be saved right now. <button type="button" class="btn btn-gold" style="min-height:34px;margin-left:8px">RETRY</button>';
          els.summaryNote.querySelector('button').addEventListener('click', () => { els.summaryNote.textContent = 'Saving your result…'; save(); });
        }
      });
      save();

    } else {
      els.summaryNote.textContent = 'This was a practice attempt — it was not saved or emailed. Switch to Recorded Quiz to have your score kept on file.';
    }
  }

  // text/plain keeps this a "simple" request (no CORS preflight), and the Worker's reply
  // is readable, so "saved" is a real confirmation. The Worker saves first, then emails.
  async function saveRecordedResult(payload) {
    try {
      const res = await fetch(QUIZ.WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      console.error(err);
      return { saved: false, error: String(err) };
    }
  }

  els.retryBtn.addEventListener('click', resetToSetup);

  updateStartAvailability();

})();

(() => {
  /* ---- Carousel logic ---- */
  document.querySelectorAll('[data-carousel]').forEach(group => {
    const track = group.querySelector('.logo-track');
    const viewport = group.querySelector('.logo-window');
    const prev = group.querySelector('.prev');
    const next = group.querySelector('.next');
    let offset = 0;
    const step = 172;

    const update = () => {
      track.style.transform = `translateX(${-offset}px)`;
    };

    next.addEventListener('click', () => {
      const max = Math.max(0, track.scrollWidth - viewport.clientWidth);
      offset = Math.min(max, offset + step);
      update();
    });
    prev.addEventListener('click', () => {
      offset = Math.max(0, offset - step);
      update();
    });
  });
})();
