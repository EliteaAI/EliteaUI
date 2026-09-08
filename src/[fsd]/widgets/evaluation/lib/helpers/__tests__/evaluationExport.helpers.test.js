import { describe, expect, it } from 'vitest';

import {
  buildEvaluationResultsSheets,
  evaluationExportFileName,
  resolveExportDatasets,
} from '../evaluationExport.helpers';
import { buildScorecard } from '../scorecard.helpers';

// One AI dimension with a target, one Human dimension nobody has scored yet, and two cases —
// enough for the export to have to tell Met, Missed, Pending and Error apart.
const makeRun = () => ({
  id: 42,
  status: 'finished',
  started_at: '2026-08-24T09:15:00Z',
  headline_score: 78.5,
  snapshot: {
    suite: { id: 3, name: 'Response Quality', dataset_id: 9, judge_model: { model_name: 'gpt-4o' } },
    cases: [
      {
        id: 15,
        order_index: 0,
        input: 'How do I reset my password?',
        output: 'Open Settings and pick Reset password.',
        expected_output: 'Point the user at Settings.',
        source_type: 'manual',
        variables: { locale: 'en' },
      },
      { id: 16, order_index: 1, input: 'Refund policy?', output: 'No idea.', expected_output: '30 days.' },
    ],
    bindings: [
      {
        dimension_id: 4,
        engine: 'ai',
        weight: 3,
        target: 4,
        target_operator: '>=',
        order_index: 0,
        evidence_scope: { structure: false, input: true, output: true },
      },
      { dimension_id: 5, engine: 'human', weight: 1, order_index: 1 },
    ],
    dimensions: {
      4: {
        name: 'Accuracy',
        description: 'Score how factually correct the answer is.',
        scale_type: 'ordinal',
        scale_min: 1,
        scale_max: 5,
        polarity: 'higher_better',
      },
      5: { name: 'Tone', scale_type: 'binary', scale_min: 0, scale_max: 1 },
    },
  },
});

const makeScorecard = (results = []) => buildScorecard({ run: makeRun(), results });

const RESULTS = [
  { dataset_case_id: 15, dimension_id: 4, status: 'ok', native_score: 5, verdict: { rationale: 'Spot on.' } },
  { dataset_case_id: 16, dimension_id: 4, status: 'ok', native_score: 2, verdict: { rationale: 'Wrong.' } },
];

const sheetByName = (sheets, name) => sheets.find(sheet => sheet.sheetName === name);
const sectionByTitle = (sheet, title) => sheet.sections.find(section => section.title === title);
const metaValue = (sheet, label) => sheet.metadata.find(([key]) => key === label)?.[1];

describe('evaluationExportFileName', () => {
  it('names the file after the agent, suite and the run date', () => {
    expect(
      evaluationExportFileName({
        agentName: 'Support Agent',
        suiteName: 'Response Quality',
        run: makeRun(),
      }),
    ).toBe('support-agent_response-quality_2026-08-24_run-42.xlsx');
  });

  it('falls back for a suite that was never named', () => {
    expect(evaluationExportFileName({ agentName: 'Bot', suiteName: '', run: makeRun() })).toBe(
      'bot_untitled-suite_2026-08-24_run-42.xlsx',
    );
  });

  it('drops characters an operating system would reject from a file name', () => {
    expect(evaluationExportFileName({ agentName: 'a/b:c*d', suiteName: 'e?f', run: makeRun() })).toBe(
      'a-b-c-d_e-f_2026-08-24_run-42.xlsx',
    );
  });
});

