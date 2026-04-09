import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'api-compare',
        configureServer(server) {
          server.middlewares.use('/api/compare', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end('Method not allowed');
              return;
            }

            const apiKey = env.ANTHROPIC_API_KEY;
            if (!apiKey) {
              res.statusCode = 500;
              res.end('ANTHROPIC_API_KEY not configured in .env.local');
              return;
            }

            let body = '';
            req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
            req.on('end', async () => {
              try {
                const { images } = JSON.parse(body) as {
                  images: { base64: string; mediaType: string }[];
                };

                const systemPrompt = `You are a shipping document verification specialist. You will be given two shipping document images. Your job is to:

1. Read and extract key shipping fields from BOTH documents
2. Compare each field across the two documents
3. Determine if they match or mismatch

Fields to extract and compare (when present):
- Shipper / Exporter
- Consignee
- Notify Party
- Vessel Name / Voyage
- Port of Loading
- Port of Discharge
- Place of Delivery
- B/L Number / Reference
- Goods Description
- Number of Packages / Quantity
- Gross Weight
- Net Weight
- Measurement / Volume
- Container Number
- Seal Number
- Marks & Numbers
- Freight Terms

For each field found in either document, compare values. Fields match if they convey the same information (minor formatting differences are OK). Fields mismatch if they contain substantively different information.

Respond with ONLY valid JSON in this exact format:
{
  "summary": "Brief overall summary of the comparison",
  "overallStatus": "match" or "mismatch",
  "fields": [
    {
      "field": "Field Name",
      "doc1Value": "Value from document 1 (or 'Not found')",
      "doc2Value": "Value from document 2 (or 'Not found')",
      "status": "match" or "mismatch",
      "explanation": "Brief explanation of why this matches or mismatches"
    }
  ]
}

Include ALL fields you can find in either document. Be thorough and accurate.`;

                const userContent = images.map((img, i) => ([
                  { type: 'text' as const, text: `Document ${i + 1}:` },
                  {
                    type: 'image' as const,
                    source: {
                      type: 'base64' as const,
                      media_type: img.mediaType,
                      data: img.base64,
                    },
                  },
                ])).flat();

                userContent.push({ type: 'text' as const, text: 'Compare these two documents and return the structured JSON comparison.' } as any);

                const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                  },
                  body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 4096,
                    system: systemPrompt,
                    messages: [{ role: 'user', content: userContent }],
                  }),
                });

                if (!apiResponse.ok) {
                  const errText = await apiResponse.text();
                  res.statusCode = apiResponse.status;
                  res.setHeader('Content-Type', 'text/plain');
                  res.end(`Claude API error: ${errText}`);
                  return;
                }

                const apiResult = await apiResponse.json() as {
                  content: { type: string; text: string }[];
                };

                const rawText = apiResult.content
                  .filter((b: any) => b.type === 'text')
                  .map((b: any) => b.text)
                  .join('');

                // Parse the JSON from the response
                const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'text/plain');
                  res.end('Could not parse JSON from LLM response');
                  return;
                }

                const parsed = JSON.parse(jsonMatch[0]);
                const result = {
                  summary: parsed.summary || '',
                  overallStatus: parsed.overallStatus || 'mismatch',
                  fields: parsed.fields || [],
                  rawResponse: rawText,
                };

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(result));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end(`Server error: ${err.message}`);
              }
            });
          });
        },
      },
    ],
  };
});
