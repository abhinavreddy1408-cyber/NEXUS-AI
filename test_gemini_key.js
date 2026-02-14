const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testKey() {
    console.log("Testing Gemini Key...");
    const genAI = new GoogleGenerativeAI("AIzaSyAvVu915EnOtogWvcbbeYXHRoheOdohO7E");

    const models = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];

    for (const m of models) {
        console.log(`Trying model: ${m}`);
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Hello");
            const response = await result.response;
            console.log(`SUCCESS with ${m}! Response:`, response.text());
            return;
        } catch (error) {
            console.error(`Failed ${m}:`, error.message);
        }
    }
}

testKey();