describe('buildEvaluationResultsSheets — workbook shape', () => {
  it('leads with Summary and adds one sheet per dimension and per case', () => {
    const sheets = buildEvaluationResultsSheets(makeScorecard(RESULTS), { run: makeRun() });

    expect(sheets.map(sheet => sheet.sheetName)).toEqual([
      'Summary',
      'Accuracy',
      'Tone',
      'Case 15',
      'Case 16',
    ]);
  });

  it('carries the run metadata the Results header shows', () => {
    const [summary] = buildEvaluationResultsSheets(makeScorecard(RESULTS), {
      run: makeRun(),
      meta: {
        agentName: 'Support Agent',
        agentVersion: 'v2',
        judgeModel: 'gpt-4o',
        datasetNames: ['QA set'],
      },
    });

    expect(metaValue(summary, 'Agent name')).toBe('Support Agent');
    expect(metaValue(summary, 'Agent version')).toBe('v2');
    expect(metaValue(summary, 'Evaluation run ID')).toBe(42);
    expect(metaValue(summary, 'Evaluation status')).toBe('Finished');
    expect(metaValue(summary, 'Judge Model')).toBe('gpt-4o');
    expect(metaValue(summary, 'Dataset')).toBe('QA set');
    expect(metaValue(summary, 'Number of dimensions')).toBe(2);
    expect(metaValue(summary, 'Number of cases')).toBe(2);
  });

  it('reports a pending human dimension as Pending rather than as a completed score', () => {
    const [summary] = buildEvaluationResultsSheets(makeScorecard(RESULTS), { run: makeRun() });
    const rows = sectionByTitle(summary, 'Dimension Results').rows;

    expect(rows[0]).toMatchObject({
      dimension: 'Accuracy',
      evaluator: 'AI',
      status: 'Completed',
      met: '1/2',
    });
    expect(rows[1]).toMatchObject({ dimension: 'Tone', evaluator: 'Human', status: 'Pending' });
    expect(rows[1].average).toBe('—');

    const overall = sectionByTitle(summary, 'Overall Results').rows;
    expect(overall.find(row => row.metric === 'Pending Human evaluations').value).toBe(2);
  });

  it('exports scores as numbers so the sheet can still sum them', () => {
    const [summary] = buildEvaluationResultsSheets(makeScorecard(RESULTS), { run: makeRun() });
    const overall = sectionByTitle(summary, 'Overall Results').rows;

    expect(overall.find(row => row.metric === 'Total Score').value).toBe(78.5);
    expect(sectionByTitle(summary, 'Dimension Results').rows[0].average).toBe(3.5);
  });
});

describe('buildEvaluationResultsSheets — dimension sheets', () => {
  it('states the dimension configuration and one row per case', () => {
    const sheets = buildEvaluationResultsSheets(makeScorecard(RESULTS), { run: makeRun() });
    const sheet = sheetByName(sheets, 'Accuracy');

    expect(metaValue(sheet, 'Dimension')).toBe('Accuracy');
    expect(metaValue(sheet, 'Evaluation run ID')).toBe(42);
    expect(metaValue(sheet, 'Scale')).toBe('Ordinal (1–5)');
    expect(metaValue(sheet, 'Importance')).toBe('High');
    expect(metaValue(sheet, 'Evaluation targets')).toBe('Output, Input');
    expect(metaValue(sheet, 'Met target')).toBe(1);
    expect(metaValue(sheet, 'Missed target')).toBe(1);

    const rows = sectionByTitle(sheet, 'Case-Level Results').rows;
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ caseId: 15, score: 5, target: '≥4', result: 'Met', evaluator: 'AI' });
    expect(rows[1]).toMatchObject({ caseId: 16, score: 2, result: 'Missed', explanation: 'Wrong.' });
  });

  it('leaves a pending human case without a score and marks it Pending', () => {
    const sheets = buildEvaluationResultsSheets(makeScorecard(RESULTS), { run: makeRun() });
    const rows = sectionByTitle(sheetByName(sheets, 'Tone'), 'Case-Level Results').rows;

    expect(rows[0]).toMatchObject({ caseId: 15, score: 'Pending', result: 'Pending' });
  });

  it('reports a failed evaluation as an error with its details, not as a miss', () => {
    const scorecard = makeScorecard([
      {
        dataset_case_id: 15,
        dimension_id: 4,
        status: 'error',
        native_score: null,
        evidence: { stderr: "NameError: name 'json' is not defined" },
      },
    ]);
    const sheets = buildEvaluationResultsSheets(scorecard, { run: makeRun() });
    const rows = sectionByTitle(sheetByName(sheets, 'Accuracy'), 'Case-Level Results').rows;

    expect(rows[0].result).toBe('Error');
    expect(rows[0].errorDetails).toBe("NameError: name 'json' is not defined");
    expect(metaValue(sheetByName(sheets, 'Accuracy'), 'Errors')).toBe(1);
  });
});

