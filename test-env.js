// Quick test to verify Gemini API key is loaded
console.log('🔑 Environment Variables Check:');
console.log('VITE_GEMINI_API_KEY:', import.meta.env.VITE_GEMINI_API_KEY ? '✅ Loaded' : '❌ Missing');
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL ? '✅ Loaded' : '❌ Missing');
console.log('VITE_GOOGLE_MAPS_API_KEY:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? '✅ Loaded' : '❌ Missing');
