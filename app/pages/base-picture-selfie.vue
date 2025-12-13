<template>
  <div class="container">
    <div class="stars"></div>
    <div class="content">
      <header class="header">
        <h1 class="title">
          <span class="title-main">Selfie with</span>
          <span class="title-custom">Custom Background</span>
        </h1>
        <p class="subtitle">Upload your background and your selfie</p>
      </header>

      <div class="upload-section">
        <!-- Initial upload state - show both upload buttons -->
        <div v-if="!uploadedBaseImage || !uploadedImage" class="upload-area">
          <div class="dual-upload-container">
            <!-- Base Image Upload -->
            <div class="upload-item">
              <label v-if="!uploadedBaseImage" for="base-image-upload" class="upload-button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <span>Upload Base Image</span>
              </label>
              <input
                id="base-image-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                @change="handleBaseImageUpload"
                class="file-input"
              />
              <div v-if="uploadedBaseImage" class="image-preview">
                <img :src="uploadedBaseImage" alt="Base image" class="preview-image" />
                <button @click="resetBaseImage" class="reset-button">×</button>
              </div>
            </div>

            <!-- User Selfie Upload -->
            <div class="upload-item">
              <label v-if="!uploadedImage" for="user-image-upload" class="upload-button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <span>Upload Your Photo</span>
              </label>
              <input
                id="user-image-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                @change="handleUserImageUpload"
                class="file-input"
              />
              <div v-if="uploadedImage" class="image-preview">
                <img :src="uploadedImage" alt="Your photo" class="preview-image" />
                <button @click="resetUserImage" class="reset-button">×</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Both images uploaded - show previews and generate button -->
        <div v-if="uploadedBaseImage && uploadedImage && !generatedImage && !loading" class="preview-section">
          <div class="dual-preview-container">
            <div class="preview-item">
              <h3 class="preview-label">Base Image</h3>
              <div class="image-preview">
                <img :src="uploadedBaseImage" alt="Base image" class="preview-image" />
                <button @click="resetBaseImage" class="reset-button">×</button>
              </div>
            </div>
            <div class="preview-item">
              <h3 class="preview-label">Your Photo</h3>
              <div class="image-preview">
                <img :src="uploadedImage" alt="Your photo" class="preview-image" />
                <button @click="resetUserImage" class="reset-button">×</button>
              </div>
            </div>
          </div>
          <button @click="generateSelfie" class="generate-button">
            Generate Selfie
          </button>
        </div>

        <div v-if="loading" class="loading-section">
          <div class="spinner"></div>
          <p class="loading-text">Creating your custom selfie...</p>
          <p class="loading-subtext">This may take a moment</p>
        </div>

        <div v-if="generatedImage && !loading" class="result-section">
          <div class="result-image-container">
            <img :src="generatedImage" alt="Generated selfie" class="result-image" />
          </div>
          <div class="result-actions">
            <button @click="downloadImage" class="download-button">Download</button>
            <button @click="retryGeneration" class="retry-button">Retry</button>
            <button @click="resetAll" class="reset-all-button">Create Another</button>
          </div>
        </div>

        <div v-if="error" class="error-message">
          <p>{{ error }}</p>
          <button @click="clearError" class="error-button">Try Again</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const uploadedBaseImage = ref<string | null>(null)
const uploadedImage = ref<string | null>(null)
const generatedImage = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const validateFile = (file: File): string | null => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return 'Please upload a JPEG, PNG, or WebP image.'
  }
  if (file.size > 10 * 1024 * 1024) {
    return 'Image size must be less than 10MB.'
  }
  return null
}

const handleBaseImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return

  const validationError = validateFile(file)
  if (validationError) {
    error.value = validationError
    return
  }

  error.value = null
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedBaseImage.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const handleUserImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return

  const validationError = validateFile(file)
  if (validationError) {
    error.value = validationError
    return
  }

  error.value = null
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImage.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const generateSelfie = async () => {
  if (!uploadedBaseImage.value || !uploadedImage.value) return

  loading.value = true
  error.value = null
  generatedImage.value = null

  try {
    // Convert base64 data URLs to blobs for FormData
    const base64ToBlob = (dataUrl: string, defaultType: string = 'image/jpeg'): Blob => {
      const base64Data = dataUrl.split(',')[1]
      if (!base64Data) {
        throw new Error('Invalid base64 data URL format')
      }
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      
      // Try to extract MIME type from data URL
      const mimeMatch = dataUrl.match(/data:([^;]+);/)
      const mimeType = mimeMatch ? mimeMatch[1] : defaultType
      
      return new Blob([byteArray], { type: mimeType })
    }
    
    const baseImageBlob = base64ToBlob(uploadedBaseImage.value)
    const userImageBlob = base64ToBlob(uploadedImage.value)
    
    const formData = new FormData()
    formData.append('baseImage', baseImageBlob, 'base-image.jpg')
    formData.append('image', userImageBlob, 'user-photo.jpg')

    const response = await $fetch<{ success: boolean; image: string }>('/api/generate-selfie-with-base', {
      method: 'POST',
      body: formData
    })

    if (response.success && response.image) {
      // Ensure the image is in the correct format (base64 data URL)
      generatedImage.value = response.image.startsWith('data:') 
        ? response.image 
        : `data:image/png;base64,${response.image}`
    } else {
      throw new Error('Failed to generate image')
    }
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Failed to generate selfie. Please try again.'
    console.error('Error generating selfie:', err)
  } finally {
    loading.value = false
  }
}