describe('buildEvaluationResultsSheets — case sheets', () => {
  it('exports the full case content, untruncated', () => {
    const sheets = buildEvaluationResultsSheets(makeScorecard(RESULTS), {
      run: makeRun(),
      meta: { datasetNameByCaseId: { 15: 'QA set' } },
    });
    const sheet = sheetByName(sheets, 'Case 15');

    expect(metaValue(sheet, 'Case ID')).toBe(15);
    expect(metaValue(sheet, 'Evaluation run ID')).toBe(42);
    expect(metaValue(sheet, 'Dataset')).toBe('QA set');
    expect(metaValue(sheet, 'Case source')).toBe('Manual');

    const rows = sectionByTitle(sheet, 'Evaluation Content').rows;
    expect(rows.map(row => row.field)).toEqual(['Input', 'Variables', 'Actual Output', 'Expected Output']);
    expect(rows[0].value).toBe('How do I reset my password?');
  });

  it('says so explicitly when a value was never provided', () => {
    const sheets = buildEvaluationResultsSheets(makeScorecard(RESULTS), { run: makeRun() });
    const rows = sectionByTitle(sheetByName(sheets, 'Case 16'), 'Evaluation Content').rows;

    expect(rows.find(row => row.field === 'Variables')).toBeUndefined();
    expect(rows.find(row => row.field === 'Actual Output').value).toBe('No idea.');
  });

  it('adds Agent Instructions when a dimension evaluated against the agent structure', () => {
    const run = makeRun();
    run.snapshot.bindings[0].evidence_scope = { structure: true, input: true, output: true };
    run.snapshot.cases[0].structure = 'You are a support agent.';
    const sheets = buildEvaluationResultsSheets(buildScorecard({ run, results: RESULTS }), { run });
    const rows = sectionByTitle(sheetByName(sheets, 'Case 15'), 'Evaluation Content').rows;

    expect(rows.find(row => row.field === 'Agent Instructions').value).toBe('You are a support agent.');
  });

  it('exports long content in full, without the preview truncation', () => {
    const run = makeRun();
    const longInput = 'x'.repeat(5000);
    run.snapshot.cases[0].input = longInput;
    const sheets = buildEvaluationResultsSheets(buildScorecard({ run, results: RESULTS }), { run });
    const rows = sectionByTitle(sheetByName(sheets, 'Case 15'), 'Evaluation Content').rows;

    expect(rows.find(row => row.field === 'Input').value).toBe(longInput);
  });

  it('lists every dimension the case was evaluated against', () => {
    const sheets = buildEvaluationResultsSheets(makeScorecard(RESULTS), { run: makeRun() });
    const rows = sectionByTitle(sheetByName(sheets, 'Case 15'), 'Results by Dimension').rows;

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ dimension: 'Accuracy', result: 'Met', importance: 'High' });
    expect(rows[1]).toMatchObject({ dimension: 'Tone', result: 'Pending', importance: 'Low' });
  });

  it('withholds "met all targets" while a human score is still outstanding', () => {
    const sheets = buildEvaluationResultsSheets(makeScorecard(RESULTS), { run: makeRun() });

    expect(metaValue(sheetByName(sheets, 'Case 15'), 'Case status')).toBe('Pending');
    expect(metaValue(sheetByName(sheets, 'Case 15'), 'Met all targets')).toBe('—');
  });
});

