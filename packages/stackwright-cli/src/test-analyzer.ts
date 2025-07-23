import { analyzeBrief } from './utils/briefAnalyzer';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testAnalyzer() {
  try {
    const briefPath = path.join(process.cwd(), '../../per-aspera-brief');
    const apiKey = process.env.OPENAI_API_KEY;
    
    console.log('🛡️ Testing Per Aspera Sapientia brief analyzer...');
    console.log(apiKey ? '🤖 Using AI extraction' : '📝 Using manual extraction');
    
    const brief = await analyzeBrief(briefPath, apiKey);
    
    console.log('\n📊 Per Aspera Analysis Results:');
    console.log('===============================');
    console.log('\n🏢 Brand Profile:');
    console.log(JSON.stringify(brief.brand, null, 2));
    
    console.log('\n📝 Content Requirements:');
    console.log(JSON.stringify(brief.content, null, 2));
    
    console.log('\n🖼️  Asset Inventory:');
    console.log(JSON.stringify(brief.assets, null, 2));
    
    console.log('\n📋 Image Requirements:');
    console.log(JSON.stringify(brief.imageSpecs, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAnalyzer();