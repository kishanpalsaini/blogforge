// scripts/generate-blogs.mjs
// Run: node scripts/generate-blogs.mjs
// Requires: GROQ_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, BLOG_ID in env

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ─── Config ───────────────────────────────────────────────────────────────────
const BLOGS_PER_RUN = parseInt(process.env.BLOGS_PER_RUN || '10')
const BLOG_ID = process.env.BLOG_ID
const GROQ_KEY = process.env.GROQ_API_KEY
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY

// ─── Validate env vars ────────────────────────────────────────────────────────
if (!GROQ_KEY) throw new Error('Missing GROQ_API_KEY')
if (!SUPABASE_URL) throw new Error('Missing SUPABASE_URL')
if (!SUPABASE_KEY) throw new Error('Missing SUPABASE_SERVICE_KEY')
if (!BLOG_ID) throw new Error('Missing BLOG_ID')

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

// ─── Make slug always unique ──────────────────────────────────────────────────
function makeUniqueSlug(baseSlug) {
    const date = new Date()
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    return `${baseSlug}-${dateStr}`
}

// ─── Stagger publish time ─────────────────────────────────────────────────────
function getStaggeredTime(index) {
    const now = new Date()
    const startHour = 8
    const minutesOffset = index * 90
    const totalMinutes = startHour * 60 + minutesOffset
    now.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0)
    return now.toISOString()
}

// ─── Call Groq API ────────────────────────────────────────────────────────────
async function callGroq(prompt) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_KEY}`
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert SEO content writer who writes detailed, human-like blog posts. You always return valid JSON only — no markdown, no backticks, no extra text.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.85,
            max_tokens: 4096,
        })
    })

    const data = await res.json()

    if (!data.choices?.[0]?.message?.content) {
        throw new Error(`Groq error: ${JSON.stringify(data)}`)
    }

    return data.choices[0].message.content
}

// ─── Generate blog via Groq ───────────────────────────────────────────────────
async function generateBlog(tool) {
    const prompt = `
Write a detailed, helpful blog post about "${tool.topic}".

The blog should feel naturally written by a human expert — not robotic or repetitive.
Use varied sentence lengths. Include a personal tone occasionally. Add practical tips.

Return ONLY a valid JSON object (no markdown, no backticks, no extra text before or after) with these exact fields:
{
  "title": "An engaging, SEO-optimized title (50-60 chars)",
  "slug": "seo-friendly-slug-with-keywords",
  "excerpt": "A compelling 1-2 sentence description for blog listings (120-150 chars)",
  "seo_title": "SEO title (max 60 chars)",
  "seo_description": "Meta description (max 160 chars)",
  "category": "Tools",
  "content": "Full HTML blog content"
}

Rules for content:
- Minimum 1200 words
- Start with a hook paragraph (no heading)
- Use 4-6 H2 sections with descriptive headings using <h2> tags
- Include at least one H3 under an H2 using <h3> tags
- Use <p> tags for paragraphs
- Add a bullet list using <ul> and <li> tags in one section
- Use <strong> for emphasis
- Mention the tool naturally: <a href="${tool.tool_link}">${tool.tool_name}</a>
- End with a strong call-to-action paragraph
- Do NOT use phrases like "In conclusion" or "In summary"
- Write like a knowledgeable human blogger
- Vary sentence structure — mix short punchy sentences with longer detailed ones
- Do not use the word "delve"
`

    const raw = await callGroq(prompt)
    // With this:
    const cleaned = raw
        .replace(/```json|```/g, '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip bad control chars
        .trim()

    try {
        return JSON.parse(cleaned)
    } catch (e) {
        const match = cleaned.match(/\{[\s\S]*\}/)
        if (match) {
            try {
                return JSON.parse(match[0])
            } catch (e2) {
                throw new Error(`Failed to parse Groq response: ${cleaned.slice(0, 300)}`)
            }
        }
        throw new Error(`Failed to parse Groq response: ${cleaned.slice(0, 300)}`)
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
        const toolIndex = currentIndex % tools.length
        const tool = tools[toolIndex]

        console.log(`\n[${i + 1}/${BLOGS_PER_RUN}] Generating: "${tool.topic}" (tool index: ${toolIndex})`)

        try {
            const blog = await generateBlog(tool)
            const baseSlug = blog.slug || slugify(blog.title)
            const finalSlug = makeUniqueSlug(baseSlug)

            // const { data: existing } = await supabase
            //     .from('posts')
            //     .select('id')
            //     .eq('slug', finalSlug)
            //     .single()

            // if (existing) {
            //     console.log(`  ⚠️  Slug already exists: ${finalSlug} — skipping`)
            //     currentIndex++
            //     continue
            // }

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
                published_at: getStaggeredTime(i),
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

            if (i < BLOGS_PER_RUN - 1) {
                await new Promise(r => setTimeout(r, 200000)) // 200 seconds delay between generations to avoid rate limits
            }

        } catch (err) {

            if (i < BLOGS_PER_RUN - 1) {
                console.log(`  ⏳ Waiting 20s before next request...`)
                await new Promise(r => setTimeout(r, 20000)) // 20s is enough with 2000 max_tokens
            }
            console.log(`  ❌ Failed: ${err.message}`)
            failCount++
            currentIndex++
        }
    }

    const updatedProgress = {
        currentIndex: currentIndex % tools.length,
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