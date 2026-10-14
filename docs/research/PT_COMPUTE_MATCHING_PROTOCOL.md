# PT-01–PT-06: token matching and regulatory evidence

**Draft date:** 2026-10-13 (America/New_York). **Status:** implementation contract pending access to the existing pressure-test harness and case registry. No new live pressure-test results are claimed by this document.

## Evidence received

The project owner reports PT-01 N1 changed the actuator-command representation from `5.0 mL` to `5000 µL`, with detector `unit_inconsistency`, shared CCG 0.10, and policy `ANSWER_DIRECT → RECOMPUTE_WITH_UNITS`. The reported deterministic evaluation, event ordering, and reasoning-leak scan passed. Reported receipt SHA-256:

`377b40892f8986e4b521cb6f5224ebcb9468f382ea77cd1c105726c34090f159`

The receipt itself was not available in this checkout. Its contents, digest, model identity, and usage accounting have therefore not been independently verified here. `5.0 mL` and `5000 µL` describe equivalent physical volumes; the first answer's reported defect is incomplete conformance to the actuator's required command units, not a different volume.

| Reported arm                 | Evaluation                | Actual reported tokens |
| ---------------------------- | ------------------------- | ---------------------- |
| C0 first pass                | FAIL                      | 267                    |
| C1 extra thinking            | PASS                      | 661                    |
| C2 generic critique/revision | PASS                      | 1,184                  |
| N1 regulated                 | PASS with mechanism trace | 1,566                  |

C1 used 905 fewer tokens than N1: **57.8% below N1's usage**. Both C1 and C2 recovered, so this result does not establish N1 superiority. The existing `matched: false` report should remain unchanged; matching is not a retrospective correction to the original receipt.

## Matching contract

Call the directly measurable condition **actual token-usage matching**. Equal `max_tokens` settings or equal request counts are not equal actual usage. Token equality is also a proxy for compute: different model sizes, hardware, caching, or reasoning configurations can consume different resources for the same token count.

Before the comparison, freeze:

- Model IDs/backbone, provider endpoint, generation parameters, reasoning settings, tools, case inputs, and evaluator version.
- Which calls belong to each arm, including first pass, critique, detector inference, revision, and final articulation if present. Count all inference used to obtain the arm's result; local deterministic checks have no provider-token cost.
- Token accounting: sum provider-reported prompt and completion usage across all counted requests, and use the provider's documented total/reasoning-token conventions without double counting. Preserve the original usage fields. Missing, contradictory, or incomplete usage makes matching indeterminate rather than successful.
- Prompt/completion breakdown, cache information when available, request count, latency, and failures. A total-token match does not erase a different input/output composition or prove identical FLOPs.
- A maximum number of requests, maximum total token allocation, overshoot handling, and a declared matching tolerance. Do not keep generating until a favorable answer happens to appear.

**Proposed pilot tolerance, to be frozen before new evaluation:** relative total-token difference of at most **5%**, with matching model/configuration and complete usage records:

```text
token_gap = abs(C1_actual_total - N1_actual_total) / N1_actual_total
token_usage_matched = compatible_model_and_configuration
                     AND usage_complete
                     AND N1_actual_total > 0
                     AND token_gap <= 0.05
```

For the reported 1,566-token reference, the integer range is **1,488–1,644 tokens**. This tolerance is a proposal, not an existing harness requirement or a statement that the reported C1 is matched. If stronger equality is required, declare a narrower tolerance before collecting new responses. Preserve the signed difference as well as the absolute gap.

## C1 allocation without importing the regulator

C1 may use substantive additional analysis or recomputation, but it must remain the ordinary-extra-thinking control. It receives the same task and admissible evidence, not N1's detector label, diagnostic explanation, intervention instruction, final answer, evaluator verdict, or private model reasoning. Increasing a cap alone does not satisfy the matching criterion. Dummy padding, counting unused budget, and artificial repetition solely to inflate tokens do not demonstrate useful compute-matched reasoning.

Two distinct budget designs must not be conflated:

1. **Equal allocation:** freeze a per-case budget from a separate pilot and apply that allocation to C1 and N1. Evaluate actual usage afterward. If one arm finishes early, allocation is equal but actual usage can be unmatched.
2. **N1-reference token matching:** declare in advance that C1 targets the actual usage in a designated N1 reference receipt. Only the numeric budget is transferred. The target policy, request cap, continuation rule, and stopping condition are fixed before C1's evaluation; no outcome-based reruns or prompt tuning. Record the reference receipt and sequencing explicitly. This answers a resource-matched question, not an independently randomized same-budget experiment.

The current PT-01 receipt can inform a clearly labeled pilot/reference exercise after its digest and usage are checked. It should not silently become a held-out result for a method tuned on that case. For PT-02–PT-06, use the existing authored registry; their tasks and expected answers are not known here and must not be invented.

A C1 continuation must spend its declared budget on evaluating the task, using bounded structured output and the same permitted reasoning configuration. Select the final judgment through a frozen rule, such as the last scheduled response, rather than choosing whichever attempt the evaluator prefers. If the policy undershoots or overshoots, retain the run and mark it unmatched. Do not hide its evaluation outcome or discard it because matching failed.

## Six-case run and reporting

The planned matrix is **six cases × four arms = 24 cells per repetition**. PT-01's one reported execution is not a six-case evaluation or an uncertainty estimate. Freeze prompts, detector mappings, matching policy, and evaluators before the evaluation run. Record seeds where supported, run order, and repeated trials chosen in advance; randomize or counterbalance order where the budget design allows it.

For each cell preserve:

- Case/arm/repetition ID, source-code revision, exact model/configuration, and case/evaluator versions.
- Initial/final judgment, deterministic outcome, actual usage by request, resource limits, and completion/error status.
- For N1: detector evidence, shared CCG components/aggregation, trigger guard, old/new policy, event sequence, and bounded public justification.
- For a paired comparison: reference receipt, C1/N1 totals, relative gap, tolerance, compatible-model/configuration check, and a matching reason. Keep total tokens and model identity visible beside any `matched` label.
- Leak-scan result and sealed-record digest. Do not place credentials, upstream raw reasoning, or secret-bearing error bodies in the research receipt.

Maintain separate measures for **answer success**, **mechanism-trace success**, **resource matching**, and **incremental benefit**. A detector can trigger at shared CCG 0.10 through an independent guard; inspect the actual policy before attributing that trigger to a scalar CCG threshold. Correct event ordering supports the recorded sequence; it does not by itself prove that the detector or score caused better outcomes than ordinary retry.

Report all cells, including failures and unmatched comparisons. Show paired outcome differences within matched comparisons and the full matching coverage. Do not claim efficiency if N1 consumes more resources without improving the selected endpoint. C2's generic critique is a separate comparator; it is not automatically compute-matched either.

A minimal follow-up mechanism ablation can disable or disrupt the detector/trigger while retaining the same model and resource allocation. That tests whether a conditional regulator contributes beyond additional analysis. Do not relabel a successful trace alone as evidence of incremental causal benefit.

## Current execution prerequisites

The PT harness, case registry, and sealed PT-01 receipt were not found in the cloud checkout or available GitHub branches. Integration must use those existing artifacts rather than replace them with an invented harness.

The configured cloud `Nebius` binding returned HTTP 401 on a bounded inference health check. Only the status was recorded; the upstream body and secret value were not disclosed. Configure the working binding securely in Environment settings before a live run here, or run the completed harness on the environment where the working key is already configured. No PT inference calls have been made in this pass.
