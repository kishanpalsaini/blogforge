// scripts/generate-blogs.mjs
// Run: node scripts/generate-blogs.mjs
// Requires: GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY in env

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ─── Config ───────────────────────────────────────────────────────────────────
const BLOGS_PER_RUN = 10          // how many blogs to generate per day (max 15)
const BLOG_ID = process.env.BLOG_ID  // your Supabase blog_id (uuid)
const GEMINI_KEY = process.env.GEMINI_API_KEY
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY  // use service role key

// ─── Supabase client ──────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── Load tools & progress ────────────────────────────────────────────────────
const tools = JSON.parse(readFileSync(join(__dirname, 'tools.json'), 'utf8'))
const progress = JSON.parse(readFileSync(join(__dirname, 'progress.json'), 'utf8'))

// ─── Slugify helper ───────────────────────────────────────────────────────────
function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
}

// ─── Calculate read time ──────────────────────────────────────────────────────
function calcReadTime(content) {
    const words = content.replace(/<[^>]+>/g, '').split(/\s+/).length
    const minutes = Math.ceil(words / 200)
    return `${minutes} min read`
}

// ─── Stagger publish time ─────────────────────────────────────────────────────
// Spreads posts throughout the day so Google doesn't see bulk publishing
function getStaggeredTime(index) {
    const now = new Date()
    // Start from 8am, spread every ~90 minutes
    const startHour = 8
    const minutesOffset = index * 90
    now.setHours(startHour, minutesOffset % 60, 0, 0)
    if (minutesOffset >= 60) {
        now.setHours(startHour + Math.floor(minutesOffset / 60), minutesOffset % 60, 0, 0)
    }
    return now.toISOString()
}

// ─── Call Gemini API ──────────────────────────────────────────────────────────
async function callGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.85,      // slightly creative for human-like writing
                topP: 0.95,
                maxOutputTokens: 4096,
            }
        })
    })

    const data = await res.json()
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error(`Gemini error: ${JSON.stringify(data)}`)
    }
    return data.candidates[0].content.parts[0].text
}

// ─── Generate blog via Gemini ─────────────────────────────────────────────────
async function generateBlog(tool) {
    const prompt = `
You are an expert SEO content writer. Write a detailed, helpful blog post about "${tool.topic}".

The blog should feel naturally written by a human expert — not robotic or repetitive.
Use varied sentence lengths. Include a personal tone occasionally. Add practical tips.

Return ONLY a valid JSON object (no markdown, no backticks) with these exact fields:
{
  "title": "An engaging, SEO-optimized title (50-60 chars)",
  "slug": "seo-friendly-slug-with-keywords",
  "excerpt": "A compelling 1-2 sentence description for blog listings (120-150 chars)",
  "seo_title": "SEO title (max 60 chars)",
  "seo_description": "Meta description (max 160 chars)",
  "category": "Tools",
  "content": "Full HTML blog content (use <h2>, <h3>, <p>, <ul>, <li>, <strong> tags)"
}

Rules for content:
- Minimum 1200 words
- Start with a hook paragraph (no heading)
- Use 4-6 H2 sections with descriptive headings
- Include at least one H3 under an H2
- Add a bullet list of features or tips in one section
- Mention the tool link naturally: <a href="${tool.tool_link}">${tool.tool_name}</a>
- End with a strong call-to-action paragraph
- Do NOT use phrases like "In conclusion" or "In summary"
- Write like a knowledgeable human, not an AI assistant
- Vary sentence structure — mix short punchy sentences with longer detailed ones
`

    const raw = await callGemini(prompt)

    // Strip any accidental markdown fences
    const cleaned = raw.replace(/```json|```/g, '').trim()

    try {
        return JSON.parse(cleaned)
    } catch (e) {
        // Try to extract JSON if there's surrounding text
        const match = cleaned.match(/\{[\s\S]*\}/)
        if (match) return JSON.parse(match[0])
        throw new Error(`Failed to parse Gemini response: ${cleaned.slice(0, 200)}`)
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log(`🚀 Starting blog generation — ${BLOGS_PER_RUN} posts`)
    console.log(`📋 Tools pool: ${tools.length} tools`)
    console.log(`📍 Starting from index: ${progress.currentIndex}`)

    let currentIndex = progress.currentIndex
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < BLOGS_PER_RUN; i++) {
        // Rotate: when we reach the end, start from 0
        const toolIndex = currentIndex % tools.length
        const tool = tools[toolIndex]

        console.log(`\n[${i + 1}/${BLOGS_PER_RUN}] Generating: "${tool.topic}" (tool index: ${toolIndex})`)

        try {
            // Generate blog content
            const blog = await generateBlog(tool)

            // Build the final slug (use Gemini's suggestion or generate from title)
            const finalSlug = blog.slug || slugify(blog.title)

            // Check for duplicate slug
            const { data: existing } = await supabase
                .from('posts')
                .select('id')
                .eq('slug', finalSlug)
                .single()

            if (existing) {
                console.log(`  ⚠️  Slug already exists: ${finalSlug} — skipping`)
                currentIndex++
                continue
            }

            // Insert into Supabase
            const { error } = await supabase.from('posts').insert({
                blog_id: BLOG_ID,
                title: blog.title,
                slug: finalSlug,
                content: blog.content,
                excerpt: blog.excerpt,
                seo_title: blog.seo_title,
                seo_description: blog.seo_description,
                category: blog.category || 'Tools',
                read_time: calcReadTime(blog.content),
                tool_link: tool.tool_link,
                tool_name: tool.tool_name,
                status: 'published',
                published_at: getStaggeredTime(i),   // stagger throughout the day
                cover_image: null,
            })

            if (error) {
                console.log(`  ❌ Supabase error: ${error.message}`)
                failCount++
            } else {
                console.log(`  ✅ Published: "${blog.title}"`)
                console.log(`     Slug: ${finalSlug}`)
                successCount++
            }

            currentIndex++

            // Small delay between requests to be polite to Gemini API
            if (i < BLOGS_PER_RUN - 1) {
                await new Promise(r => setTimeout(r, 3000))
            }

        } catch (err) {
            console.log(`  ❌ Failed: ${err.message}`)
            failCount++
            currentIndex++
        }
    }

    // Save updated progress (rotation)
    const updatedProgress = {
        currentIndex: currentIndex % tools.length,  // rotate back to start
        lastRun: new Date().toISOString(),
        totalGenerated: (progress.totalGenerated || 0) + successCount
    }
    writeFileSync(join(__dirname, 'progress.json'), JSON.stringify(updatedProgress, null, 2))

    console.log(`\n─────────────────────────────────`)
    console.log(`✅ Success: ${successCount} blogs published`)
    console.log(`❌ Failed:  ${failCount} blogs`)
    console.log(`📍 Next run starts at tool index: ${updatedProgress.currentIndex}`)
    console.log(`📊 Total ever generated: ${updatedProgress.totalGenerated}`)
}

main().catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
})