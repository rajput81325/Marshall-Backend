const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Marshall AI Model Server</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
        }
        .container {
          background: rgba(255, 255, 255, 0.1);
          padding: 30px;
          border-radius: 15px;
          backdrop-filter: blur(10px);
          max-width: 800px;
          margin: 0 auto;
        }
        h1 {
          margin-bottom: 20px;
        }
        .status {
          background: rgba(0, 255, 0, 0.2);
          padding: 10px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .endpoints {
          text-align: left;
          background: rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 10px;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 Marshall AI Model Server</h1>
        <div class="status">
          <h2>✅ Server is running successfully!</h2>
          <p>Port: ${process.env.PORT || 3001}</p>
          <p>API Key: ${GROQ_API_KEY ? '✅ Present' : '❌ Missing'}</p>
        </div>
        
        <div class="endpoints">
          <h3>Available Endpoints:</h3>
          <ul>
            <li><strong>GET /</strong> - This page</li>
            <li><strong>GET /api/test</strong> - Test API endpoint</li>
            <li><strong>POST /api/analyze-business</strong> - Business analysis (12 sections)</li>
            <li><strong>GET /api/health</strong> - Health check</li>
          </ul>
          
          <h3>Test Links:</h3>
          <p>
            <a href="/api/test" style="color: #4adeff; margin-right: 15px;">Test API</a>
            <a href="/api/health" style="color: #4adeff;">Health Check</a>
          </p>
        </div>
        
        <div style="margin-top: 30px; font-size: 14px; opacity: 0.8;">
          <p>Server Time: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Har section ke liye alag-alag API endpoint
app.post('/api/analyze-business', async (req, res) => {
    try {
        console.log("📥 Full analysis request aaya:", Object.keys(req.body));
        
        const businessData = req.body;
        
        // Har section ka analysis generate karo parallel mein
        const sections = [
            { key: 'executiveSummary', title: 'Current Performance Analysis', promptType: 'currentPerformance' },
            { key: 'swotAnalysis', title: 'SWOT Analysis', promptType: 'swot' },
            { key: 'growthStrategy', title: 'Growth Opportunities', promptType: 'growthOpportunities' },
            { key: 'riskAssessment', title: 'Risk Assessment', promptType: 'risk' },
            { key: 'implementationTimeline', title: 'Operational Efficiency', promptType: 'operational' },
            { key: 'financialRecommendations', title: 'Financial Health', promptType: 'financial' },
            { key: 'marketingPlan', title: 'Marketing Strategy', promptType: 'marketing' },
            { key: 'marketAnalysis', title: 'Competitive Analysis', promptType: 'competitive' },
            { key: 'customerAnalysis', title: 'Customer Analysis', promptType: 'customer' },
            { key: 'technologyAssessment', title: 'Technology Assessment', promptType: 'technology' },
            { key: 'teamOptimization', title: 'Team Optimization', promptType: 'team' },
            { key: 'expansionStrategy', title: 'Expansion Strategy', promptType: 'expansion' }
        ];

        // Sabhi sections ke liye parallel API calls
        const analysisPromises = sections.map(section => 
            generateSectionAnalysis(businessData, section.promptType, section.title)
        );

        const results = await Promise.all(analysisPromises);
        
        // Results ko format karo
        const formattedAnalysis = {};
        sections.forEach((section, index) => {
            formattedAnalysis[section.key] = formatText(results[index]);
        });

        console.log("✅ Sabhi sections ka analysis taiyaar hai");
        
        res.json({
            success: true,
            analysis: formattedAnalysis
        });

    } catch (error) {
        console.error('❌ API error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: 'Analysis failed. Please try again.',
            details: error.message
        });
    }
});

// Har section ke liye alag prompt generator
function getSectionPrompt(businessData, sectionType) {
    const { 
        businessName, industry, yearsInOperation, annualRevenue,
        teamSize, targetMarket, currentChallenges, growthGoals,
        marketingChannels, customerFeedback 
    } = businessData;

    const baseInfo = `
Business Name: ${businessName}
Industry: ${industry}
Years in Operation: ${yearsInOperation}
Annual Revenue: ${annualRevenue}
Team Size: ${teamSize}
Target Market: ${targetMarket}
Current Challenges: ${currentChallenges}
Growth Goals: ${growthGoals}
Marketing Channels: ${marketingChannels}
Customer Feedback Status: ${customerFeedback}
`;

    const prompts = {
        currentPerformance: `
${baseInfo}
Generate a CURRENT PERFORMANCE ANALYSIS focusing on:
1. Current operational metrics and KPIs
2. Revenue performance and trends
3. Market position and customer base
4. Operational strengths and weaknesses
5. Key performance indicators
Format: Use bullet points, be specific and data-driven.
`,

        swot: `
${baseInfo}
Generate a COMPREHENSIVE SWOT ANALYSIS with:
1. STRENGTHS - Internal positive factors
2. WEAKNESSES - Internal areas for improvement
3. OPPORTUNITIES - External positive factors
4. THREATS - External challenges
Format: Clear sections with bullet points under each category.
`,

        growthOpportunities: `
${baseInfo}
Generate GROWTH OPPORTUNITIES ANALYSIS focusing on:
1. Market expansion opportunities
2. Product/service diversification
3. New customer segments
4. Geographic expansion potential
5. Strategic partnerships
Format: Prioritized list with implementation feasibility.
`,

        risk: `
${baseInfo}
Generate RISK ASSESSMENT focusing on:
1. Market risks
2. Operational risks
3. Financial risks
4. Competitive risks
5. Regulatory risks
6. Mitigation strategies for each risk
Format: Risk matrix with probability and impact assessment.
`,

        operational: `
${baseInfo}
Generate OPERATIONAL EFFICIENCY ANALYSIS focusing on:
1. Process optimization opportunities
2. Cost reduction strategies
3. Productivity improvements
4. Automation potential
5. Supply chain optimization
Format: Actionable recommendations with expected ROI.
`,

        financial: `
${baseInfo}
Generate FINANCIAL HEALTH ANALYSIS focusing on:
1. Revenue analysis and projections
2. Cost structure optimization
3. Profitability metrics
4. Cash flow management
5. Investment recommendations
6. Financial KPIs to track
Format: Financial metrics with specific targets.
`,

        marketing: `
${baseInfo}
Generate MARKETING STRATEGY ANALYSIS focusing on:
1. Target audience segmentation
2. Channel optimization
3. Campaign recommendations
4. Budget allocation
5. ROI measurement
6. Digital marketing strategy
Format: Specific actionable marketing plan.
`,

        competitive: `
${baseInfo}
Generate COMPETITIVE ANALYSIS focusing on:
1. Main competitors analysis
2. Competitive positioning
3. Market share analysis
4. Competitive advantages
5. Pricing strategy recommendations
Format: Comparative analysis with recommendations.
`,

        customer: `
${baseInfo}
Generate CUSTOMER ANALYSIS focusing on:
1. Customer segmentation
2. Customer journey mapping
3. Retention strategies
4. Customer lifetime value
5. Feedback implementation
6. Customer service improvements
Format: Customer-centric recommendations.
`,

        technology: `
${baseInfo}
Generate TECHNOLOGY ASSESSMENT focusing on:
1. Current tech stack evaluation
2. Technology gaps
3. Digital transformation opportunities
4. Software recommendations
5. Automation opportunities
6. IT infrastructure improvements
Format: Technology roadmap with priorities.
`,

        team: `
${baseInfo}
Generate TEAM OPTIMIZATION ANALYSIS focusing on:
1. Organizational structure
2. Skill gap analysis
3. Training recommendations
4. Performance management
5. Talent acquisition strategy
6. Employee engagement
Format: HR and organizational recommendations.
`,

        expansion: `
${baseInfo}
Generate EXPANSION STRATEGY focusing on:
1. Market entry strategies
2. Scaling operations
3. Resource planning
4. Timeline for expansion
5. Risk assessment for expansion
6. Success metrics for expansion
Format: Phase-wise expansion plan.
`
    };

    return prompts[sectionType] || prompts.currentPerformance;
}

// Single section analysis generate karo
async function generateSectionAnalysis(businessData, sectionType, sectionTitle) {
    try {
        console.log(`🤖 Generating ${sectionTitle} analysis...`);
        
        const response = await axios.post(
            GROQ_API_URL,
            {
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                messages: [
                    { 
                        role: "system", 
                        content: `You are an expert business analyst specializing in ${sectionTitle}. Provide specific, actionable insights in clear business language. Use bullet points, avoid markdown formatting, focus on practical recommendations.` 
                    },
                    { 
                        role: "user", 
                        content: getSectionPrompt(businessData, sectionType) 
                    }
                ],
                temperature: 0.7,
                max_tokens: 1500
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const content = response.data.choices[0].message.content;
        console.log(`✅ ${sectionTitle} analysis generated (${content.length} chars)`);
        return content;

    } catch (error) {
        console.error(`❌ Error in ${sectionTitle}:`, error.message);
        return `Unable to generate ${sectionTitle} analysis at this time. Please try again later.`;
    }
}

// Text ko format karo - formatting issues solve karo
function formatText(text) {
    if (!text) return 'Analysis not available.';
    
    // Remove markdown formatting
    let formatted = text
        .replace(/\*\*/g, '') // Remove **
        .replace(/\*/g, '• ') // Replace * with bullet
        .replace(/\\n/g, '\n') // Ensure proper line breaks
        .replace(/#{1,6}\s*/g, '') // Remove headings
        .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    
    // Ensure proper paragraphs
    formatted = formatted.replace(/\n\s*\n/g, '\n\n');
    
    // Capitalize first letter
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    
    return formatted;
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔑 Groq API Key: ${GROQ_API_KEY ? 'Present' : 'Missing!'}`);
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});