// A run can stop before every dimension produced a score: it was cancelled, or the backend marked
// a result `skipped` (a reference-based validation with no expected output). Neither is an error
// and neither awaits a human, so nothing in the card marks them — the export has to.
describe('buildEvaluationResultsSheets — cases the run never scored', () => {
  const unscoredRun = () => {
    const run = makeRun();
    run.status = 'cancelled';
    // One AI dimension only, so no pending human score masks the gap.
    run.snapshot.bindings = [run.snapshot.bindings[0]];
    return run;
  };

  it('does not report a case with no result as Met', () => {
    const run = unscoredRun();
    const sheets = buildEvaluationResultsSheets(buildScorecard({ run, results: [] }), { run });
    const sheet = sheetByName(sheets, 'Case 15');

    expect(metaValue(sheet, 'Case status')).toBe('Pending');
    expect(metaValue(sheet, 'Met all targets')).toBe('—');
  });

  it('does not report a skipped result as Met', () => {
    const run = unscoredRun();
    const results = [{ dataset_case_id: 15, dimension_id: 4, status: 'skipped', native_score: null }];
    const sheets = buildEvaluationResultsSheets(buildScorecard({ run, results }), { run });

    expect(metaValue(sheetByName(sheets, 'Case 15'), 'Case status')).toBe('Pending');
  });

  it('does not report a dimension with no scores as Completed', () => {
    const run = unscoredRun();
    const sheets = buildEvaluationResultsSheets(buildScorecard({ run, results: [] }), { run });

    expect(sectionByTitle(sheets[0], 'Dimension Results').rows[0].status).toBe('Pending');
    expect(metaValue(sheetByName(sheets, 'Accuracy'), 'Cases evaluated')).toBe(0);
  });

  it('counts only the cases that produced a score as evaluated', () => {
    const run = unscoredRun();
    // Case 15 scored, case 16 never ran.
    const results = [{ dataset_case_id: 15, dimension_id: 4, status: 'ok', native_score: 5 }];
    const sheets = buildEvaluationResultsSheets(buildScorecard({ run, results }), { run });

    expect(metaValue(sheetByName(sheets, 'Accuracy'), 'Cases evaluated')).toBe(1);
    expect(sectionByTitle(sheets[0], 'Dimension Results').rows[0].status).toBe('Pending');
  });

  it('still reports a fully scored run as Completed', () => {
    const run = unscoredRun();
    const results = [
      { dataset_case_id: 15, dimension_id: 4, status: 'ok', native_score: 5 },
      { dataset_case_id: 16, dimension_id: 4, status: 'ok', native_score: 5 },
    ];
    const sheets = buildEvaluationResultsSheets(buildScorecard({ run, results }), { run });

    expect(sectionByTitle(sheets[0], 'Dimension Results').rows[0].status).toBe('Completed');
    expect(metaValue(sheetByName(sheets, 'Case 15'), 'Case status')).toBe('Met');
    expect(metaValue(sheetByName(sheets, 'Case 15'), 'Met all targets')).toBe('Yes');
  });
});

describe('buildEvaluationResultsSheets — worksheet naming', () => {
  const runWithNames = (dimensionNames, caseIds) => {
    const run = makeRun();
    run.snapshot.bindings = dimensionNames.map((name, index) => ({
      dimension_id: index + 1,
      engine: 'ai',
      order_index: index,
    }));
    run.snapshot.dimensions = Object.fromEntries(
      dimensionNames.map((name, index) => [index + 1, { name, scale_type: 'binary' }]),
    );
    run.snapshot.cases = caseIds.map((id, index) => ({ id, order_index: index }));
    return run;
  };

  it('truncates a long dimension name and keeps the full one inside the sheet', () => {
    const run = runWithNames(['Response Quality and Relevance for Support'], [1]);
    const sheets = buildEvaluationResultsSheets(buildScorecard({ run }), { run });

    expect(sheets[1].sheetName).toBe('Response Quality and Relevance');
    expect(sheets[1].sheetName.length).toBeLessThanOrEqual(31);
    expect(metaValue(sheets[1], 'Dimension')).toBe('Response Quality and Relevance for Support');
  });

  it('suffixes duplicate names instead of repeating one Excel would reject', () => {
    const run = runWithNames(
      ['Response Quality and Relevance A', 'Response Quality and Relevance B', 'Summary'],
      [1],
    );
    const sheets = buildEvaluationResultsSheets(buildScorecard({ run }), { run });

    expect(sheets.map(sheet => sheet.sheetName)).toEqual([
      'Summary',
      'Response Quality and Relevance',
      'Response Quality and Releva (2)',
      'Summary (2)',
      'Case 1',
    ]);
  });

  it('strips characters Excel forbids in a worksheet name', () => {
    const run = runWithNames(['Safety / PII: check?'], [1]);
    const sheets = buildEvaluationResultsSheets(buildScorecard({ run }), { run });

    expect(sheets[1].sheetName).toBe('Safety PII check');
  });
});

describe('resolveExportDatasets', () => {
  it('names each case s dataset and collects the distinct set for the summary', () => {
    const run = makeRun();
    const scorecard = buildScorecard({ run });

    expect(resolveExportDatasets({ run, scorecard, datasets: [{ id: 9, name: 'QA set' }] })).toEqual({
      datasetNames: ['QA set'],
      datasetNameByCaseId: { 15: 'QA set', 16: 'QA set' },
    });
  });

  it('reports no dataset rather than a wrong one when nothing names it', () => {
    const run = makeRun();
    const scorecard = buildScorecard({ run });

    expect(resolveExportDatasets({ run, scorecard, datasets: [] })).toEqual({
      datasetNames: [],
      datasetNameByCaseId: {},
    });
  });
});
