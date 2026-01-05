# DAFT Quick Start

Get up and running in 2 minutes.

## Step 1: Get API Key

Visit https://opencode.ai/auth and get your free API key.

## Step 2: Install

```bash
cd daft
bun install
```

## Step 3: Configure

```bash
export ZEN_API_KEY=your_api_key_here
```

## Step 4: Test Run

```bash
./run.sh examples/linear-spec.ts examples/data.json
```

You should see:

```
Type-checking examples/linear-spec.ts...
✓ Type-check passed

Executing spec locally...
  [analyze] Iteration 1: No analysis found
  [analyze] Iteration 2: Complete
  [score] Iteration 1: Score 75 < 80
  [score] Iteration 2: Score 82 >= 80 ✓

✅ Done in 4 iterations
Result: {"text":"Example input data","code":"function example() { return 42; }","score":82,"analysis":"complete"}
```

## Next Steps

- Create your own spec: `my-spec.ts`
- Add custom predicates/tools
- Run distributed: `bun run worker` & `bun run submit my-spec.ts`

## Troubleshooting

**Type-check fails?**
```bash
bun run --check your-spec.ts
# Fix errors, then retry
```

**LLM tool errors?**
```bash
# Verify API key
echo $ZEN_API_KEY

# Test API
curl https://opencode.ai/zen/v1/models \
  -H "Authorization: Bearer $ZEN_API_KEY"
```

That's it - DAFT is ready!