const resetBaseImage = () => {
  uploadedBaseImage.value = null
  const fileInput = document.getElementById('base-image-upload') as HTMLInputElement
  if (fileInput) {
    fileInput.value = ''
  }
}

const resetUserImage = () => {
  uploadedImage.value = null
  const fileInput = document.getElementById('user-image-upload') as HTMLInputElement
  if (fileInput) {
    fileInput.value = ''
  }
}

const resetAll = () => {
  uploadedBaseImage.value = null
  uploadedImage.value = null
  generatedImage.value = null
  error.value = null
  const baseInput = document.getElementById('base-image-upload') as HTMLInputElement
  const userInput = document.getElementById('user-image-upload') as HTMLInputElement
  if (baseInput) baseInput.value = ''
  if (userInput) userInput.value = ''
}

const clearError = () => {
  error.value = null
}

const retryGeneration = () => {
  // Simply call generateSelfie again with the existing images
  if (uploadedBaseImage.value && uploadedImage.value) {
    generateSelfie()
  }
}

const downloadImage = () => {
  if (!generatedImage.value) return

  const link = document.createElement('a')
  link.href = generatedImage.value
  link.download = 'custom-selfie.jpg'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  position: relative;
  overflow-x: hidden;
  padding: 2rem 1rem;
}

.stars {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(2px 2px at 20% 30%, #fff, transparent),
    radial-gradient(2px 2px at 60% 70%, #fff, transparent),
    radial-gradient(1px 1px at 50% 50%, #fff, transparent),
    radial-gradient(1px 1px at 80% 10%, #fff, transparent),
    radial-gradient(2px 2px at 90% 60%, #fff, transparent),
    radial-gradient(1px 1px at 33% 80%, #fff, transparent),
    radial-gradient(1px 1px at 10% 40%, #fff, transparent);
  background-size: 200% 200%;
  animation: twinkle 20s linear infinite;
  pointer-events: none;
  opacity: 0.6;
}

@keyframes twinkle {
  0% { background-position: 0% 0%; }
  100% { background-position: 100% 100%; }
}

.content {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
  padding-top: 2rem;
}

.title {
  font-size: 3.5rem;
  font-weight: 900;
  margin: 0;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.title-main {
  display: block;
  color: #fff;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
}

.title-custom {
  display: block;
  color: #60a5fa;
  text-shadow: 
    0 0 10px rgba(96, 165, 250, 0.8),
    0 0 20px rgba(96, 165, 250, 0.6),
    0 0 30px rgba(96, 165, 250, 0.4);
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    text-shadow: 
      0 0 10px rgba(96, 165, 250, 0.8),
      0 0 20px rgba(96, 165, 250, 0.6),
      0 0 30px rgba(96, 165, 250, 0.4);
  }
  to {
    text-shadow: 
      0 0 20px rgba(96, 165, 250, 1),
      0 0 30px rgba(96, 165, 250, 0.8),
      0 0 40px rgba(96, 165, 250, 0.6);
  }
}

.subtitle {
  color: #a0a0a0;
  font-size: 1.2rem;
  margin-top: 1rem;
  font-style: italic;
}

.upload-section {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 3rem 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.upload-area {
  text-align: center;
}

.dual-upload-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.upload-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.file-input {
  display: none;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  color: #000;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(74, 222, 128, 0.4);
}

.upload-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(74, 222, 128, 0.6);
}

.upload-button:active {
  transform: translateY(0);
}

.preview-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.dual-preview-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  width: 100%;
}

.preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.preview-label {
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.image-preview {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  width: 100%;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  display: block;
  width: 100%;
  object-fit: contain;
}

.reset-button {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border: none;
  border-radius: 50%;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-button:hover {
  background: rgba(220, 38, 38, 0.9);
  transform: scale(1.1);
}

.generate-button {
  padding: 1rem 2.5rem;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #000;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);
}

.generate-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(251, 191, 36, 0.6);
}

.loading-section {
  text-align: center;
  padding: 3rem 2rem;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(96, 165, 250, 0.2);
  border-top-color: #60a5fa;
  border-radius: 50%;
  margin: 0 auto 1.5rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #60a5fa;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
}

.loading-subtext {
  color: #a0a0a0;
  font-size: 1rem;
  margin-top: 0.5rem;
}

.result-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.result-image-container {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(96, 165, 250, 0.3);
}

.result-image {
  max-width: 100%;
  max-height: 600px;
  display: block;
}

.result-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.download-button,
.retry-button,
.reset-all-button {
  padding: 0.875rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.download-button {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.download-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
}

.retry-button {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  color: #fff;
  box-shadow: 0 4px 15px rgba(96, 165, 250, 0.4);
}

.retry-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(96, 165, 250, 0.6);
}

.reset-all-button {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.reset-all-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.error-message {
  text-align: center;
  padding: 2rem;
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 12px;
  color: #fca5a5;
}

.error-message p {
  margin: 0 0 1rem;
  font-size: 1.1rem;
}

.error-button {
  padding: 0.75rem 1.5rem;
  background: rgba(220, 38, 38, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.error-button:hover {
  background: rgba(220, 38, 38, 0.3);
}

@media (max-width: 640px) {
  .title {
    font-size: 2.5rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .upload-section {
    padding: 2rem 1.5rem;
  }

  .dual-upload-container,
  .dual-preview-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .result-actions {
    flex-direction: column;
    width: 100%;
  }

  .download-button,
  .retry-button,
  .reset-all-button {
    width: 100%;
  }
}
</style>
