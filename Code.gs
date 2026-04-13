// Code.gs
// Main Handler and API Endpoints for SkillSync AI

function doGet(e) {
  let page = e.parameter.page || 'index';
  return HtmlService.createTemplateFromFile(page)
    .evaluate()
    .setTitle('SkillSync AI')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Generates an AI Plan using Gemini 3 Flash.
 * @param {string} prompt - The task and context for the plan.
 * @returns {object} JSON object with the generated plan.
 */
function generateAIPlan(prompt) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in Script Properties.');
  }

  // Adjust model version per Gen AI Academy specs (e.g., gemini-3.0-flash)
  const modelName = 'gemini-1.5-flash'; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{
      parts: [{
        text: `You are an AI planner for a digital agency. Given the objective: "${prompt}", output a highly detailed, day-by-day JSON schedule representing tasks and learning paths. Please output only valid JSON.`
      }]
    }]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  
  try {
    const json = JSON.parse(response.getContentText());
    if (json.candidates && json.candidates.length > 0) {
      let resultText = json.candidates[0].content.parts[0].text;
      // Clean markdown JSON formatting if present
      resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(resultText);
    } else {
       throw new Error('Invalid response from AI model');
    }
  } catch (error) {
    Logger.log(response.getContentText());
    throw new Error('Failed to parse AI response: ' + error.message);
  }
}
