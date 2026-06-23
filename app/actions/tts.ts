'use server'

export async function getAudioFromFPT(text: string) {
  const apiKey = process.env.FPT_AI_API_KEY
  if (!apiKey) return { success: false, error: 'Chưa cấu hình FPT_AI_API_KEY trong file .env.local' }

  try {
    const response = await fetch('https://api.fpt.ai/hmi/tts/v5', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'voice': 'banmai', // Tên giọng đọc (banmai: Nữ miền Bắc, lannhi: Nữ miền Nam, minhquang: Nam miền Nam)
        'speed': '0', // Tốc độ đọc từ -3 đến 3
      },
      body: text
    })

    const data = await response.json()
    
    // FPT.AI trả về mã error = 0 là thành công
    if (data.error === 0) {
      return { success: true, url: data.async } // Trả về đường dẫn file MP3
    } else {
      return { success: false, error: data.message }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}